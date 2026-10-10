# Estado do projeto

Atualizado em 10 de outubro de 2026.

## Concluído

- Documentação do produto organizada na raiz e repositório público criado.
- Etapa 0: motor real com MozJPEG, libwebp e OxiPNG em Web Worker, WASM local e sem CDN no bundle verificado.
- Economia por imagem e do lote a partir dos bytes, com percentual global pela soma e “Economia até agora” só nos pares concluídos.
- Seleção múltipla, pasta com subpastas pelo botão e arraste de arquivo quando a API existe. Fila com um worker, comparação sob demanda, download individual e ZIP local.
- Cancelamento durante o OxiPNG de uma grade sintética de 1600×1200: o resultado não apareceu, a fila seguiu e a nova tentativa usou a configuração alterada.
- Redimensionamento proporcional, sem ampliação por padrão, com largura e altura máximas no snapshot do job.
- Comparação com slider por teclado, zoom sincronizado, “Ajustar à tela”, “100%” e fundo quadriculado. O diálogo fecha com Escape e devolve o foco.
- Redimensionamento por média de área pondera RGB pela transparência e devolve alpha reto. Pixels totalmente transparentes não entram na cor visível.
- PWA no build de produção: manifesto `standalone`, ícones locais, service worker com registro `prompt` e precache da interface, do worker e dos sete WASM. O aviso “Pronto para usar offline” só aparece depois que esses codecs estão no cache.
- Aviso de atualização da PWA: “Atualizar agora” fica desativado durante processamento e exportação. Se a sessão tem imagens ou resultados, a tela avisa que a recarga apaga o que não foi salvo fora do aplicativo e oferece “Continuar nesta versão”. A fila ociosa com itens continua sendo sessão com conteúdo. As imagens não são gravadas para contornar a recarga.
- Tela compacta no mesmo CSS da web e do desktop: fonte do sistema, painel de configuração ao lado a partir de 1024 px e economia calculada dos bytes como resultado principal. Aumento e economia zero não usam a cor de sucesso.
- Instalador 0.1.1, com essa tela e os codecs locais, em `src-tauri/target/release/bundle/nsis/PixelLeve_0.1.1_x64-setup.exe`. 2.617.614 bytes, SHA-256 `91961E3CEDBB4C7687583D2B3F1FB0145D86A03F12AF1A6E54D9F7480AEA073A`, 10 de outubro de 2026 às 01:04, `NotSigned`. A 0.1.0 de 9 de outubro às 17:51 continua no diretório e não herda esta prova.

## Implementado, com validação incompleta

- Desktop Windows no mesmo projeto: Tauri 2, diálogos nativos para várias imagens, pasta com subpastas, salvamento individual, ZIP e pasta de saída. Originais não são sobrescritos. Colisão de nome ganha sufixo. Cancelar o diálogo é uma ação normal. A permissão de arquivo fica limitada aos caminhos escolhidos na sessão. A leitura e a gravação de pasta seguem um arquivo por vez.
- O build desktop empacota a interface e os sete WASM em `dist-desktop`, sem service worker e sem controles de instalação da PWA. O `npm run build` da web continua gerando `dist` com a PWA.
- O instalador 0.1.0, NSIS por usuário e sem assinatura, foi a prova de 9 de outubro. O arquivo atual é o 0.1.1, no caminho citado acima.

## Validado no aplicativo instalado

No WebView2 154.0.4258.62, com o Vite parado, sobre o instalador de 9 de outubro de 2026 às 17:51 (2.617.052 bytes, `NotSigned`). Esses resultados são da tela anterior. A tela compacta desta data foi vista no `npm run desktop:dev`, não nesse instalador. A interface foi conduzida pela porta de depuração do WebView2; essa porta não faz parte do uso normal.

- PNG com transparência: 106→105 bytes, 32×32, arquivo salvo com `tRNS`.
- Redimensionamento: 200×100 passou a 100×50, 566→98 bytes.
- JPEG com fundo explícito: 566→478 bytes, 100×50, `image/jpeg`, arquivo com marcador JPEG.
- WebP: 138 bytes, 100×50, `image/webp`, arquivo RIFF/WEBP. Reprocessar leu o JPEG (478→477) e o WebP (138→134).
- ZIP de 463 bytes com `alfa.png` e `horizontal.webp`.
- Pasta com duas `foto.png` em subpastas; `nota.txt` ficou de fora. A colisão gravou `foto (2).png` e manteve o arquivo que já existia.
- Cancelamento durante PNG de 1600×1200 e nova tentativa em WebP: 852004→19794 bytes, 1600×1200.
- Diálogos de imagem e de pasta cancelados, com a mensagem “Seleção cancelada.”.
- Pasta sem permissão de leitura: aviso de permissão e a linha já concluída permaneceu.
- Os cinco originais de teste mantiveram tamanho e SHA-256.
- Desinstalação silenciosa saiu com código 0, os arquivos de teste continuaram iguais e a reinstalação do mesmo instalador saiu com código 0. A janela reaberta respondeu, sem Vite.

