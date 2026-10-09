# Produto e critérios de aceitação

## Objetivo

Transformar um fluxo manual de scripts de compressão em uma ferramenta visual para preparar imagens de sites. A pessoa deve conseguir selecionar um lote, ajustar formato e tamanho, verificar o resultado e baixar sem enviar os arquivos a um servidor.

Usuário inicial: desenvolvedor que prepara imagens para landing pages e aplicações web. O primeiro alvo é Chrome e Edge no Windows. Firefox entra na validação web; Safari e dispositivos móveis serão avaliados sem promessa inicial de paridade.

## Escopo do MVP

| ID | Requisito | Critério de aceitação |
| --- | --- | --- |
| R01 | Seleção e arrastar arquivos | Múltiplos PNG/JPEG/WebP estáticos entram em fila; erros aparecem por arquivo |
| R02 | Manter formato | JPEG/WebP são codificados; PNG é otimizado sem perdas; resultado maior é descartado quando não há transformação pedida |
| R03 | Converter formato | Saída PNG/JPEG/WebP válida, com MIME e extensão coerentes; aumento de tamanho é informado |
| R04 | Presets | Leve, Equilibrado e Máxima redução; indicam se há perdas |
| R05 | Redimensionar | Largura máxima e altura máxima opcionais; mantém proporção e não amplia por padrão |
| R06 | Fila | Estados reais, cancelamento, nova tentativa e isolamento de erro |
| R07 | Comparar | Original e resultado alinhados, zoom comum e slider utilizável por teclado |
| R08 | Download | Individual e ZIP; nomes únicos e originais preservados |
| R09 | Estatísticas | Bytes reais, economia por item e no lote; aumentos não são escondidos |
| R10 | Privacidade | Operação sem transmitir conteúdo, nomes ou metadados das imagens |
| R11 | Acessibilidade | Seleção sem drag, foco visível, rótulos e status acessíveis |
| R12 | Configuração estável | Ao processar, job recebe snapshot; ajustes futuros não alteram jobs em andamento |

## Comportamento dos formatos

PNG sem perdas usa otimização estrutural e preserva pixels, sem promessa de grandes reduções. Quantização com perdas não pertence ao MVP. JPEG pode apresentar perdas e não suporta transparência. WebP oferece modo com perdas e, se o codec escolhido suportar e for validado, modo sem perdas. Não exibir controle de qualidade numérico para PNG sem perdas como se ele reduzisse qualidade visual.

Preset inicial, sujeito a benchmark: JPEG e WebP usam qualidade 85, 75 e 60 respectivamente para Leve, Equilibrado e Máxima redução. Escalas de qualidade não são equivalentes entre codecs. PNG usa esforço moderado por padrão; não associar seus níveis aos números acima. Definir níveis reais após conferir a API instalada.

Se houver pixels transparentes e a saída for JPEG, solicitar cor de fundo antes de iniciar aquele job. PNG e WebP devem preservar alpha, incluindo transparência parcial. Mostrar fundo quadriculado na comparação.

## Métricas

Economia por item = `(bytesEntrada - bytesSaida) / bytesEntrada × 100`.
Economia do lote = `(somaBytesEntrada - somaBytesSaida) / somaBytesEntrada × 100`.
Não calcular economia global como média dos percentuais individuais.

Na conversão explícita, economia negativa significa aumento: mostrar “18% maior”.
Ao manter formato e dimensão, se não reduzir, disponibilizar original com estado “Já estava otimizada” e economia zero.
Em resize ou conversão solicitados, respeitar a transformação mesmo se aumentar o tamanho.

## Prioridade aplicada em 9 de outubro de 2026

A fila, a economia e a importação em lote passaram na frente de redimensionar e do slider. O que segue vale para o código desta data; não substitui os critérios acima.

- A economia de cada imagem e a do lote usam os bytes reais. O percentual do lote é a soma das entradas contra a soma das saídas. Durante o processamento, “Economia até agora” só inclui pares já concluídos. Itens aguardando, com falha, ignorados ou cancelados aparecem à parte e não entram como saída zero.
- Dá para escolher várias imagens, escolher uma pasta com subpastas ou arrastar quando o navegador expõe a API. Selecionar a pasta não altera os originais. Arquivo incompatível é ignorado e contado. Arquivo inválido ou animado fica na fila como falha e não interrompe os demais.
- A fila mostra miniatura sob demanda, caminho relativo, tamanhos, economia, estado e ações de remover, comparar, baixar e tentar novamente. Um worker pesado por vez. Cada job congela formato, preset e fundo e reprocessa a partir do original.
- O ZIP local usa fflate, preserva subpastas, desambigua nomes e deixa de fora falha e cancelamento. Acima de 256 MiB de saídas retidas, a exportação completa é recusada e a pessoa pode baixar uma seleção.
- A comparação abre ao selecionar a imagem ou em “Comparar”, com fundo quadriculado. Zoom comum e slider por teclado continuam pendentes, assim como o redimensionamento (R05).

## Limites técnicos iniciais

Propostas para calibrar: 40 MiB por arquivo; 24 megapixels após ler dimensões; 256 MiB em saídas retidas para exportação ZIP. Uma imagem de 24 MP ocupa cerca de 96 MB apenas em RGBA, além de cópias e memória do codec.

Os limites servem para evitar travamentos. Devem estar centralizados, ser explicados com ações possíveis e revistos conforme testes. Nenhuma quota diária ou bloqueio comercial. Não carregar nem decodificar todo o lote ao mesmo tempo.

## Fora do MVP

AVIF, busca automática de formato/qualidade, variantes responsivas, pastas monitoradas, edição de imagens, SVG, GIF/APNG/WebP animado, HEIC, RAW, contas, nuvem e funções de IA. AVIF e modo automático já têm etapas posteriores previstas; os demais precisam de demanda própria.

Animação deve ser detectada antes de processar e recusada com orientação. Não confiar só na extensão ou MIME declarado. Arquivos renomeados, truncados e formatos não aceitos devem falhar com mensagem clara.

## Metadados e cores

Saídas recodificadas destinam-se à web e devem remover EXIF, GPS e metadados desnecessários. Aplicar orientação EXIF uma única vez antes da remoção. O pipeline visual trabalha em sRGB; verificar conversão de perfil e comunicar limitações de ICC/CMYK/gamut amplo quando não suportados.

No caminho PNG otimizado sem recodificar, preservar informação necessária à aparência e retirar metadados privados quando o codec permitir; verificar pixels e aparência. Se o original for entregue sem transformação, seus metadados continuam presentes: informar isso no detalhe do item. Não vender a ferramenta como sanitizador garantido de metadados.

## PWA e desktop

PWA: manifest, ícones, instalação onde suportada, cache do shell e de todos os codecs anunciados como offline, atualização segura após terminar lotes.

Desktop Windows: reutilizar interface e motor, seleção de arquivos/pastas por diálogo nativo, pasta de saída escolhida pela pessoa, sem sobrescrita silenciosa. Tauri deve empacotar o app e codecs e ser testado no WebView2.

## Definição de pronto

Funcionalidades previstas operam com imagens reais; build e verificações passam; limitações ficam documentadas; nenhum resultado é fictício. Só anunciar offline ou instalador disponível depois dos respectivos testes de aceitação.
