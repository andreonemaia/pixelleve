const RESERVADOS: &[&str] = &[
    "con", "prn", "aux", "nul", "com1", "com2", "com3", "com4", "com5", "com6", "com7", "com8",
    "com9", "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9",
];

pub fn sanitizar_relativo(caminho: &str) -> String {
    let mut limpas = Vec::new();
    for parte in caminho.replace('\\', "/").split('/') {
        if parte.is_empty() || parte == "." {
            continue;
        }
        if parte == ".." {
            limpas.pop();
            continue;
        }
        let mut limpa = String::new();
        for caractere in parte.chars() {
            let codigo = caractere as u32;
            limpa.push(if codigo < 32 || "<>:\"|?*".contains(caractere) {
                '_'
            } else {
                caractere
            });
        }
        let limpa = limpa.trim_start_matches('.').trim().to_string();
        limpas.push(if limpa.is_empty() {
            "arquivo".to_string()
        } else {
            limpa
        });
    }
    if limpas.is_empty() {
        "imagem".to_string()
    } else {
        limpas.join("/")
    }
}

pub fn evitar_reservado(caminho: &str) -> String {
    caminho
        .split('/')
        .map(|parte| {
            let ponto = parte.rfind('.');
            let (base, extensao) = match ponto {
                Some(indice) if indice > 0 => (&parte[..indice], &parte[indice..]),
                _ => (parte, ""),
            };
            if RESERVADOS.iter().any(|reservado| *reservado == base.to_ascii_lowercase()) {
                format!("{base}_{extensao}")
            } else {
                parte.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join("/")
}

pub fn com_sufixo(caminho: &str, indice: u32) -> String {
    let (pasta, nome) = match caminho.rfind('/') {
        Some(barra) => (&caminho[..=barra], &caminho[barra + 1..]),
        None => ("", caminho),
    };
    match nome.rfind('.') {
        Some(ponto) if ponto > 0 => {
            format!("{pasta}{} ({indice}){}", &nome[..ponto], &nome[ponto..])
        }
        _ => format!("{pasta}{nome} ({indice})"),
    }
}

pub fn proximo_nome_livre(caminho: &str, ocupado: impl Fn(&str) -> bool) -> String {
    let seguro = evitar_reservado(&sanitizar_relativo(caminho));
    let mut candidato = seguro.clone();
    let mut indice = 2;
    while ocupado(&candidato) {
        candidato = com_sufixo(&seguro, indice);
        indice += 1;
        if indice > 10_000 {
            break;
        }
    }
    candidato
}

pub fn codigo_io(erro: &std::io::Error) -> &'static str {
    match erro.kind() {
        std::io::ErrorKind::PermissionDenied => "sem-permissao",
        std::io::ErrorKind::NotFound => "caminho-invalido",
        _ => "falha",
    }
}

#[cfg(test)]
mod testes {
    use super::*;

    #[test]
    fn preserva_subpastas_e_barra_travessia() {
        assert_eq!(
            sanitizar_relativo("fotos/ferias/praia final.png"),
            "fotos/ferias/praia final.png"
        );
        assert_eq!(
            sanitizar_relativo(r"..\fotos\..\secreto.png"),
            "secreto.png"
        );
    }

    #[test]
    fn sufixo_nao_achata_pasta() {
        assert_eq!(com_sufixo("a/foto.webp", 2), "a/foto (2).webp");
    }

    #[test]
    fn nome_repetido_e_reservado() {
        let mut usados = std::collections::HashSet::new();
        let primeiro = proximo_nome_livre("a/foto.webp", |nome| usados.contains(&nome.to_ascii_lowercase()));
        usados.insert(primeiro.to_ascii_lowercase());
        let segundo = proximo_nome_livre("a/foto.webp", |nome| usados.contains(&nome.to_ascii_lowercase()));
        assert_eq!(primeiro, "a/foto.webp");
        assert_eq!(segundo, "a/foto (2).webp");
        assert_eq!(proximo_nome_livre("CON.png", |_| false), "CON_.png");
        assert_eq!(proximo_nome_livre("../fora.png", |_| false), "fora.png");
    }

    #[test]
    fn permissao_negada_tem_codigo_proprio() {
        let erro = std::io::Error::from(std::io::ErrorKind::PermissionDenied);
        assert_eq!(codigo_io(&erro), "sem-permissao");
    }
}