## Validado no instalador 0.1.1

Prova própria, em 10 de outubro de 2026, no WebView2 154.0.4258.62. O Vite e o preview estavam parados. A instalação `/S` saiu com código 0 e o atalho do Menu Iniciar abriu `%LOCALAPPDATA%\PixelLeve\pixelleve.exe`, versão de produto 0.1.1. A interface foi conduzida pela porta de depuração, só nesta prova. Esses números não se aplicam ao instalador 0.1.0.

- Estado vazio com Segoe UI, fundo `#F6F7F4`, resumo sem números inventados e sem barra de instalação da PWA. Os botões eram “Salvar lote em ZIP”, “Salvar seleção” e “Salvar em pasta”.
- PNG com transparência, 123 bytes e 32×32, redimensionado para JPEG 16×16 com fundo explícito: 395 bytes, estado maior, “Aumentou 272 B · 221,1%”. O aviso de transparência ficou visível. O arquivo salvo começa com marcador JPEG.
- Nova tentativa em WebP: 123→120 bytes, 16×16, arquivo RIFF/WEBP.
- Os diálogos importaram esse JPEG, esse WebP e o PNG original.
- Pasta com `um/foto.png`, `dois/foto.png` e `nota.txt`: só as duas imagens entraram. O lote ficou 5,6 KB → 306 B, “Economizou 5,3 KB · 94,6%”.
- ZIP de 528 bytes com `dois/foto.png` (107) e `um/foto.png` (199). A pasta de saída repetiu esses dois arquivos e esses tamanhos.
- Os quatro originais de teste mantiveram o SHA-256 de antes da sessão.

Não foram repetidos, nesta versão, o cancelamento longo, a pasta sem permissão, a desinstalação e o processamento com a rede desligada. `Disable-NetAdapter` no adaptador Ethernet retornou acesso negado. O adaptador permaneceu ligado.

## Não iniciado

- AVIF e modo automático.
- Abrir o aplicativo instalado e processar uma imagem com a rede desligada.
- Corpus real, comparação com TinyPNG e licença do projeto.
- Arraste de pasta a partir do Explorer, imagens perto de 40 MiB ou 24 megapixels, EXIF e pico de memória do navegador.
- Diálogo nativo de instalação da PWA e fechar/reabrir a janela instalada da PWA.

## Próximo passo

A etapa 1 continua aberta: faltam fotos reais, EXIF, arquivos perto dos limites e o arraste de pasta pelo Explorer. A PWA do preview foi recarregada sem rede; o diálogo nativo de instalação e a janela instalada da PWA continuam pendentes. O instalador 0.1.1 processou PNG, JPEG e WebP no WebView2 e salvou ZIP e pasta. Falta abrir esse aplicativo com a rede desligada. AVIF não começou.

## Roteiro para resize e comparação

1. Rode `npm run dev` e abra o endereço que o Vite mostrar.
2. Adicione uma foto horizontal, uma vertical e um PNG transparente. Desmarque “Manter dimensões originais” e informe uma largura máxima menor que a foto.
3. Comprima o lote. Confira, em cada linha, as dimensões originais e as finais, e se a imagem menor que o limite continuou do mesmo tamanho.
4. Abra “Comparar”. Mova o slider com as setas, use “100%” e “Ajustar à tela”, e arraste a imagem para ver as duas andarem juntas. Escape fecha e devolve o foco.
5. Mude o limite e use “Tentar novamente”. O resultado deve sair do arquivo original, não da imagem já reduzida. No ZIP, o tamanho da economia é o das imagens, não o do arquivo compactado.

## Roteiro para a versão instalada

