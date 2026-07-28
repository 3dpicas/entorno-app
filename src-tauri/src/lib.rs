mod config;
mod contenido;
mod sync;

/// Últimas 50 líneas del log, para la pantalla de administración. Nunca falla:
/// si no hay log todavía devuelve una lista vacía.
#[tauri::command]
fn leer_log_reciente(app: tauri::AppHandle) -> Vec<String> {
    use tauri::Manager;
    let Ok(dir) = app.path().app_log_dir() else {
        return vec![];
    };
    let ruta = dir.join("entorno.log");
    let Ok(texto) = std::fs::read_to_string(&ruta) else {
        return vec![];
    };
    texto
        .lines()
        .rev()
        .take(50)
        .map(String::from)
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .collect()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // El log va a fichero también en producción: es lo único que queda cuando
    // algo falla en el PC del padre, porque él nunca ve mensajes de error.
    let log = tauri_plugin_log::Builder::new()
        .level(log::LevelFilter::Info)
        .target(tauri_plugin_log::Target::new(
            tauri_plugin_log::TargetKind::LogDir {
                file_name: Some("entorno".into()),
            },
        ));
    #[cfg(debug_assertions)]
    let log = log.target(tauri_plugin_log::Target::new(
        tauri_plugin_log::TargetKind::Stdout,
    ));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(log.build())
        .setup(|app| {
            contenido::asegurar_contenido_inicial(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            contenido::contenido_leer,
            contenido::contenido_ruta,
            sync::sync_now,
            sync::estado_sync,
            leer_log_reciente
        ])
        .run(tauri::generate_context!())
        .expect("error al arrancar la app");
}
