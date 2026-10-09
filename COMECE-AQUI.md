# PixelLeve no Cursor

Vamos criar um compressor e conversor de imagens para web, com processamento no computador do usuário e uma interface agradável. A recomendação é construir uma aplicação web, torná-la instalável como PWA e reutilizar a mesma base em um aplicativo Windows com Tauri.

**Este pacote contém documentação e instruções de desenvolvimento. O aplicativo ainda não foi implementado.** PixelLeve é um nome provisório.

## O que vamos entregar

| Etapa | Resultado |
| --- | --- |
| 0 | Prova real dos codecs no navegador, incluindo build de produção |
| 1 | Aplicação web com lotes, PNG/JPEG/WebP, presets, comparação, resize e ZIP |
| 2 | Aplicação instalável como PWA e processamento offline verificado |
| 3 | AVIF e otimização automática para web após medir desempenho e qualidade |
| 4 | Aplicativo Windows com Tauri, seleção de arquivos e salvamento nativos |

Não há assinatura, login ou quota de compressões planejados. Haverá proteções técnicas de memória e tamanho, descritas na interface. A qualidade e a economia dependem de cada imagem; não vamos prometer superar o TinyPNG universalmente.

## Como começar

1. Extraia o ZIP em uma pasta, por exemplo `C:\Projetos\pixelleve`.
2. Abra a pasta que contém `README.md` e `AGENTS.md` no Cursor.
3. Confira que `.cursor/rules/project.mdc` foi extraído.
4. Abra uma conversa no modo Agent e cole o prompt abaixo.
5. Ao terminar, confira o relatório e rode a aplicação seguindo as instruções que o Cursor gerar. O primeiro resultado será uma tela simples para testar compressão real.
6. Para as próximas etapas, use os prompts de `prompts/ETAPAS.md`.

Você precisará de Node.js em uma versão LTS compatível com a versão de Vite selecionada, npm, Git e Cursor. Rust e ferramentas C++ serão necessários apenas na etapa desktop. O Cursor deve verificar as versões atuais e gravar as dependências em um lockfile.

## Primeiro prompt para colar no Cursor

```text
Você vai implementar o PixelLeve a partir da documentação presente nesta pasta.

Leia AGENTS.md, README.md, docs/PRODUTO.md, docs/ARQUITETURA.md,
docs/ROADMAP.md, docs/VALIDACAO.md e docs/FONTES.md.
Considere .cursor/rules/project.mdc.

Execute somente a etapa 0 do roadmap agora: scaffold e prova técnica real.
Antes de editar, apresente um plano curto e siga com a implementação sem
aguardar confirmação para escolhas rotineiras dentro desse escopo.

Preserve todos os arquivos de documentação existentes. Se já houver código,
inspecione-o e adapte-o; não sobrescreva o projeto com um scaffold novo.

Crie React + TypeScript strict + Vite. Use npm com lockfile.
Confira versões, requisitos de Node, APIs e licenças nas fontes oficiais.
Implemente uma tela simples com seleção de imagem estática PNG/JPEG/WebP,
preset, processamento real em Web Worker e download do resultado.
Prove JPEG com MozJPEG, WebP com libwebp e PNG sem perdas com OxiPNG.
Avalie os pacotes @jsquash correspondentes; não presuma que a integração
de WASM funcione sem verificar o build de produção.

Mantenha a lógica de compressão fora dos componentes.
As imagens não podem sair do dispositivo. Empacote JS e WASM localmente.
Não use APIs de compressão, CDN em runtime, backend, conta ou chave.
Não substitua silenciosamente um codec por Canvas.

Para manter o formato e as dimensões sem alterações pedidas, retenha o
original se o resultado não for menor. Para conversão explícita, entregue
o formato pedido e mostre inclusive eventual aumento de tamanho.
Não achate transparência ao converter para JPEG sem uma escolha de fundo.
Detecte e rejeite imagens animadas e arquivos inválidos com mensagens claras.

Crie scripts de dev, build, preview, typecheck, lint e testes.
Valide arquivos decodificáveis, MIME/extensão corretos, dimensões e alpha.
Teste ao menos uma foto, um PNG com transparência e um PNG com texto.
Não declare o app pronto, offline ou superior ao TinyPNG nesta etapa.

Registre versões e limitações em docs/DEPENDENCIAS.md, medições reais em
docs/BENCHMARK.md e progresso em docs/STATUS.md.
Se faltarem imagens reais para comparar com TinyPNG, use fixtures sintéticas
para integridade e mantenha a comparação externa como pendente.
Nunca invente medições, execuções de teste ou resultados.

Conclua a etapa 0 e apresente arquivos alterados, comandos executados,
resultados, limitações e instruções para rodar no Windows.
Não implemente as etapas seguintes, não publique e não faça push.
```

## Como acompanhar sem se perder

A fonte do andamento será `docs/STATUS.md`. Cada etapa termina com critérios verificáveis, atualização da documentação e um relato do que foi efetivamente executado.

A documentação explica os objetivos; o código e os testes demonstrarão o comportamento. Valores iniciais de qualidade e limites de memória são propostas, sujeitos às medições.

## Por que duas etapas de instalação

A PWA já pode oferecer uma janela própria e funcionamento offline após os recursos necessários estarem disponíveis. A experiência de instalação depende do navegador. Tauri acrescentará um instalador Windows e integração com seleção de pastas e salvamento nativo.

O desktop não será uma página remota dentro de uma janela: deve levar os recursos do app e codecs no pacote. A construção e os testes do instalador serão feitos no Windows.

Referências técnicas e data de consulta estão em `docs/FONTES.md`.
