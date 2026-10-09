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
| Economia exibida | 29,1% menor |
| Primeira execução, com carga do codec | 45 ms |
| Três execuções seguintes | 2 ms, 2 ms e 2 ms; mediana 2 ms |
| Pixels | Iguais ao original no teste do Chrome |
| Alpha | Não havia |

## Outras fixtures na mesma sessão de teste

Cada linha é uma execução, não uma mediana. O tempo inclui a primeira carga do codec daquela página.

| Fixture | SHA-256 | Operação | Entrada | Saída | Texto exibido | Tempo |
| --- | --- | --- | --- | --- | --- | --- |
| grafico-alpha.png | `18462a61bf4ab2d0e01fb2e13e3e5104af30734c8239f736cf42b8b177bd1994` | WebP, preset Equilibrado | 123 | 186 | 51,2% maior | 42 ms |
| grafico-alpha.png | mesmo | JPEG com fundo `#000000` | 123 | 502 | 308,1% maior | 41 ms |
| foto-sintetica.png | `f32a2af6abc545823086e1d8653a7b2b4135ccf5d71cb5d24f94517f32d8b193` | JPEG, conversão explícita | 5566 | 543 | 90,2% menor | 42 ms |
| foto-sintetica.jpg | gerado na execução, não versionado | Manter JPEG | 543 | 543 | Já estava otimizada | 5 ms |
| foto-sintetica.png | mesmo hash acima | PNG explícito, OxiPNG | 5566 | 199 | 96,4% menor | 44 ms |

`grafico-alpha.png` é 32×32 com canto transparente, um pixel azul com alpha 128 e um pixel vermelho opaco. No WebP, o teste conferiu o canto com alpha menor que 20 e o pixel opaco com alpha maior que 240. Não houve comparação pixel a pixel no WebP com perdas.

O JPEG com transparência só foi gerado depois da escolha explícita de fundo. O arquivo começa com `FF D8` e tem marcador `FF C2` antes do scan, coerente com o MozJPEG progressivo. O canto transparente composto em preto ficou com canal vermelho menor que 40 depois da recodificação com perdas.

`foto-sintetica.png` é um gradiente 48×48 gravado com compressão PNG ingênua. A queda para 543 bytes em JPEG ou 199 bytes em OxiPNG mostra o codec funcionando nesse arquivo, não uma economia típica de foto já otimizada. Ao manter o JPEG de 543 bytes, a segunda codificação não reduziu e o original foi devolvido.

## O que estas medições não dizem

Não houve inspeção visual ampliada de pele, texto pequeno fotografado ou gradiente de câmera. Não há métrica perceptual. Não há arquivo grande, EXIF, GPS, ICC ou CMYK. A comparação externa com TinyPNG continua pendente. Não extrapolar estes tempos nem estes percentuais para outros computadores ou para imagens de sites reais.
