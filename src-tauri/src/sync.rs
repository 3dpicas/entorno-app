// Todo esto lo consume el comando `sync_now` de la Tarea 13; de momento solo lo
// tocan los tests, de ahí el allow.
#![allow(dead_code)]

use std::fs;
use std::path::Path;

#[derive(serde::Serialize, serde::Deserialize, Default, Clone)]
pub struct MetaContenido {
    pub sha: String,
    pub version: u64,
    pub fecha: String,
}

pub fn leer_meta(ruta: &Path) -> MetaContenido {
    fs::read_to_string(ruta)
        .ok()
        .and_then(|t| serde_json::from_str(&t).ok())
        .unwrap_or_default()
}

pub fn guardar_meta(ruta: &Path, meta: &MetaContenido) -> Result<(), String> {
    let texto = serde_json::to_string_pretty(meta).map_err(|e| e.to_string())?;
    fs::write(ruta, texto).map_err(|e| e.to_string())
}

pub fn validar_contenido(dir: &Path) -> Result<u64, String> {
    let texto = fs::read_to_string(dir.join("manifest.json"))
        .map_err(|e| format!("no se puede leer manifest.json: {e}"))?;
    let v: serde_json::Value =
        serde_json::from_str(&texto).map_err(|e| format!("manifest.json inválido: {e}"))?;
    let version = v["version"].as_u64().ok_or("manifest sin 'version' entera")?;
    let secciones = v["secciones"]
        .as_array()
        .filter(|s| !s.is_empty())
        .ok_or("manifest sin 'secciones'")?;
    for seccion in secciones {
        for tarjeta in tarjetas_de(seccion) {
            if tarjeta["tipo"] == "guia" {
                let rel = tarjeta["guia"].as_str().ok_or("tarjeta guia sin ruta")?;
                if !dir.join(rel).is_file() {
                    return Err(format!("guía referenciada no existe: {rel}"));
                }
            }
        }
    }
    Ok(version)
}

fn tarjetas_de(seccion: &serde_json::Value) -> Vec<&serde_json::Value> {
    let mut res = Vec::new();
    if let Some(ts) = seccion["tarjetas"].as_array() {
        res.extend(ts);
    }
    if let Some(gs) = seccion["grupos"].as_array() {
        for g in gs {
            if let Some(ts) = g["tarjetas"].as_array() {
                res.extend(ts);
            }
        }
    }
    res
}

pub fn reemplazar_contenido(dir_contenido: &Path, dir_nuevo: &Path) -> Result<(), String> {
    let viejo = dir_contenido.with_extension("old");
    if viejo.exists() {
        fs::remove_dir_all(&viejo).map_err(|e| e.to_string())?;
    }
    if dir_contenido.exists() {
        fs::rename(dir_contenido, &viejo)
            .map_err(|e| format!("no se pudo apartar el contenido actual: {e}"))?;
    }
    match fs::rename(dir_nuevo, dir_contenido) {
        Ok(_) => {
            let _ = fs::remove_dir_all(&viejo);
            Ok(())
        }
        Err(e) => {
            if viejo.exists() {
                let _ = fs::rename(&viejo, dir_contenido);
            }
            Err(format!("no se pudo activar el contenido nuevo: {e}"))
        }
    }
}

use std::path::PathBuf;

#[derive(serde::Serialize, Clone)]
pub struct EstadoSync {
    pub estado: String,
    pub sha: Option<String>,
    pub version: Option<u64>,
    pub fecha: Option<String>,
    pub detalle: Option<String>,
}

pub fn extraer_zip(bytes: &[u8], destino: &Path) -> Result<PathBuf, String> {
    let mut archivo =
        zip::ZipArchive::new(std::io::Cursor::new(bytes)).map_err(|e| e.to_string())?;
    archivo.extract(destino).map_err(|e| e.to_string())?;
    fs::read_dir(destino)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .find(|p| p.is_dir())
        .ok_or_else(|| "zip sin carpeta raíz".to_string())
}

