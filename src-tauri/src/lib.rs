mod busqueda;
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
    // Rotación acotada: el PC del padre puede pasar años sin que nadie mire el
    // log, así que se limita a 1 MB por fichero y dos rotaciones guardadas.
    let log = tauri_plugin_log::Builder::new()
        .level(log::LevelFilter::Info)
        .max_file_size(1_000_000)
        .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepSome(2))
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
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(log.build())
        .setup(|app| {
            contenido::asegurar_contenido_inicial(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            busqueda::abrir_busqueda_brave,
            contenido::contenido_leer,
            contenido::contenido_ruta,
            sync::sync_now,
            sync::estado_sync,
            leer_log_reciente
        ])
        .run(tauri::generate_context!())
        .expect("error al arrancar la app");
}
