# Interface e experiência

## Direção visual

Aplicativo utilitário com aparência de produto pronto para uso diário. Tema claro, fundo neutro quente, superfície branca e cor verde petróleo. Português brasileiro, textos diretos e números fáceis de comparar. Evitar visual de painel administrativo cheio de métricas.

Nome provisório PixelLeve; frase curta: “Imagens prontas para a web”.

Tokens sugeridos: fundo #F6F7F4, superfície #FFFFFF, texto #172A28, destaque #147D64 e borda #DDE5DF. São propostas; medir contraste antes de adotar. Fonte do sistema, sem download externo. Ícones consistentes e acompanhados de rótulos nas ações principais.

## Tela inicial

Cabeçalho compacto com nome e indicação “Processamento no seu dispositivo”. Área central ampla para arrastar imagens, com botão “Escolher imagens”. Abaixo, informar formatos aceitos e limites técnicos reais.

Configuração inicial: manter formato, preset Equilibrado, tamanho original. Botão “Otimizar imagens” fica ativo quando houver itens válidos. Não iniciar conversão irreversível enquanto a pessoa ainda escolhe opções.

## Sessão com imagens

No desktop, lista principal à esquerda e painel de configurações à direita. Em telas menores, configurações recolhíveis acima da lista. Rodapé de ações com total original, total de saída e download.

Cada linha mostra thumbnail, nome, formato/dimensões, tamanho inicial/final, economia, estado e ações. “Comparar” abre painel ou diálogo acessível. Não ocultar nome inteiro sem alternativa acessível.

Painel: formato de saída, preset, dimensões máximas e opções pertinentes ao formato. Para PNG sem perdas, explicar que qualidade visual é preservada. Para JPEG com alpha, pedir fundo. Configurações aplicam-se aos próximos jobs; oferecer ação explícita para reprocessar itens.

## Comparação

Mesma escala e posição para ambas as imagens; preservar alinhamento quando resize muda dimensões, indicando dimensão de saída. Zoom comum, slider horizontal com teclado e opção alternar Original/Resultado. Fundo quadriculado para transparência. Mostrar formatos, bytes e eventuais avisos de cor.

Abrir por botão, fechar com Escape, manter foco no diálogo e devolver foco ao botão anterior. Não depender de hover para revelar controles essenciais.

## Estados e textos

| Estado | Texto principal | Ação |
| --- | --- | --- |
| Vazio | Arraste imagens ou escolha arquivos | Escolher imagens |
| Na fila | Aguardando | Remover |
| Processando | Otimizando imagem | Cancelar |
| Pronto | 64% menor | Comparar e baixar |
| Sem redução | Já estava otimizada | Baixar original |
| Maior após conversão | 12% maior no formato escolhido | Comparar e baixar |
| Falha | Não foi possível ler esta imagem | Detalhe e tentar novamente |
| Animada | Imagens animadas ainda não são aceitas | Remover |
| Memória insuficiente | Este lote excede a memória disponível | Baixar seleção |
| Offline pronto | Pronto para usar offline | Sem ação obrigatória |

Percentuais de exemplo ilustram textos, não medições do produto. A implementação deve usar valores calculados.

## Acessibilidade e movimento

Foco visível, labels explícitos, status em região live sem spam, área de seleção acessível por teclado, contraste verificado e alvos de toque confortáveis. Respeitar reduced motion; animações discretas que não atrapalhem lotes longos.

## Evitar

Imitar a marca ou personagens TinyPNG, gráficos decorativos, economias fictícias, barra de progresso de mentirinha, AVIF habilitado sem motor pronto e mensagens de instalação offline sem comprovação.

## Verificação visual

Capturas de estado vazio, lote misto, falha, alpha e comparação em larguras 1440, 1024 e 390 px. Esses tamanhos são condições de teste, não garantias de suporte móvel completo. Verificar também teclado e zoom do navegador a 200%.
