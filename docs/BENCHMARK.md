# Benchmark de compressão

## Estado

Há medições da prova técnica em 9 de outubro de 2026. Elas usam fixtures sintéticas pequenas, geradas por `tests/fixtures/gerar.mjs`. Não há corpus de 12 fotos, não há comparação com TinyPNG e estes percentuais não descrevem fotos reais.

## Execução

| Campo | Valor |
| --- | --- |
| Data | 2026-10-09 |
| Origem | Preview de produção em `http://127.0.0.1:4173`, Chrome via Playwright |
| Navegador | Chrome/156.0.8078.4, user agent registrado pelo teste |
| Máquina | Windows, AMD Ryzen 7 5700X, `os.totalmem()` = 34244354048 bytes |
| Preset | Equilibrado, salvo quando o teste não altera o padrão da tela |
| Comando | `npm run test:motor` |

O tempo inclui ida ao worker. A primeira chamada de cada página também inicializa o WASM. As três repetições abaixo foram feitas na mesma página, depois de um aquecimento.

## texto.png com OxiPNG, manter formato

SHA-256 `d0f241d5ec7d1e10699ef5aa325481a22b4bea0f3cab5b40022b11cee837f501`. PNG opaco 80×24, sintético, sem otimização prévia.

| Medida | Valor |
| --- | --- |
| Entrada | 151 bytes |
| Saída nas três repetições | 107, 107 e 107 bytes |
| Economia exibida | Economizou 44 B (29,1%) |
| Primeira execução, com carga do codec | 40 ms |
| Três execuções seguintes | 2 ms, 2 ms e 2 ms; mediana 2 ms |
| Pixels | Iguais ao original no teste do Chrome |
| Alpha | Não havia |

## Outras fixtures na mesma sessão de teste

Cada linha é uma execução, não uma mediana. O tempo inclui a primeira carga do codec daquela página.

| Fixture | SHA-256 | Operação | Entrada | Saída | Texto exibido | Tempo |
| --- | --- | --- | --- | --- | --- | --- |
| grafico-alpha.png | `18462a61bf4ab2d0e01fb2e13e3e5104af30734c8239f736cf42b8b177bd1994` | WebP, preset Equilibrado | 123 | 186 | Aumentou 63 B (51,2%) | 47 ms |
| grafico-alpha.png | mesmo | JPEG com fundo `#000000` | 123 | 502 | Aumentou 379 B (308,1%) | 39 ms |
| foto-sintetica.png | `f32a2af6abc545823086e1d8653a7b2b4135ccf5d71cb5d24f94517f32d8b193` | JPEG, conversão explícita | 5566 | 543 | Economizou 4,9 KB (90,2%) | 42 ms |
| foto-sintetica.jpg | gerado na execução, não versionado | Manter JPEG | 543 | 543 | Já estava otimizada | 5 ms |
| foto-sintetica.png | mesmo hash acima | PNG explícito, OxiPNG | 5566 | 199 | Economizou 5,2 KB (96,4%) | 46 ms |

`grafico-alpha.png` é 32×32 com canto transparente, um pixel azul com alpha 128 e um pixel vermelho opaco. No WebP, o teste conferiu o canto com alpha menor que 20 e o pixel opaco com alpha maior que 240. Não houve comparação pixel a pixel no WebP com perdas.

O JPEG com transparência só foi gerado depois da escolha explícita de fundo. O arquivo começa com `FF D8` e tem marcador `FF C2` antes do scan, coerente com o MozJPEG progressivo. O canto transparente composto em preto ficou com canal vermelho menor que 40 depois da recodificação com perdas.

`foto-sintetica.png` é um gradiente 48×48 gravado com compressão PNG ingênua. A queda para 543 bytes em JPEG ou 199 bytes em OxiPNG mostra o codec funcionando nesse arquivo, não uma economia típica de foto já otimizada. Ao manter o JPEG de 543 bytes, a segunda codificação não reduziu e o original foi devolvido.

## O que estas medições não dizem

Não houve inspeção visual ampliada de pele, texto pequeno fotografado ou gradiente de câmera. Não há métrica perceptual. Não há arquivo grande perto do teto de 40 MiB ou 24 megapixels, nem EXIF, GPS, ICC ou CMYK. A comparação externa com TinyPNG continua pendente. Não extrapolar estes tempos nem estes percentuais para outros computadores ou para imagens de sites reais.

## Rodada de confiabilidade em 9 de outubro de 2026

Não há fotografias, capturas de tela reais nem arquivos já comprimidos de câmera no repositório. As medições abaixo usam grades PNG sintéticas, geradas na hora do teste e gravadas só em `test-results/`, que não entra no Git. Elas não descrevem fotos.

| Campo | Valor |
| --- | --- |
| Comando | `npx vitest run`, `npx eslint .` e `npm run test:motor` |
| Navegador | Chrome/156.0.8078.4, o mesmo canal da sessão anterior |
| Máquina | Windows, AMD Ryzen 7 5700X, `os.totalmem()` = 34244354048 bytes |
| Suíte | Vitest: 21 testes. Playwright: 14 testes. Vite 8.3.4 |

Na mesma execução, `texto.png` repetiu 151 → 107 bytes. A primeira chamada levou 39 ms e as três seguintes 2 ms, 2 ms e 2 ms.

### grade-media.png, 640×480, manter PNG, preset Equilibrado

