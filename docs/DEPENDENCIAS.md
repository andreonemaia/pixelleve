# Dependências e ambiente

Atualizado em 9 de outubro de 2026, depois da instalação e do build de produção.

## Ambiente executado

| Item | Versão observada | Observação |
| --- | --- | --- |
| Node.js | 24.18.0 | Atende `^20.19.0 \|\| >=22.12.0`, exigido pelo Vite 8.3.4 |
| npm | 11.16.0 | Lockfile `package-lock.json` |
| Sistema | Windows 10.0.26300 | Máquina local do desenvolvimento |
| Navegador do teste de motor | Chrome 156.0.8078.4 | Google Chrome instalado, aberto pelo Playwright 1.64.0 |

TypeScript 7.0.2 é a versão `latest` no npm, mas `typescript-eslint` 8.71.1 declara peer `typescript >=4.8.4 <6.1.0`. O projeto usa TypeScript 6.0.3, a versão estável mais nova dentro desse limite.

## Dependências instaladas

| Item | Finalidade | Versão | Licença | Estado |
| --- | --- | --- | --- | --- |
| React / react-dom | Interface | 19.3.0 | MIT | Em uso |
| Vite | Build e worker | 8.3.4 | MIT | Build de produção gerou os WASM |
| @vitejs/plugin-react | JSX | 6.1.2 | MIT | Em uso |
| TypeScript | Contratos strict | 6.0.3 | Apache-2.0 | Em uso |
| Vitest | Testes de funções | 5.0.3 | MIT | 39 testes passaram em 9 de outubro de 2026 |
| ESLint / @eslint/js | Lint | 10.12.0 / 10.0.1 | MIT | Passou |
| typescript-eslint | Lint TypeScript | 8.71.1 | MIT | Passou |
| eslint-plugin-react-hooks | Hooks | 7.1.1 | MIT | Passou |
| globals | Ambiente do lint | 17.13.0 | MIT | Em uso |
| @types/react, @types/react-dom | Tipos | 19.3.0 | MIT | Em uso |
| @types/node | Tipos Node | 24.19.1 | MIT | Em uso |
| Playwright | Teste no Chrome | 1.64.0 | Apache-2.0 | 24 testes passaram no preview em 9 de outubro de 2026 |
| vite-plugin-pwa | Manifesto e service worker | 2.0.0 | MIT | Dev. Gera o precache no build; o servidor de desenvolvimento não registra o worker |
| workbox-build / workbox-window | Precache e registro | 7.4.1 | MIT | Dependências do plugin. `offlineGoogleAnalytics` fica desligado |
| @jsquash/jpeg | MozJPEG | 1.6.0 | Apache-2.0 no pacote | Encoder/decoder no worker |
| @jsquash/webp | libwebp | 1.5.0 | Apache-2.0 no pacote | Encoder/decoder no worker |
| @jsquash/png | PNG decode/encode | 3.1.1 | Apache-2.0 no pacote | Usado para decodificar e para PNG vindo de outro formato |
| @jsquash/oxipng | PNG sem perdas | 2.3.0 | Apache-2.0 no pacote | Build single-thread `codec/pkg` |

`wasm-feature-detect` entra por dependência de `@jsquash/webp` e `@jsquash/oxipng`. O worker consulta SIMD só para escolher entre `webp_enc.wasm` e `webp_enc_simd.wasm`. Os dois arquivos vão para `dist`. Esta execução não registrou qual dos dois o Chrome baixou.

## Codecs e avisos

O pacote `@jsquash/jpeg` inclui MozJPEG/libjpeg-turbo. A distribuição binária precisa deste aviso: este software é baseado em parte no trabalho do Independent JPEG Group. A licença BSD de 3 cláusulas do libjpeg-turbo está em `node_modules/@jsquash/jpeg/codec/LICENSE.codec.md`.

`@jsquash/webp` inclui libwebp, licença BSD. `@jsquash/oxipng` inclui OxiPNG, licença MIT de Joshua Holmer. O codec PNG do Squoosh no pacote `@jsquash/png` está sob a licença BSD do Google. Os wrappers jSquash estão sob Apache-2.0.

## ZIP

`fflate` 0.8.3, licença MIT. O lote é montado no navegador com `zipSync` no nível 0, porque as imagens já estão comprimidas. Não há envio do ZIP nem das imagens a um servidor.

## Variante WASM usada

OxiPNG roda pelo módulo single-thread `codec/pkg/squoosh_oxipng.js`, com o arquivo `squoosh_oxipng_bg.wasm` importado pelo Vite. Não usamos `pkg-parallel`, então esta prova não exige `SharedArrayBuffer`, COOP nem COEP. O preset Equilibrado usa nível 2; Leve usa 1; Máxima redução usa 3. `optimiseAlpha` fica desligado para não alterar RGB de pixels transparentes.

JPEG e WebP com perdas usam qualidades 85, 75 e 60. WebP sai com perdas e `alpha_quality` 100. A decodificação JPEG pede `preserveOrientation: true`. Não houve fixture com EXIF nesta etapa, então a rotação e a remoção de GPS não foram medidas.

O build de produção emite os WASM em `dist/assets` e o worker em um chunk local. Não há CDN em runtime no bundle verificado.

O precache aceita no máximo 4 MiB por arquivo (`maximumFileSizeToCacheInBytes`). Em 9 de outubro de 2026 o build listou 20 entradas e 1886,11 KiB. O maior WASM, `webp_enc_simd`, ficou em 345,58 KiB. Entram a interface, o CSS, o worker de processamento e os sete WASM dos codecs. `sw.js` e o runtime `workbox-*.js` são instalados com o registro do service worker; não estão na lista de precache. O cache não guarda imagens do usuário. `devOptions.enabled` permanece desligado.

## Ainda não instaladas

| Item | Estado |
| --- | --- |
| Tailwind CSS | Não instalado; a tela usa CSS próprio |
| @jsquash/resize | Não instalado. O redimensionamento usa média por área no worker. A filtragem pondera RGB pelo alpha e devolve alpha reto |
| @jsquash/avif | Etapa 3 |
| Tauri 2 | Etapa 4 |

A licença do código do PixelLeve continua sem escolha. O repositório público não inclui arquivo `LICENSE` do projeto.

## Windows futuro

Rust, Microsoft C++ Build Tools e WebView2 continuam necessários só para a etapa desktop. Referência: https://v2.tauri.app/start/prerequisites/
