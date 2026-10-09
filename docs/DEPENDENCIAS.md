# Dependências e ambiente

Atualizado em 9 de outubro de 2026, depois da instalação e do build de produção.

## Ambiente executado

| Item | Versão observada | Observação |
| --- | --- | --- |
| Node.js | 24.18.0 | Atende `^20.19.0 \|\| >=22.12.0`, exigido pelo Vite 8.3.4 |
| npm | 11.16.0 | Lockfile `package-lock.json` |
| Sistema | Windows 10.0.26300 | Máquina local do desenvolvimento |
| Navegador do teste de motor | Chrome 156.0.8078.4 na etapa 1; o Playwright 1.64.0 desta rodada usou o Google Chrome instalado | O preview web não substitui o WebView2 |
| rustc | 1.99.0 (b940084d7 2026-09-28) | Toolchain `stable-x86_64-pc-windows-msvc`, rustup 1.29.1 |
| cargo | 1.99.0 (5f94df478 2026-08-27) | Lockfile `src-tauri/Cargo.lock` |
| WebView2 Evergreen | 154.0.4258.62 | Já instalado nesta máquina. O instalador usa `downloadBootstrapper` se o runtime faltar |

TypeScript 7.0.2 é a versão `latest` no npm, mas `typescript-eslint` 8.71.1 declara peer `typescript >=4.8.4 <6.1.0`. O projeto usa TypeScript 6.0.3, a versão estável mais nova dentro desse limite.

## Dependências instaladas

| Item | Finalidade | Versão | Licença | Estado |
| --- | --- | --- | --- | --- |
| React / react-dom | Interface | 19.3.0 | MIT | Em uso |
| Vite | Build e worker | 8.3.4 | MIT | Build de produção gerou os WASM |
| @vitejs/plugin-react | JSX | 6.1.2 | MIT | Em uso |
| TypeScript | Contratos strict | 6.0.3 | Apache-2.0 | Em uso |
| Vitest | Testes de funções | 5.0.3 | MIT | 40 testes passaram em 9 de outubro de 2026 |
| ESLint / @eslint/js | Lint | 10.12.0 / 10.0.1 | MIT | Passou |
| typescript-eslint | Lint TypeScript | 8.71.1 | MIT | Passou |
| eslint-plugin-react-hooks | Hooks | 7.1.1 | MIT | Passou |
| globals | Ambiente do lint | 17.13.0 | MIT | Em uso |
| @types/react, @types/react-dom | Tipos | 19.3.0 | MIT | Em uso |
| @types/node | Tipos Node | 24.19.1 | MIT | Em uso |
| Playwright | Teste no Chrome | 1.64.0 | Apache-2.0 | 26 testes passaram no preview em 9 de outubro de 2026 |
| @tauri-apps/api | Chamadas do desktop | 2.12.0 | Apache-2.0 OR MIT | Dependência de runtime. O build web não abre janela nativa |
| @tauri-apps/cli | `tauri dev` e `tauri build` | 2.12.0 | Apache-2.0 OR MIT | Dev. Conferido no npm em 9 de outubro de 2026 |
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

O precache aceita no máximo 4 MiB por arquivo (`maximumFileSizeToCacheInBytes`). Em 9 de outubro de 2026 o build web listou 20 entradas e 1891,22 KiB. O maior WASM, `webp_enc_simd`, ficou em 345,58 KiB. Entram a interface, o CSS, o worker de processamento e os sete WASM dos codecs. `sw.js` e o runtime `workbox-*.js` são instalados com o registro do service worker; não estão na lista de precache. O cache não guarda imagens do usuário. `devOptions.enabled` permanece desligado. O build desktop, acionado quando `TAURI_ENV_PLATFORM` existe, não gera service worker.

## Crates do desktop

Conferidos no crates.io e nos `Cargo.toml` baixados em 9 de outubro de 2026. O plugin de diálogo em Rust não tem pacote JavaScript correspondente neste projeto. O `tauri-plugin-fs` 2.6.0 entra por dependência do diálogo e não é exposto ao frontend.

| Crate | Versão | Licença |
| --- | --- | --- |
| tauri | 2.12.2 | Apache-2.0 OR MIT |
| tauri-build | 2.7.1 | Apache-2.0 OR MIT |
| tauri-plugin-dialog | 2.8.1 | Apache-2.0 OR MIT |
| serde | 1.0.229 | MIT OR Apache-2.0 |

Não foi usada a linha 3.0.0-alpha do `tauri-build`. A versão estável encontrada foi 2.7.1.

## Ainda não instaladas

| Item | Estado |
| --- | --- |
| Tailwind CSS | Não instalado; a tela usa CSS próprio |
| @jsquash/resize | Não instalado. O redimensionamento usa média por área no worker. A filtragem pondera RGB pelo alpha e devolve alpha reto |
| @jsquash/avif | Etapa 3 |

A licença do código do PixelLeve continua sem escolha. O repositório público não inclui arquivo `LICENSE` do projeto.

## Windows

O desenvolvimento desktop precisa de Rust com alvo `x86_64-pc-windows-msvc`, das ferramentas C++ desse alvo e do WebView2. Referência: https://v2.tauri.app/start/prerequisites/

Nesta máquina o `tauri build` de release concluiu com rustc 1.99.0. Uma releitura com `vswhere -all` não listou um produto do Visual Studio, então a versão das Build Tools não fica registrada aqui. O WebView2 Evergreen 154.0.4258.62 já estava instalado.

O instalador é NSIS, `currentUser`, sem `certificateThumbprint`. `Get-AuthenticodeSignature` retornou `NotSigned`. O `webviewInstallMode` é `downloadBootstrapper`: se o runtime faltar, o instalador tenta baixá-lo. O aplicativo instalado não usa Vite, npm nem um frontend remoto. O arquivo gerado fica em `src-tauri/target/release/bundle/nsis/PixelLeve_0.1.0_x64-setup.exe` e não entra no Git.
