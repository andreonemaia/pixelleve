# Estado do projeto

Atualizado em 9 de outubro de 2026.

## Concluído

- Documentação do produto organizada na raiz e repositório público criado.
- Etapa 0: motor real com MozJPEG, libwebp e OxiPNG em Web Worker, WASM local e sem CDN no bundle verificado.
- Economia por imagem e do lote a partir dos bytes, com percentual global pela soma e “Economia até agora” só nos pares concluídos.
- Seleção múltipla, pasta com subpastas pelo botão e arraste de arquivo quando a API existe. Fila com um worker, comparação sob demanda, download individual e ZIP local.
- Cancelamento durante o OxiPNG de uma grade sintética de 1600×1200: o resultado não apareceu, a fila seguiu e a nova tentativa usou a configuração alterada.
- Redimensionamento proporcional, sem ampliação por padrão, com largura e altura máximas no snapshot do job.
- Comparação com slider por teclado, zoom sincronizado, “Ajustar à tela”, “100%” e fundo quadriculado. O diálogo fecha com Escape e devolve o foco.

## Não iniciado

- PWA, cache offline e teste sem rede.
- AVIF e modo automático.
- Tauri, instalador Windows e testes de plataforma.
- Corpus real, comparação com TinyPNG e licença do projeto.
- Arraste de pasta a partir do Explorer, imagens perto de 40 MiB ou 24 megapixels, EXIF e pico de memória do navegador.

## Próximo passo

Os recursos da etapa 1 estão na tela e passaram em fixtures sintéticas. A etapa não está validada por completo: faltam fotos reais, EXIF, arquivos perto dos limites e o arraste de pasta pelo Explorer. PWA, AVIF e Tauri continuam fora desta fila.

## Roteiro para resize e comparação

1. Rode `npm run dev` e abra o endereço que o Vite mostrar.
2. Adicione uma foto horizontal, uma vertical e um PNG transparente. Desmarque “Manter dimensões originais” e informe uma largura máxima menor que a foto.
3. Comprima o lote. Confira, em cada linha, as dimensões originais e as finais, e se a imagem menor que o limite continuou do mesmo tamanho.
4. Abra “Comparar”. Mova o slider com as setas, use “100%” e “Ajustar à tela”, e arraste a imagem para ver as duas andarem juntas. Escape fecha e devolve o foco.
5. Mude o limite e use “Tentar novamente”. O resultado deve sair do arquivo original, não da imagem já reduzida. No ZIP, o tamanho da economia é o das imagens, não o do arquivo compactado.

## Registro de execução

| Data | Etapa | Comandos e ambiente | Resultado | Pendências |
| --- | --- | --- | --- | --- |
| 2026-10-09 | Preparação | Revisão documental | Kit extraído na raiz, sem pasta duplicada | — |
| 2026-10-09 | Repositório | `gh repo create` e push de `51e7ac8` | https://github.com/andreonemaia/pixelleve público | Licença do projeto ainda não escolhida |
| 2026-10-09 | 0 | Node 24.18.0, npm 11.16.0. `npm install`, `npm test`, `npm run lint`, `npm run test:motor` | Vitest: 9 testes. Lint sem erros. `test:motor` fez typecheck, build do Vite 8.3.4 com 7 WASM e 8 testes no Chrome 156.0.8078.4 | EXIF, fotos reais, TinyPNG, offline e lote não verificados |
| 2026-10-09 | 1, fatia de lote | Node 24.18.0, npm 11.16.0. `npm run lint`, `npx vitest run`, `npm run test:motor` | Lint sem erros. Vitest: 20 testes. `test:motor`: typecheck, Vite 8.3.4, 7 WASM e 10 testes no Chrome 156.0.8078.4. Pasta de teste com 108 imagens em subpastas, 1 arquivo ignorado, falha no meio, ZIP com duas pastas. `texto.png` 151→107, primeira chamada 40 ms e três seguintes 2 ms | Resize, slider, zoom, arraste manual de pasta, cancelamento durante WASM longo, arquivo grande, offline, TinyPNG e EXIF não verificados |
| 2026-10-09 | Confiabilidade | Node 24.18.0, npm 11.16.0. `npx vitest run`, `npx eslint .`, `npm run test:motor` | Vitest: 21. Lint sem erros. Playwright: 14 testes no Chrome 156.0.8078.4, Vite 8.3.4. Grade 640×480: 392397→8321 bytes em 191 ms. A igualdade de pixels dessa rodada foi só a soma dos canais. Grade 1600×1200 cancelada ainda em “processando”; nova tentativa em WebP, 345150 bytes em 281 ms. ZIP: 47702 bytes de imagens e 48080 bytes no arquivo | Fotos reais, arraste de pasta no Explorer, arquivos perto dos limites, EXIF, pico de memória, resize, slider, offline, TinyPNG |
| 2026-10-09 | 1, resize e comparação | Node 24.18.0, npm 11.16.0. `npx vitest run`, `npx eslint .`, `npm run build`, `npx playwright test` no preview | Vitest: 34. Lint sem erros. Build Vite 8.3.4 e 7 WASM. Playwright: 21 testes no Chrome 156.0.8078.4. A grade 640×480 repetiu 392397→8321 bytes em 165 ms; cada canal RGBA coincidiu, não só a soma. Resize sintético, fila, ZIP, slider, zoom e Escape passaram | Fotos reais, EXIF, arraste de pasta no Explorer, arquivos perto dos limites, pico de memória, zoom visual a 200%, offline e TinyPNG |

O download do Chromium headless do Playwright falhou neste ambiente com `SELF_SIGNED_CERT_IN_CHAIN`. Os testes usaram o Google Chrome instalado (`channel: 'chrome'` no `playwright.config.ts`). O Chrome da máquina também recebeu pedidos do Kaspersky para scripts locais; o teste ignora esse host. O bundle da aplicação não referencia Kaspersky, analytics ou CDN. Não foi medido se o antivírus inspeciona o conteúdo dos arquivos fora do navegador.

A etapa 1 não está validada por completo. Redimensionar, zoom e slider estão implementados e foram exercitados com imagens sintéticas no preview de produção. Não há fotos reais, EXIF nem arraste de pasta pelo Explorer nesta rodada. A aplicação não está pronta para uso geral, não foi verificada offline e não é apresentada como superior ao TinyPNG. PWA, AVIF e Tauri não foram implementados.