1. Encerre `npm run dev` e `npm run preview`.
2. Execute `src-tauri/target/release/bundle/nsis/PixelLeve_0.1.1_x64-setup.exe`. A instalação é por usuário e o instalador não está assinado. A cópia 0.1.0 no mesmo diretório é o build anterior.
3. Desconecte a rede e abra o atalho PixelLeve, sem subir o Vite. Este passo ainda não foi executado na 0.1.1: `Disable-NetAdapter` retornou acesso negado. Se o WebView2 Evergreen não existir, o instalador tenta baixar o bootstrapper e essa etapa precisa de rede antes.
4. Escolha um PNG com transparência, um JPEG e um WebP. Redimensione. Confira se o original no disco não mudou.
5. Escolha uma pasta com subpastas e dois arquivos de mesmo nome. Cancele um diálogo e repita a escolha.
6. Salve uma imagem, o ZIP e os resultados numa pasta. Repita um nome que já exista na pasta de saída e confira o sufixo, sem sobrescrita silenciosa.
7. Tente uma pasta sem permissão de leitura. A operação deve falhar com aviso, sem descartar o restante da sessão.
8. Desinstale pelo `uninstall.exe` em `%LOCALAPPDATA%\PixelLeve` quando o roteiro terminar.

Os itens 4 a 8 da 0.1.0 foram executados em 9 de outubro de 2026 com a rede disponível. Na 0.1.1, em 10 de outubro, foram repetidos de forma curta o layout, PNG com transparência e redimensionamento, JPEG, WebP, pasta com subpastas, salvamento individual, ZIP, pasta de saída e a preservação dos originais. O item 3, com a rede desligada, continua pendente.

## Registro de execução