async fn obtener_sha_remoto() -> Result<String, String> {
    let url = format!(
        "https://api.github.com/repos/{}/{}/commits/main",
        crate::config::GITHUB_OWNER,
        crate::config::REPO_CONTENIDO
    );
    let resp = reqwest::Client::new()
        .get(&url)
        .header("User-Agent", "entorno-papa")
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?;
    let v: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    v["sha"]
        .as_str()
        .map(String::from)
        .ok_or_else(|| "respuesta de GitHub sin sha".to_string())
}

async fn descargar_zip_remoto() -> Result<Vec<u8>, String> {
    let url = format!(
        "https://codeload.github.com/{}/{}/zip/refs/heads/main",
        crate::config::GITHUB_OWNER,
        crate::config::REPO_CONTENIDO
    );
    let resp = reqwest::Client::new()
        .get(&url)
        .header("User-Agent", "entorno-papa")
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?;
    Ok(resp.bytes().await.map_err(|e| e.to_string())?.to_vec())
}

fn ruta_meta(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    use tauri::Manager;
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("contenido_meta.json"))
}

#[tauri::command]
pub fn estado_sync(app: tauri::AppHandle) -> EstadoSync {
    match ruta_meta(&app) {
        Ok(ruta) => {
            let meta = leer_meta(&ruta);
            EstadoSync {
                estado: if meta.sha.is_empty() { "sin_datos".into() } else { "sin_cambios".into() },
                sha: Some(meta.sha),
                version: Some(meta.version),
                fecha: Some(meta.fecha),
                detalle: None,
            }
        }
        Err(e) => EstadoSync { estado: "error".into(), sha: None, version: None, fecha: None, detalle: Some(e) },
    }
}

#[tauri::command]
pub async fn sync_now(app: tauri::AppHandle) -> EstadoSync {
    if cfg!(debug_assertions) {
        return EstadoSync { estado: "dev".into(), sha: None, version: None, fecha: None, detalle: Some("sync desactivado en dev".into()) };
    }
    match sincronizar(&app).await {
        Ok(estado) => estado,
        Err(e) => {
            log::warn!("sync falló: {e}");
            EstadoSync { estado: "error".into(), sha: None, version: None, fecha: None, detalle: Some(e) }
        }
    }
}

