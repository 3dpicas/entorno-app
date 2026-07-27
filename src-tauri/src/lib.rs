mod config;
mod contenido;
mod sync;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            contenido::contenido_leer,
            contenido::contenido_ruta,
            sync::sync_now,
            sync::estado_sync
        ])
        .run(tauri::generate_context!())
        .expect("error al arrancar la app");
}
