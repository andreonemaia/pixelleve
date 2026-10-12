use std::collections::HashSet;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use tauri::ipc::{InvokeBody, Request, Response};
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;

use crate::caminhos::{codigo_io, proximo_nome_livre, sanitizar_relativo};

const LIMITE_BYTES: u64 = 40 * 1024 * 1024;

#[derive(Default)]
struct Dados {
    entradas: HashSet<PathBuf>,
    pastas: Vec<PathBuf>,
    saida: Option<PathBuf>,
    reservados: HashSet<String>,
}

pub struct EstadoArquivos(Mutex<Dados>);

impl EstadoArquivos {
    pub fn padrao() -> Self {
        Self(Mutex::new(Dados::default()))
    }
}

#[derive(serde::Serialize)]
pub struct ArquivoListado {
    caminho: String,
    relativo: String,
    tamanho: u64,
}

#[tauri::command]
pub fn escolher_imagens(app: AppHandle, estado: State<'_, EstadoArquivos>) -> Result<Option<Vec<ArquivoListado>>, String> {
    let escolhidos = app
        .dialog()
        .file()
        .add_filter("Imagens", &["png", "jpg", "jpeg", "webp", "apng"])
        .set_title("Escolher imagens")
        .blocking_pick_files();
    let Some(arquivos) = escolhidos else {
        return Ok(None);
    };
    let mut lista = Vec::new();
    let mut dados = estado.0.lock().map_err(|_| "falha".to_string())?;
    for arquivo in arquivos {
        let caminho = caminho_de(arquivo)?;
        let real = canonical_ou(&caminho)?;
        dados.entradas.insert(real);
        let tamanho = metadata_tamanho(&caminho)?;
        lista.push(ArquivoListado {
            relativo: caminho
                .file_name()
                .map(|nome| nome.to_string_lossy().to_string())
                .unwrap_or_else(|| "imagem".to_string()),
            caminho: caminho.to_string_lossy().to_string(),
            tamanho,
        });
    }
    Ok(Some(lista))
}

#[tauri::command]
pub fn escolher_pasta(app: AppHandle, estado: State<'_, EstadoArquivos>) -> Result<Option<Vec<ArquivoListado>>, String> {
    let escolhida = app.dialog().file().set_title("Escolher pasta").blocking_pick_folder();
    let Some(pasta) = escolhida else {
        return Ok(None);
    };
    let caminho = caminho_de(pasta)?;
    let real = canonical_ou(&caminho)?;
    {
        let mut dados = estado.0.lock().map_err(|_| "falha".to_string())?;
        dados.pastas.push(real.clone());
    }
    let mut lista = Vec::new();
    visitar(&caminho, "", &real, &mut lista, &mut HashSet::new())?;
    Ok(Some(lista))
}

#[tauri::command]
pub fn ler_arquivo(estado: State<'_, EstadoArquivos>, caminho: String) -> Result<Response, String> {
    let caminho = PathBuf::from(caminho);
    let real = canonical_ou(&caminho)?;
    {
        let dados = estado.0.lock().map_err(|_| "falha".to_string())?;
        if !permitido(&dados, &real) {
            return Err("fora-da-pasta".to_string());
        }
    }
    let tamanho = metadata_tamanho(&caminho)?;
    if tamanho > LIMITE_BYTES {
        return Err("grande".to_string());
    }
    let bytes = fs::read(&caminho).map_err(|erro| codigo_io(&erro).to_string())?;
    Ok(Response::new(bytes))
}

#[tauri::command]
pub fn escolher_pasta_saida(app: AppHandle, estado: State<'_, EstadoArquivos>) -> Result<Option<String>, String> {
    let escolhida = app
        .dialog()
        .file()
        .set_title("Salvar resultados")
        .blocking_pick_folder();
    let Some(pasta) = escolhida else {
        return Ok(None);
    };
    let caminho = caminho_de(pasta)?;
    if !caminho.is_dir() {
        return Err("caminho-invalido".to_string());
    }
    let real = canonical_ou(&caminho)?;
    let mut dados = estado.0.lock().map_err(|_| "falha".to_string())?;
    dados.saida = Some(real);
    dados.reservados.clear();
    Ok(Some(caminho.to_string_lossy().to_string()))
}