async fn sincronizar(app: &tauri::AppHandle) -> Result<EstadoSync, String> {
    use tauri::Manager;
    let ruta_meta = ruta_meta(app)?;
    let meta = leer_meta(&ruta_meta);

    let sha = obtener_sha_remoto().await?;
    if sha == meta.sha {
        return Ok(EstadoSync {
            estado: "sin_cambios".into(),
            sha: Some(sha), version: Some(meta.version), fecha: Some(meta.fecha), detalle: None,
        });
    }

    let bytes = descargar_zip_remoto().await?;
    let temporal = app.path().app_data_dir().map_err(|e| e.to_string())?.join("descarga_tmp");
    if temporal.exists() {
        fs::remove_dir_all(&temporal).map_err(|e| e.to_string())?;
    }
    fs::create_dir_all(&temporal).map_err(|e| e.to_string())?;

    let raiz_nueva = extraer_zip(&bytes, &temporal)?;
    let version = validar_contenido(&raiz_nueva)?;

    let dir_actual = crate::contenido::dir_contenido(app)?;
    reemplazar_contenido(&dir_actual, &raiz_nueva)?;
    let _ = fs::remove_dir_all(&temporal);

    let fecha = chrono::Utc::now().to_rfc3339();
    let nueva_meta = MetaContenido { sha: sha.clone(), version, fecha: fecha.clone() };
    guardar_meta(&ruta_meta, &nueva_meta)?;

    log::info!("contenido actualizado a v{version} ({sha})");
    Ok(EstadoSync { estado: "actualizado".into(), sha: Some(sha), version: Some(version), fecha: Some(fecha), detalle: None })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn contenido_valido(dir: &std::path::Path) {
        fs::create_dir_all(dir.join("guias")).unwrap();
        fs::write(dir.join("guias/a.md"), "## Paso 1: Hola\nTexto.").unwrap();
        fs::write(
            dir.join("manifest.json"),
            r#"{"version":7,"secciones":[{"id":"x","titulo":"X","tarjetas":[{"tipo":"guia","titulo":"A","guia":"guias/a.md"}]}]}"#,
        )
        .unwrap();
    }

    #[test]
    fn valida_contenido_correcto() {
        let dir = tempfile::tempdir().unwrap();
        contenido_valido(dir.path());
        assert_eq!(validar_contenido(dir.path()).unwrap(), 7);
    }

    #[test]
    fn rechaza_manifest_invalido() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("manifest.json"), "{rotisimo").unwrap();
        assert!(validar_contenido(dir.path()).is_err());
    }

    #[test]
    fn rechaza_guia_ausente() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(
            dir.path().join("manifest.json"),
            r#"{"version":1,"secciones":[{"id":"x","titulo":"X","tarjetas":[{"tipo":"guia","titulo":"A","guia":"guias/no-existe.md"}]}]}"#,
        )
        .unwrap();
        let err = validar_contenido(dir.path()).unwrap_err();
        assert!(err.contains("no-existe.md"));
    }

    #[test]
    fn swap_reemplaza_y_borra_lo_viejo() {
        let base = tempfile::tempdir().unwrap();
        let actual = base.path().join("contenido");
        let nuevo = base.path().join("nuevo");
        fs::create_dir_all(&actual).unwrap();
        fs::write(actual.join("marca.txt"), "viejo").unwrap();
        fs::create_dir_all(&nuevo).unwrap();
        fs::write(nuevo.join("marca.txt"), "nuevo").unwrap();

        reemplazar_contenido(&actual, &nuevo).unwrap();
        assert_eq!(fs::read_to_string(actual.join("marca.txt")).unwrap(), "nuevo");
        assert!(!base.path().join("contenido.old").exists());
    }

    #[test]
    fn swap_funciona_sin_contenido_previo() {
        let base = tempfile::tempdir().unwrap();
        let actual = base.path().join("contenido");
        let nuevo = base.path().join("nuevo");
        fs::create_dir_all(&nuevo).unwrap();
        fs::write(nuevo.join("marca.txt"), "nuevo").unwrap();
        reemplazar_contenido(&actual, &nuevo).unwrap();
        assert!(actual.join("marca.txt").exists());
    }

    #[test]
    fn meta_ida_y_vuelta() {
        let dir = tempfile::tempdir().unwrap();
        let ruta = dir.path().join("contenido_meta.json");
        let meta = MetaContenido { sha: "abc123".into(), version: 7, fecha: "2026-07-26T10:00:00Z".into() };
        guardar_meta(&ruta, &meta).unwrap();
        let leida = leer_meta(&ruta);
        assert_eq!(leida.sha, "abc123");
        assert_eq!(leida.version, 7);
    }

    #[test]
    fn meta_ausente_devuelve_default() {
        let leida = leer_meta(std::path::Path::new("Z:/no/existe/meta.json"));
        assert_eq!(leida.sha, "");
    }

    #[test]
    fn extrae_zip_y_devuelve_raiz_interna() {
        let mut buf = Vec::new();
        {
            let mut zw = zip::ZipWriter::new(std::io::Cursor::new(&mut buf));
            let opciones: zip::write::SimpleFileOptions = Default::default();
            zw.add_directory("repo-main/", opciones).unwrap();
            zw.start_file("repo-main/manifest.json", opciones).unwrap();
            std::io::Write::write_all(&mut zw, b"{}").unwrap();
            zw.finish().unwrap();
        }
        let destino = tempfile::tempdir().unwrap();
        let raiz = extraer_zip(&buf, destino.path()).unwrap();
        assert!(raiz.ends_with("repo-main"));
        assert!(raiz.join("manifest.json").is_file());
    }
}
