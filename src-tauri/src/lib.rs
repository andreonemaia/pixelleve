mod caminhos;
mod comandos;

use comandos::EstadoArquivos;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(EstadoArquivos::padrao())
        .invoke_handler(tauri::generate_handler![
            comandos::escolher_imagens,
            comandos::escolher_pasta,
            comandos::ler_arquivo,
            comandos::escolher_pasta_saida,
            comandos::gravar_resultado,
            comandos::salvar_arquivo,
        ])
        .run(tauri::generate_context!())
        .expect("falha ao abrir o PixelLeve");
}