| Data | Etapa | Comandos e ambiente | Resultado | Pendências |
| --- | --- | --- | --- | --- |
| 2026-10-09 | Preparação | Revisão documental | Kit extraído na raiz, sem pasta duplicada | — |
| 2026-10-09 | Repositório | `gh repo create` e push de `51e7ac8` | https://github.com/andreonemaia/pixelleve público | Licença do projeto ainda não escolhida |
| 2026-10-09 | 0 | Node 24.18.0, npm 11.16.0. `npm install`, `npm test`, `npm run lint`, `npm run test:motor` | Vitest: 9 testes. Lint sem erros. `test:motor` fez typecheck, build do Vite 8.3.4 com 7 WASM e 8 testes no Chrome 156.0.8078.4 | EXIF, fotos reais, TinyPNG, offline e lote não verificados |
| 2026-10-09 | 1, fatia de lote | Node 24.18.0, npm 11.16.0. `npm run lint`, `npx vitest run`, `npm run test:motor` | Lint sem erros. Vitest: 20 testes. `test:motor`: typecheck, Vite 8.3.4, 7 WASM e 10 testes no Chrome 156.0.8078.4. Pasta de teste com 108 imagens em subpastas, 1 arquivo ignorado, falha no meio, ZIP com duas pastas. `texto.png` 151→107, primeira chamada 40 ms e três seguintes 2 ms | Resize, slider, zoom, arraste manual de pasta, cancelamento durante WASM longo, arquivo grande, offline, TinyPNG e EXIF não verificados |
| 2026-10-09 | Confiabilidade | Node 24.18.0, npm 11.16.0. `npx vitest run`, `npx eslint .`, `npm run test:motor` | Vitest: 21. Lint sem erros. Playwright: 14 testes no Chrome 156.0.8078.4, Vite 8.3.4. Grade 640×480: 392397→8321 bytes em 191 ms. A igualdade de pixels dessa rodada foi só a soma dos canais. Grade 1600×1200 cancelada ainda em “processando”; nova tentativa em WebP, 345150 bytes em 281 ms. ZIP: 47702 bytes de imagens e 48080 bytes no arquivo | Fotos reais, arraste de pasta no Explorer, arquivos perto dos limites, EXIF, pico de memória, resize, slider, offline, TinyPNG |
| 2026-10-09 | 1, resize e comparação | Node 24.18.0, npm 11.16.0. `npx vitest run`, `npx eslint .`, `npm run build`, `npx playwright test` no preview | Vitest: 34. Lint sem erros. Build Vite 8.3.4 e 7 WASM. Playwright: 21 testes no Chrome 156.0.8078.4. A grade 640×480 repetiu 392397→8321 bytes em 165 ms; cada canal RGBA coincidiu, não só a soma. Resize sintético, fila, ZIP, slider, zoom e Escape passaram | Fotos reais, EXIF, arraste de pasta no Explorer, arquivos perto dos limites, pico de memória, zoom visual a 200%, offline e TinyPNG |
| 2026-10-09 | 2, transparência do resize e PWA | Node 24.18.0, npm 11.16.0. `npx vitest run`, `npx eslint .`, `npm run test:motor` no preview `http://127.0.0.1:4173` | Vitest: 39. Lint sem erros. Vite 8.3.4, precache de 20 entradas e 1886,11 KiB, maior WASM 345,58 KiB, limite de 4 MiB por arquivo. Playwright: 24 testes no Google Chrome instalado. O cálculo de alpha já ponderava a cor; os testes novos cobrem vermelho opaco com preto transparente, com azul transparente e com transparência parcial, compostos em fundo claro e escuro. Sem rede, o preview recarregou, importou imagens novas e gerou JPEG, WebP, PNG redimensionado e ZIP. O aviso de atualização apareceu e o botão ficou desativado durante o processamento, sem navegar | Instalação nativa não oferecida neste Chrome automatizado (`beforeinstallprompt` não disparou; a tela mostrou a orientação do menu). Fechar e reabrir a janela instalada não foi feito. O clique em “Atualizar agora” com a fila ociosa não foi executado. Pendências manuais da etapa 1 permanecem: fotos reais, EXIF, arraste de pasta no Explorer, arquivos perto de 40 MiB ou 24 megapixels, pico de memória, zoom visual a 200% e TinyPNG |
| 2026-10-09 | 2, aceite e cancelamento da atualização | Node 24.18.0, npm 11.16.0. `npx vitest run`, `npx eslint .`, `npm run test:motor` no preview `http://127.0.0.1:4173` | Vitest: 40. Lint sem erros. Vite 8.3.4, precache de 20 entradas e 1891,22 KiB, maior WASM 345,58 KiB. Playwright: 26 testes no Google Chrome instalado. Com resultado concluído, “Continuar nesta versão” manteve a linha e “Atualizar agora” recarregou e esvaziou a sessão. O bloqueio durante o processamento e a recarga offline continuaram passando | O diálogo nativo de instalação da PWA não disparou. Fechar e reabrir a janela instalada da PWA não foi feito. Pendências manuais da etapa 1 permanecem |
| 2026-10-09 | 4, desktop Windows | rustc 1.99.0, cargo 1.99.0, host `x86_64-pc-windows-msvc`, WebView2 154.0.4258.62. `cargo test` e `npm run desktop:build` | `cargo test`: 4 testes de caminho e código de permissão. O frontend desktop teve 44 módulos, os sete WASM e nenhum service worker. O instalador NSIS não assinado ficou em `src-tauri/target/release/bundle/nsis/PixelLeve_0.1.0_x64-setup.exe`, com 2.617.052 bytes. `Get-AuthenticodeSignature` retornou `NotSigned`. A instalação `/S` saiu com código 0 e gravou `%LOCALAPPDATA%\PixelLeve\pixelleve.exe`. A janela “PixelLeve” abriu, respondeu e criou um processo filho `msedgewebview2`, sem iniciar Vite | Nesta linha o processamento no WebView2 ainda não tinha sido feito. A linha seguinte registra essa prova |
| 2026-10-09 | 4, validação no WebView2 | WebView2 154.0.4258.62. Aplicativo instalado de `PixelLeve_0.1.0_x64-setup.exe`, 2.617.052 bytes, `NotSigned`. Vite parado. A interface foi conduzida pela porta de depuração, só nesta prova | PNG 32×32 com `tRNS`, 106→105. Resize 200×100 para 100×50, 566→98. JPEG 100×50, 478 bytes. WebP 100×50, 138 bytes. Releitura: JPEG 478→477 e WebP 138→134. ZIP de 463 bytes. Pasta com subpastas, colisão `foto (2).png` sem sobrescrever. Cancelamento de 1600×1200 e nova tentativa WebP 852004→19794. Diálogos cancelados. Pasta sem permissão manteve 1 resultado. Originais com o mesmo SHA-256. Desinstalar `/S` código 0 e reinstalar `/S` código 0; a janela reabriu sem Vite | Processar com a rede desligada não foi feito. Na abertura sem porta de depuração, `pixelleve.exe` não teve conexão TCP e `msedgewebview2` tinha duas conexões estabelecidas com 52.97.78.18 na porta 443, antes de escolher imagem. Durante a prova com depuração também apareceram 8.8.4.4:443, 8.8.8.8:443 e 127.0.0.1. Não houve captura do conteúdo, então não dá para afirmar o que esses fluxos carregavam. O bundle desktop não contém URL de envio de imagem; há namespaces do W3C, o prefixo `https://react.dev/errors/` do React e um `https://localhost` usado só quando `import.meta.url` não existe. Pendências manuais da etapa 1 e a instalação nativa da PWA permanecem |
| 2026-10-10 | Tela compacta | Node 24.18.0, npm 11.16.0. `npx vitest run`, `npx eslint .`, `npm run build`, `npx playwright test` no preview `http://127.0.0.1:4173`. `npm run desktop:dev` no WebView2, sem gerar instalador | Vitest: 40. Lint sem erros. Build web Vite 8.3.4, CSS `index-CGZc8qMN.css` com Segoe UI, precache de 20 entradas e 1897,15 KiB. Playwright: 26 testes. O mesmo CSS entrou em `dist-desktop`. Preview: vazio, fila, “Economizou 1,7 KB · 88%” (1,9 KB → 231 B), JPEG “Aumentou 251 B · 306,1%” (82 B → 333 B), “Economia zero” em 152 B → 152 B, falha de PNG truncado, cancelamento e comparação. Sem rolagem horizontal em 1440, 1024 e 390 px, nem na emulação de zoom 200% (viewport CSS de 720 px). Tab alcançou as ações com contorno de 3 px. No `desktop:dev`, a barra de instalação não apareceu; `texto.png` ficou 151 B → 107 B, “Economizou 44 B · 29,1%”, com “Salvar lote em ZIP” em destaque | O instalador das 17:51 não tem esta tela. Processar o aplicativo instalado sem rede continua pendente. Pendências manuais da etapa 1 e a instalação nativa da PWA permanecem |
| 2026-10-10 | Instalador 0.1.1 | `npm run desktop:build`. Vite e preview parados. Instalação `/S` e abertura pelo atalho. WebView2 154.0.4258.62. A interface foi conduzida pela porta de depuração, só nesta prova | `PixelLeve_0.1.1_x64-setup.exe`, 2.617.614 bytes, SHA-256 `91961E3CEDBB4C7687583D2B3F1FB0145D86A03F12AF1A6E54D9F7480AEA073A`, 01:04, `NotSigned`. Frontend desktop com 44 módulos, sete WASM e CSS `index-CGZc8qMN.css`, sem service worker. PNG 32×32 com transparência, 123→395 em JPEG 16×16, “Aumentou 272 B · 221,1%”. WebP 123→120. Importação de JPEG, WebP e PNG. Pasta com duas imagens e um `nota.txt` ignorado. ZIP de 528 bytes e pasta de saída com `dois/foto.png` 107 e `um/foto.png` 199. Lote “Economizou 5,3 KB · 94,6%”. Originais com o mesmo SHA-256. Sem barra da PWA | Não repetiu cancelamento longo, pasta sem permissão nem desinstalação da 0.1.0. `Disable-NetAdapter` no Ethernet retornou acesso negado; processar sem rede continua pendente. Pendências manuais da etapa 1, a instalação nativa da PWA e o AVIF permanecem |