#[tauri::command]
pub fn gravar_resultado(estado: State<'_, EstadoArquivos>, pedido: Request<'_>) -> Result<String, String> {
    let relativo = cabecalho(&pedido, "relativo")?;
    let bytes = bytes_do_pedido(&pedido)?;
    let mut dados = estado.0.lock().map_err(|_| "falha".to_string())?;
    let Some(raiz) = dados.saida.clone() else {
        return Err("caminho-invalido".to_string());
    };
    let entradas = dados.entradas.clone();
    let livre = {
        let ocupado = |candidato: &str| {
            dados.reservados.contains(&candidato.to_ascii_lowercase())
                || destino_existe(&raiz, candidato)
                || destino_e_original(&raiz, candidato, &entradas)
        };
        proximo_nome_livre(&relativo, ocupado)
    };
    let destino = juntar(&raiz, &livre)?;
    if destino_e_original_caminho(&destino, &entradas) {
        return Err("original-protegido".to_string());
    }
    if let Some(pai) = destino.parent() {
        fs::create_dir_all(pai).map_err(|erro| codigo_io(&erro).to_string())?;
    }
    conferir_dentro(&raiz, &destino)?;
    let mut arquivo = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&destino)
        .map_err(|erro| codigo_io(&erro).to_string())?;
    arquivo.write_all(&bytes).map_err(|erro| codigo_io(&erro).to_string())?;
    dados.reservados.insert(livre.to_ascii_lowercase());
    Ok(livre)
}

#[tauri::command]
pub fn salvar_arquivo(app: AppHandle, estado: State<'_, EstadoArquivos>, pedido: Request<'_>) -> Result<Option<String>, String> {
    let nome = cabecalho(&pedido, "nome")?;
    let bytes = bytes_do_pedido(&pedido)?;
    let extensao = nome.rsplit('.').next().unwrap_or("bin");
    let escolhido = app
        .dialog()
        .file()
        .set_title("Salvar arquivo")
        .set_file_name(&nome)
        .add_filter("Arquivo", &[extensao])
        .blocking_save_file();
    let Some(destino) = escolhido else {
        return Ok(None);
    };
    let caminho = caminho_de(destino)?;
    if let Some(pai) = caminho.parent() {
        if pai.as_os_str().is_empty() {
            return Err("caminho-invalido".to_string());
        }
    }
    let dados = estado.0.lock().map_err(|_| "falha".to_string())?;
    if destino_e_original_caminho(&caminho, &dados.entradas) {
        return Err("original-protegido".to_string());
    }
    drop(dados);
    if let Some(pai) = caminho.parent() {
        fs::create_dir_all(pai).map_err(|erro| codigo_io(&erro).to_string())?;
    }
    fs::write(&caminho, bytes).map_err(|erro| codigo_io(&erro).to_string())?;
    Ok(Some(caminho.to_string_lossy().to_string()))
}

fn visitar(
    atual: &Path,
    relativo: &str,
    raiz_real: &Path,
    saida: &mut Vec<ArquivoListado>,
    vistos: &mut HashSet<PathBuf>,
) -> Result<(), String> {
    let diretorio = fs::read_dir(atual).map_err(|erro| codigo_io(&erro).to_string())?;
    for entrada in diretorio {
        let entrada = entrada.map_err(|erro| codigo_io(&erro).to_string())?;
        let tipo = entrada.file_type().map_err(|erro| codigo_io(&erro).to_string())?;
        if tipo.is_symlink() {
            continue;
        }
        let nome = entrada.file_name().to_string_lossy().to_string();
        let proximo = if relativo.is_empty() {
            nome.clone()
        } else {
            format!("{relativo}/{nome}")
        };
        let caminho = entrada.path();
        if tipo.is_dir() {
            if let Ok(real) = caminho.canonicalize() {
                if !real.starts_with(raiz_real) || !vistos.insert(real) {
                    continue;
                }
            }
            visitar(&caminho, &proximo, raiz_real, saida, vistos)?;
            continue;
        }
        if !tipo.is_file() {
            continue;
        }
        let tamanho = metadata_tamanho(&caminho).unwrap_or(0);
        saida.push(ArquivoListado {
            caminho: caminho.to_string_lossy().to_string(),
            relativo: proximo,
            tamanho,
        });
    }
    Ok(())
}

