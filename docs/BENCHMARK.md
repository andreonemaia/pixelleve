# Benchmark de compressão

## Estado

Nenhuma medição foi feita. Esta é a metodologia e o modelo de registro, não uma comparação já realizada.

## Corpus

Começar com 12 imagens autorizadas: quatro fotos, quatro screenshots com texto e quatro gráficos com transparência. Incluir arquivos já otimizados, dimensões variadas e uma imagem grande dentro do limite técnico.

Fixtures sintéticas pequenas servem para integridade, não para comprovar desempenho em fotos reais. Registrar origem, licença ou autorização e hash SHA-256. Não publicar imagens pessoais sem autorização.

## Comparação justa

Para manter o formato, comparar PixelLeve, script Python existente quando disponibilizado, e TinyPNG se houver execução real autorizada/disponível. Não consumir quota ou carregar fotos em serviços automaticamente como requisito da implementação.

Comparar sempre mesmo arquivo original, dimensões e formato alvo. Não apresentar WebP do PixelLeve contra PNG do TinyPNG como vantagem direta de compressor PNG. Esse cenário pode existir, mas precisa ser identificado como conversão.

Registrar parâmetros, versões e data. O método do script do usuário ainda é desconhecido e não deve ser inventado. TinyPNG pode mudar parâmetros sem exposição pública; marcar controle limitado quando aplicável.

## Registro por execução

| Campo | Valor |
| --- | --- |
| fixture e SHA-256 | A preencher |
| ferramenta e versão | A preencher |
| codec e opções | A preencher |
| formato e dimensões entrada/saída | A preencher |
| bytes entrada/saída e economia | A preencher |
| tempo mediano | A preencher |
| dispositivo, RAM, OS, navegador | A preencher |
| alpha e orientação | A preencher |
| qualidade visual e observações | A preencher |
| métrica perceptual e implementação | A preencher ou não avaliada |
| origem da execução | Local, produção web ou desktop |

Três execuções após aquecimento por combinação; registrar mediana e tempo de primeira inicialização separadamente. Não extrapolar resultados de um computador a todos os dispositivos. Se memória detalhada não puder ser medida, registrar estimativa identificada e sinais observados, sem inventar pico.

## Qualidade

PNG sem perdas: comparar dimensões e pixels normalizados RGBA, incluindo alpha. Verificar aparência e perfis quando houver metadados relevantes.

JPEG/WebP/AVIF com perdas: inspecionar a 100% e ampliar áreas de texto, gradiente, borda e pele. Métrica perceptual é auxiliar, não garantia de qualidade; normalizar tamanho, espaço de cor e fundo para avaliar alpha corretamente.

Para modo automático futuro, escolher e documentar uma implementação de métrica e limiar calibrado neste corpus. Só habilitar seleção automática com o limiar e orçamento definidos. Se não houver métrica confiável, oferecer presets e comparação, sem afirmar garantia automática.

## Resumo futuro

Apresentar economia mediana por classe/formato, faixas de tempo e casos em que a saída não diminuiu. Destacar perdas visuais detectadas. Não transformar a melhor imagem do corpus em promessa geral.

A próxima ação é medir o motor real da etapa 0.
