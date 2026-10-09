# Estado do projeto

Atualizado em 9 de outubro de 2026.

## Concluído

- Documentação do produto organizada na raiz e repositório público criado.
- Etapa 0: motor real com MozJPEG, libwebp e OxiPNG em Web Worker, WASM local e sem CDN no bundle verificado.
- Economia por imagem e do lote a partir dos bytes, com percentual global pela soma e “Economia até agora” só nos pares concluídos.
- Seleção múltipla, pasta com subpastas e arraste quando a API existe. Fila com um worker, comparação sob demanda, download individual e ZIP local.

## Não iniciado

- Redimensionamento, zoom comum e slider de comparação por teclado.
- PWA, cache offline e teste sem rede.
- AVIF e modo automático.
- Tauri, instalador Windows e testes de plataforma.
- Corpus real, comparação com TinyPNG e licença do projeto.
- Arraste manual de uma pasta no navegador e cancelamento no meio de um WASM longo. A enumeração acima de 100 arquivos e o estado de cancelamento foram testados à parte, como registrado abaixo.

## Próximo passo

Completar o restante da etapa 1: redimensionar sem ampliar por padrão e a comparação com zoom e slider por teclado. PWA, AVIF e Tauri continuam fora desta fila.

## Registro de execução

| Data | Etapa | Comandos e ambiente | Resultado | Pendências |
| --- | --- | --- | --- | --- |
| 2026-10-09 | Preparação | Revisão documental | Kit extraído na raiz, sem pasta duplicada | — |
| 2026-10-09 | Repositório | `gh repo create` e push de `51e7ac8` | https://github.com/andreonemaia/pixelleve público | Licença do projeto ainda não escolhida |
| 2026-10-09 | 0 | Node 24.18.0, npm 11.16.0. `npm install`, `npm test`, `npm run lint`, `npm run test:motor` | Vitest: 9 testes. Lint sem erros. `test:motor` fez typecheck, build do Vite 8.3.4 com 7 WASM e 8 testes no Chrome 156.0.8078.4 | EXIF, fotos reais, TinyPNG, offline e lote não verificados |
| 2026-10-09 | 1, fatia de lote | Node 24.18.0, npm 11.16.0. `npm run lint`, `npx vitest run`, `npm run test:motor` | Lint sem erros. Vitest: 20 testes. `test:motor`: typecheck, Vite 8.3.4, 7 WASM e 10 testes no Chrome 156.0.8078.4. Pasta de teste com 108 imagens em subpastas, 1 arquivo ignorado, falha no meio, ZIP com duas pastas. `texto.png` 151→107, primeira chamada 40 ms e três seguintes 2 ms | Resize, slider, zoom, arraste manual de pasta, cancelamento durante WASM longo, arquivo grande, offline, TinyPNG e EXIF não verificados |

O download do Chromium headless do Playwright falhou neste ambiente com `SELF_SIGNED_CERT_IN_CHAIN`. Os testes usaram o Google Chrome instalado (`channel: 'chrome'` no `playwright.config.ts`). O Chrome da máquina também recebeu pedidos do Kaspersky para scripts locais; o teste ignora esse host. O bundle da aplicação não referencia Kaspersky, analytics ou CDN. Não foi medido se o antivírus inspeciona o conteúdo dos arquivos fora do navegador.

A etapa 0 permanece válida como motor. A tela agora é de lote, não uma prova de imagem única. A aplicação não está pronta para uso geral, não foi verificada offline e não é apresentada como superior ao TinyPNG. PWA, AVIF e Tauri não foram implementados.