fn permitido(dados: &Dados, real: &Path) -> bool {
    if dados.entradas.contains(real) {
        return true;
    }
    dados.pastas.iter().any(|pasta| real.starts_with(pasta))
}

fn caminho_de(arquivo: tauri_plugin_dialog::FilePath) -> Result<PathBuf, String> {
    arquivo.into_path().map_err(|erro| erro.to_string())
}

fn canonical_ou(caminho: &Path) -> Result<PathBuf, String> {
    caminho.canonicalize().map_err(|erro| codigo_io(&erro).to_string())
}

fn metadata_tamanho(caminho: &Path) -> Result<u64, String> {
    Ok(fs::metadata(caminho).map_err(|erro| codigo_io(&erro).to_string())?.len())
}

fn cabecalho(pedido: &Request<'_>, chave: &str) -> Result<String, String> {
    let valor = pedido
        .headers()
        .get(chave)
        .ok_or_else(|| "caminho-invalido".to_string())?;
    let texto = valor.to_str().map_err(|_| "caminho-invalido".to_string())?;
    Ok(decodificar(texto))
}

fn bytes_do_pedido(pedido: &Request<'_>) -> Result<Vec<u8>, String> {
    match pedido.body() {
        InvokeBody::Raw(bytes) => Ok(bytes.clone()),
        InvokeBody::Json(_) => Err("falha".to_string()),
    }
}

fn juntar(raiz: &Path, relativo: &str) -> Result<PathBuf, String> {
    let seguro = sanitizar_relativo(relativo);
    let mut destino = raiz.to_path_buf();
    for parte in seguro.split('/') {
        if parte.is_empty() || parte == "." || parte == ".." {
            return Err("caminho-invalido".to_string());
        }
        destino.push(parte);
    }
    Ok(destino)
}

fn conferir_dentro(raiz: &Path, destino: &Path) -> Result<(), String> {
    let raiz_real = canonical_ou(raiz)?;
    let pai = destino.parent().ok_or_else(|| "caminho-invalido".to_string())?;
    let pai_real = canonical_ou(pai)?;
    if pai_real.starts_with(&raiz_real) {
        Ok(())
    } else {
        Err("fora-da-pasta".to_string())
    }
}

fn destino_existe(raiz: &Path, relativo: &str) -> bool {
    juntar(raiz, relativo).map(|caminho| caminho.exists()).unwrap_or(false)
}

fn destino_e_original(raiz: &Path, relativo: &str, entradas: &HashSet<PathBuf>) -> bool {
    juntar(raiz, relativo)
        .ok()
        .map(|caminho| destino_e_original_caminho(&caminho, entradas))
        .unwrap_or(false)
}

fn destino_e_original_caminho(caminho: &Path, entradas: &HashSet<PathBuf>) -> bool {
    if entradas.is_empty() {
        return false;
    }
    match caminho.canonicalize() {
        Ok(real) => entradas.contains(&real),
        Err(_) => false,
    }
}

fn decodificar(valor: &str) -> String {
    let bytes = valor.as_bytes();
    let mut saida = Vec::new();
    let mut indice = 0;
    while indice < bytes.len() {
        if bytes[indice] == b'%' && indice + 2 < bytes.len() {
            if let Ok(byte) = u8::from_str_radix(
                std::str::from_utf8(&bytes[indice + 1..indice + 3]).unwrap_or(""),
                16,
            ) {
                saida.push(byte);
                indice += 3;
                continue;
            }
        }
        saida.push(bytes[indice]);
        indice += 1;
    }
    String::from_utf8_lossy(&saida).into_owned()
}
