# Estado do projeto

Atualizado em 9 de outubro de 2026.

## Concluído

- Documentação do produto organizada na raiz e repositório público criado.
- Etapa 0: motor real com MozJPEG, libwebp e OxiPNG em Web Worker, WASM local e sem CDN no bundle verificado.
- Economia por imagem e do lote a partir dos bytes, com percentual global pela soma e “Economia até agora” só nos pares concluídos.
- Seleção múltipla, pasta com subpastas pelo botão e arraste de arquivo quando a API existe. Fila com um worker, comparação sob demanda, download individual e ZIP local.
- Cancelamento durante o OxiPNG de uma grade sintética de 1600×1200: o resultado não apareceu, a fila seguiu e a nova tentativa usou a configuração alterada.

## Não iniciado

- Redimensionamento, zoom comum e slider de comparação por teclado.
- PWA, cache offline e teste sem rede.
- AVIF e modo automático.
- Tauri, instalador Windows e testes de plataforma.
- Corpus real, comparação com TinyPNG e licença do projeto.
- Arraste de pasta a partir do Explorer, imagens perto de 40 MiB ou 24 megapixels, EXIF e pico de memória do navegador.

## Próximo passo

Completar o restante da etapa 1: redimensionar sem ampliar por padrão e a comparação com zoom e slider por teclado. Antes disso, o roteiro manual abaixo cobre fotos reais. PWA, AVIF e Tauri continuam fora desta fila.

## Roteiro para uma pasta sua

1. Na pasta do projeto, rode `npm run dev` e abra o endereço que o Vite mostrar.
2. Use “Escolher pasta” ou arraste a pasta do Explorer. Os originais não são alterados.
3. Deixe “Manter formato” e “Equilibrado”, clique em “Comprimir lote” e confira tamanho, economia e falhas de cada arquivo.
4. Abra “Comparar” numa foto, numa captura com texto e num PNG transparente. Num arquivo grande, cancele no meio e use “Tentar novamente” depois de mudar o formato.
5. Baixe o ZIP, extraia e confira as subpastas. O tamanho do ZIP não é a economia das imagens.

## Registro de execução

| Data | Etapa | Comandos e ambiente | Resultado | Pendências |
| --- | --- | --- | --- | --- |
| 2026-10-09 | Preparação | Revisão documental | Kit extraído na raiz, sem pasta duplicada | — |
| 2026-10-09 | Repositório | `gh repo create` e push de `51e7ac8` | https://github.com/andreonemaia/pixelleve público | Licença do projeto ainda não escolhida |
| 2026-10-09 | 0 | Node 24.18.0, npm 11.16.0. `npm install`, `npm test`, `npm run lint`, `npm run test:motor` | Vitest: 9 testes. Lint sem erros. `test:motor` fez typecheck, build do Vite 8.3.4 com 7 WASM e 8 testes no Chrome 156.0.8078.4 | EXIF, fotos reais, TinyPNG, offline e lote não verificados |
| 2026-10-09 | 1, fatia de lote | Node 24.18.0, npm 11.16.0. `npm run lint`, `npx vitest run`, `npm run test:motor` | Lint sem erros. Vitest: 20 testes. `test:motor`: typecheck, Vite 8.3.4, 7 WASM e 10 testes no Chrome 156.0.8078.4. Pasta de teste com 108 imagens em subpastas, 1 arquivo ignorado, falha no meio, ZIP com duas pastas. `texto.png` 151→107, primeira chamada 40 ms e três seguintes 2 ms | Resize, slider, zoom, arraste manual de pasta, cancelamento durante WASM longo, arquivo grande, offline, TinyPNG e EXIF não verificados |
| 2026-10-09 | Confiabilidade | Node 24.18.0, npm 11.16.0. `npx vitest run`, `npx eslint .`, `npm run test:motor` | Vitest: 21. Lint sem erros. Playwright: 14 testes no Chrome 156.0.8078.4, Vite 8.3.4. Grade 640×480: 392397→8321 bytes em 191 ms, pixels e alpha conferidos por soma. Grade 1600×1200 cancelada ainda em “processando”; nova tentativa em WebP, 345150 bytes em 281 ms. ZIP: 47702 bytes de imagens e 48080 bytes no arquivo | Fotos reais, arraste de pasta no Explorer, arquivos perto dos limites, EXIF, pico de memória, resize, slider, offline, TinyPNG |

O download do Chromium headless do Playwright falhou neste ambiente com `SELF_SIGNED_CERT_IN_CHAIN`. Os testes usaram o Google Chrome instalado (`channel: 'chrome'` no `playwright.config.ts`). O Chrome da máquina também recebeu pedidos do Kaspersky para scripts locais; o teste ignora esse host. O bundle da aplicação não referencia Kaspersky, analytics ou CDN. Não foi medido se o antivírus inspeciona o conteúdo dos arquivos fora do navegador.

A etapa 1 não está concluída: faltam redimensionar, zoom e slider. A aplicação não está pronta para uso geral, não foi verificada offline e não é apresentada como superior ao TinyPNG. PWA, AVIF e Tauri não foram implementados. Não há fotos reais nesta rodada.
