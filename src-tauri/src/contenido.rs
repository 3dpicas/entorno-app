use std::path::PathBuf;

pub fn dir_contenido(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    #[cfg(debug_assertions)]
    {
        let _ = app;
        Ok(PathBuf::from(crate::config::DIR_CONTENIDO_DEV))
    }
    #[cfg(not(debug_assertions))]
    {
        use tauri::Manager;
        Ok(app
            .path()
            .app_data_dir()
            .map_err(|e| e.to_string())?
            .join("contenido"))
    }
}

fn resolver_seguro(app: &tauri::AppHandle, rel: &str) -> Result<PathBuf, String> {
    let base = dir_contenido(app)?
        .canonicalize()
        .map_err(|e| format!("dir de contenido no disponible: {e}"))?;
    let ruta = base
        .join(rel)
        .canonicalize()
        .map_err(|e| format!("recurso no existe: {rel}: {e}"))?;
    if !ruta.starts_with(&base) {
        return Err(format!("ruta fuera del contenido: {rel}"));
    }
    Ok(ruta)
}

#[tauri::command]
pub fn contenido_leer(app: tauri::AppHandle, rel: String) -> Result<String, String> {
    std::fs::read_to_string(resolver_seguro(&app, &rel)?).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn contenido_ruta(app: tauri::AppHandle, rel: String) -> Result<String, String> {
    Ok(resolver_seguro(&app, &rel)?.to_string_lossy().into_owned())
}

// Solo lo llama `asegurar_contenido_inicial`, que existe únicamente en release.
#[cfg_attr(debug_assertions, allow(dead_code))]
pub fn copiar_dir(origen: &std::path::Path, destino: &std::path::Path) -> Result<(), String> {
    std::fs::create_dir_all(destino).map_err(|e| e.to_string())?;
    for entrada in std::fs::read_dir(origen).map_err(|e| e.to_string())? {
        let entrada = entrada.map_err(|e| e.to_string())?;
        let dest = destino.join(entrada.file_name());
        if entrada.path().is_dir() {
            copiar_dir(&entrada.path(), &dest)?;
        } else {
            std::fs::copy(entrada.path(), &dest).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

/// En el primer arranque de una build de producción, `<appdata>/contenido` no
/// existe: se copia ahí la semilla empaquetada para que la app funcione aunque
/// no haya red. En dev no aplica, porque el contenido sale del repo local.
pub fn asegurar_contenido_inicial(app: &tauri::AppHandle) {
    #[cfg(not(debug_assertions))]
    {
        use tauri::Manager;
        let Ok(destino) = dir_contenido(app) else { return };
        if destino.join("manifest.json").exists() {
            return;
        }
        // Tauri empaqueta los recursos declarados con `../` bajo `_up_/`. Se
        // prueban las dos rutas para no depender de esa convención.
        let Ok(dir_recursos) = app.path().resource_dir() else { return };
        let candidatas = [
            dir_recursos.join("_up_/recursos/contenido-semilla"),
            dir_recursos.join("recursos/contenido-semilla"),
        ];
        let Some(semilla) = candidatas.iter().find(|p| p.join("manifest.json").is_file()) else {
            log::warn!("no se encontró la semilla en {}", dir_recursos.display());
            return;
        };
        if let Err(e) = copiar_dir(semilla, &destino) {
            log::warn!("no se pudo copiar la semilla: {e}");
        } else {
            log::info!("contenido semilla copiado a {}", destino.display());
        }
    }
    #[cfg(debug_assertions)]
    let _ = app;
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn copia_directorio_recursivo() {
        let origen = tempfile::tempdir().unwrap();
        fs::create_dir_all(origen.path().join("sub")).unwrap();
        fs::write(origen.path().join("a.txt"), "hola").unwrap();
        fs::write(origen.path().join("sub/b.txt"), "adios").unwrap();

        let destino = tempfile::tempdir().unwrap();
        let dest = destino.path().join("copia");
        copiar_dir(origen.path(), &dest).unwrap();
        assert_eq!(fs::read_to_string(dest.join("a.txt")).unwrap(), "hola");
        assert_eq!(fs::read_to_string(dest.join("sub/b.txt")).unwrap(), "adios");
    }
}
