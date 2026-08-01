// Buscar en Internet abre Brave con una URL fija. La URL vive aquí, en Rust:
// el frontend no puede pasar ni programa ni dirección, así que este comando no
// sirve para ejecutar nada más.
use std::env;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

pub const URL_BUSQUEDA: &str = "https://search.brave.com/";
const RUTA_RELATIVA: &str = r"BraveSoftware\Brave-Browser\Application\brave.exe";

fn rutas_brave_desde(
    program_files: Option<&Path>,
    program_files_x86: Option<&Path>,
    local_app_data: Option<&Path>,
) -> Vec<PathBuf> {
    [program_files, program_files_x86, local_app_data]
        .into_iter()
        .flatten()
        .map(|base| base.join(RUTA_RELATIVA))
        .collect()
}

fn rutas_brave() -> Vec<PathBuf> {
    let program_files = env::var_os("ProgramFiles").map(PathBuf::from);
    let program_files_x86 = env::var_os("ProgramFiles(x86)").map(PathBuf::from);
    let local_app_data = env::var_os("LOCALAPPDATA").map(PathBuf::from);

    rutas_brave_desde(
        program_files.as_deref(),
        program_files_x86.as_deref(),
        local_app_data.as_deref(),
    )
}

fn localizar_brave(rutas: &[PathBuf]) -> Option<PathBuf> {
    rutas.iter().find(|ruta| ruta.is_file()).cloned()
}

#[tauri::command]
pub fn abrir_busqueda_brave() -> String {
    let Some(ruta) = localizar_brave(&rutas_brave()) else {
        log::warn!("[busqueda] Brave no encontrado");
        return "no_disponible".into();
    };

    // Sin heredar las tuberías de la app: Brave sobrevive a esta ventana y no
    // se queda sujetando handles nuestros.
    match Command::new(&ruta)
        .arg(URL_BUSQUEDA)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
    {
        Ok(_) => {
            log::info!("[busqueda] Brave abierto");
            "abierto".into()
        }
        Err(error) => {
            log::warn!("[busqueda] Brave no pudo abrirse: {error}");
            "no_disponible".into()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{localizar_brave, rutas_brave_desde, URL_BUSQUEDA};
    use std::fs;
    use std::path::{Path, PathBuf};
    use tempfile::tempdir;

    #[test]
    fn construye_rutas_en_orden_de_preferencia() {
        let rutas = rutas_brave_desde(
            Some(Path::new(r"C:\Program Files")),
            Some(Path::new(r"C:\Program Files (x86)")),
            Some(Path::new(r"C:\Users\Papa\AppData\Local")),
        );

        assert_eq!(
            rutas,
            vec![
                PathBuf::from(
                    r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
                ),
                PathBuf::from(
                    r"C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe"
                ),
                PathBuf::from(
                    r"C:\Users\Papa\AppData\Local\BraveSoftware\Brave-Browser\Application\brave.exe"
                ),
            ]
        );
    }

    #[test]
    fn elige_primera_ruta_que_existe() {
        let temp = tempdir().unwrap();
        let ausente = temp.path().join("uno").join("brave.exe");
        let presente = temp.path().join("dos").join("brave.exe");
        fs::create_dir_all(presente.parent().unwrap()).unwrap();
        fs::write(&presente, b"prueba").unwrap();

        assert_eq!(
            localizar_brave(&[ausente, presente.clone()]),
            Some(presente)
        );
    }

    #[test]
    fn url_de_busqueda_es_fija() {
        assert_eq!(URL_BUSQUEDA, "https://search.brave.com/");
    }
}
