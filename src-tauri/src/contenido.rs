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