O download do Chromium headless do Playwright falhou neste ambiente com `SELF_SIGNED_CERT_IN_CHAIN`. Os testes usaram o Google Chrome instalado (`channel: 'chrome'` no `playwright.config.ts`). O Chrome da máquina também recebeu pedidos do Kaspersky para scripts locais; o teste ignora esse host. O bundle da aplicação não referencia Kaspersky, analytics ou CDN. Não foi medido se o antivírus inspeciona o conteúdo dos arquivos fora do navegador.

A etapa 1 não está validada por completo. Redimensionar, zoom e slider estão implementados e foram exercitados com imagens sintéticas no preview de produção. Não há fotos reais, EXIF nem arraste de pasta pelo Explorer nesta rodada. A aplicação não está pronta para uso geral e não é apresentada como superior ao TinyPNG.

A PWA está no build web de produção. `npm run dev` não registra service worker. O Chrome automatizado confirmou manifesto, ícones PNG, worker ativo, precache dos codecs, recarga sem rede, processamento e ZIP. Também confirmou o bloqueio da atualização durante o processamento, o cancelamento com resultado concluído e o aceite que recarrega e descarta a sessão. Não confirmou o diálogo nativo de instalação nem o fechamento e a reabertura da janela instalada da PWA.

O desktop reutiliza a mesma interface e o mesmo motor. O instalador atual é a 0.1.1, sem assinatura e sem release pública. A 0.1.0 permanece como build anterior e os testes dela não valem para a 0.1.1. Se o WebView2 Evergreen não estiver presente, o modo `downloadBootstrapper` tenta baixá-lo. A 0.1.1 foi exercitada no WebView2 com a rede disponível; a abertura com a rede desligada continua pendente. AVIF não foi implementado. O site não foi publicado.
