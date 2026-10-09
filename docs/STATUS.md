# Estado do projeto

Atualizado em 9 de outubro de 2026.

## Concluído

- Documentação do produto organizada na raiz e repositório público criado.
- Etapa 0: scaffold React, TypeScript strict e Vite, com tela em português.
- JPEG com MozJPEG, WebP com libwebp e PNG sem perdas com OxiPNG, em Web Worker.
- WASM empacotado no build de produção, sem CDN no bundle verificado.
- Preservação do original quando não há redução, conversão explícita mesmo com aumento, fundo obrigatório para JPEG com transparência e rejeição de animação.

## Não iniciado

- Fila, lote, ZIP, comparação com slider, redimensionamento e presets aplicados a um lote.
- PWA, cache offline e teste sem rede.
- AVIF e modo automático.
- Tauri, instalador Windows e testes de plataforma.
- Corpus real, comparação com TinyPNG e licença do projeto.

## Próximo passo

Etapa 1 do roadmap: MVP web com fila, presets na interface completa, resize, comparação e ZIP. O prompt está em `prompts/ETAPAS.md`.

## Registro de execução

| Data | Etapa | Comandos e ambiente | Resultado | Pendências |
| --- | --- | --- | --- | --- |
| 2026-10-09 | Preparação | Revisão documental | Kit extraído na raiz, sem pasta duplicada | — |
| 2026-10-09 | Repositório | `gh repo create` e push de `51e7ac8` | https://github.com/andreonemaia/pixelleve público | Licença do projeto ainda não escolhida |
| 2026-10-09 | 0 | Node 24.18.0, npm 11.16.0. `npm install`, `npm test`, `npm run lint`, `npm run test:motor` | Vitest: 9 testes. Lint sem erros. `test:motor` fez typecheck, build do Vite 8.3.4 com 7 WASM e 8 testes no Chrome 156.0.8078.4 | EXIF, fotos reais, TinyPNG, offline e lote não verificados |

O download do Chromium headless do Playwright falhou neste ambiente com `SELF_SIGNED_CERT_IN_CHAIN`. Os testes usaram o Google Chrome instalado (`channel: 'chrome'` no `playwright.config.ts`). O Chrome da máquina também recebeu pedidos do Kaspersky para scripts locais; o teste ignora esse host. O bundle da aplicação não referencia Kaspersky, analytics ou CDN. Não foi medido se o antivírus inspeciona o conteúdo dos arquivos fora do navegador.

A etapa 0 está concluída como prova técnica. A aplicação não está pronta para uso geral, não foi verificada offline e não é apresentada como superior ao TinyPNG.