SHA-256 `e52b7ffe1f8459b2c98bdcd82d44db20060be09312728d400be5b08172b45939`. Barras, variação de cor e canto transparente. Não é captura de tela.

| Medida | Valor |
| --- | --- |
| Entrada | 392397 bytes |
| Saída | 8321 bytes |
| Tempo do item | 191 ms |
| Lote com duas cópias e um JPEG inválido no meio | 932 ms até a fila esvaziar |
| Pixels | Nesta rodada, só a soma dos canais RGBA coincidiu. Isso não prova que os pixels sejam iguais. A verificação canal a canal está na seção seguinte |
| Alpha do canto | 0 nos dois |
| Nova tentativa | A entrada continuou 392397 bytes e a saída 8321. A linha seguiu em “Economizou” |
| Interface | 56 quadros de `requestAnimationFrame` durante essa página. Não é medição de memória |

O JPEG inválido ficou em falha e as duas grades terminaram. A queda de 392397 para 8321 bytes vem de um PNG sintético pouco compactado. Não vale como economia de foto ou de captura já otimizada.

### grade-grande.png, 1600×1200, cancelamento

SHA-256 `7dc00e1310490a5c91e9a8b78bdec81666633b0716e5b2e9a0788f46714fb9a3`. Entrada de 1096820 bytes. Preset inicial Máxima, formato original, para segurar o OxiPNG.

O teste esperou o estado “processando”, aguardou 500 ms e o estado continuava “processando”. O contador de quadros foi de 2 para 32 nesse intervalo. Em seguida o formato mudou para WebP, o preset para Leve, e o cancelamento foi clicado. Dois segundos depois a linha seguia cancelada, sem link de download. A segunda imagem, `texto.png`, continuava aguardando.

“Tentar novamente” produziu WebP de 345150 bytes em 281 ms, não o PNG que estava em andamento. `texto.png` também saiu em WebP, então o worker recriado processou o item seguinte. Não houve pico de memória medido. O método foi o contador de quadros e o estado da fila.

### ZIP e limite

Três imagens convertidas para WebP, com `foto.png` e `foto.jpg` na mesma pasta. O ZIP extraído tinha `album/dup/foto.webp`, `album/dup/foto (2).webp` e `album/outra/grade.webp`. A soma dos bytes exibidos foi 47702. O arquivo ZIP tinha 48080 bytes. O status da economia continha o tamanho das imagens, não o do ZIP.

O teste com limite artificial `0` continua separado. Outro teste alocou `LIMITE_ZIP_BYTES + 1` (256 MiB + 1 byte), escreveu um byte a cada página de 4096 e conferiu que `montarZip` recusa antes de chamar `zipSync`. Isso não mede o pico de compactar um ZIP desse tamanho, nem um lote real de imagens.

## Pixels e redimensionamento em 9 de outubro de 2026

O mesmo `grade-media.png` (SHA-256 acima) foi lido de novo no preview de produção. Entrada 392397 bytes, saída 8321 bytes, item em 165 ms, lote em 938 ms, 53 quadros de `requestAnimationFrame`. As duas imagens foram desenhadas no tamanho natural e lidas com `getImageData`. A comparação percorreu largura, altura e cada valor RGBA. Elas coincidiram, e o alpha do canto continuou 0. Um teste de unidade mostra que duas amostras com a mesma soma e pixels trocados são rejeitadas. A soma da rodada anterior deixa de ser evidência de equivalência.

O redimensionamento usa média por área, com alpha reto, no worker, antes de codificar. Não é `@jsquash/resize` nem Canvas. Imagens sintéticas, preset Leve, formato original, salvo o JPEG indicado:

| Caso | Resultado |
| --- | --- |
| 200×100, largura máxima 100 | 100×50 |
| 100×200, altura máxima 80 | 40×80 |
| 200×100 dentro de 50×80 | 50×25, sem recorte |
| 40×30 dentro de 200×180 | Permaneceu 40×30 |
| 100×33, largura máxima 10 | 10×3 |
| 30×15, largura 12 e nova tentativa com largura 8 | Os pixels bateram com um único redimensionamento do original |
| 32×32 com borda transparente, largura 16 | PNG: canto com alpha 0 e centro opaco. JPEG com fundo `#000000`: canto escuro e centro vermelho |
| Fila | Grade 1600×1200 manteve 1600×1200. O arquivo seguinte, 200×100, saiu 100×50 depois que o limite foi ligado durante o primeiro item |
| ZIP | `horizontal.png` extraído em 100×50, com a mesma quantidade de bytes da linha. A economia usou esses bytes, não o tamanho do ZIP |
| Comparação | Seta direita moveu o slider, o foco ficou visível, “100%” mostrou 200 px e 100 px sem esticar, o arraste moveu as duas imagens juntas e Escape devolveu o foco |

`0` e `1.5` na largura máxima impediram o processamento. O lado máximo aceito na interface é 16384 px, junto dos limites de 40 MiB e 24 megapixels. Não houve medição de pico de memória.

## O que continua sem medição

Fotos reais, capturas com texto pequeno, arquivos já comprimidos por câmera ou por outro programa, imagens perto de 40 MiB ou 24 megapixels, EXIF, orientação e GPS. Arraste de uma pasta a partir do Explorer. Inspeção visual de artefatos em fotos. Zoom do navegador a 200% e leitor de tela. Pico de memória do navegador.
