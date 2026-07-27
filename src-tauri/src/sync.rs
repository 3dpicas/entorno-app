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
}
