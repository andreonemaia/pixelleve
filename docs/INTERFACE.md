# Interface e experiência

## Direção visual

Aplicativo utilitário, compacto, com tema claro. Fundo #F6F7F4, superfície #FFFFFF, texto #172A28, texto secundário #34514C, destaque #147D64, borda #DDE5DF, falha e aumento #8A3D32. Raios de 12 px nos cartões e 10 px nos controles. A fonte é a pilha local Segoe UI, system-ui, Helvetica Neue e sans-serif, sem download. Tamanhos e percentuais usam números tabulares. O mesmo CSS entra no build web (`dist`) e no bundle desktop (`dist-desktop`).

Nome PixelLeve; frase curta: “Imagens prontas para a web”.

O botão principal é preenchido. As outras ações ficam com borda neutra e continuam visíveis sem hover. Desabilitado usa fundo cinza e cursor de espera. Foco por teclado tem contorno de 3 px na cor de destaque.

## Tela inicial

Cabeçalho compacto com PixelLeve, a frase curta e a indicação “Processamento no seu dispositivo”. A área de entrada tem “Escolher imagens”, “Escolher pasta” e uma frase sobre arrastar. Formatos e limites ficam em nota secundária. Com a fila vazia, “Escolher imagens” é a ação principal. Depois de importar, a área de entrada encolhe. Se a seleção de pasta ou o arraste de diretório não existir, a tela explica e oferece a seleção múltipla.

A partir de 1024 px, a lista e o resumo ficam na coluna principal e a configuração num painel lateral de 280 px. Abaixo disso os blocos empilham: entrada, configuração, resumo e lista, sem rolagem horizontal.

A comparação não ocupa a tela vazia. Ela abre ao selecionar uma imagem ou em “Comparar”.

Configuração inicial: manter formato e preset Equilibrado. Formato e preset ficam juntos. Redimensionar é uma seção própria. “Comprimir lote” fica ativo quando houver itens aguardando. Não iniciar conversão irreversível enquanto a pessoa ainda escolhe opções.

## Sessão com imagens

O resumo mostra original, final, quantidade e o andamento. A economia é a frase principal, no formato “Economizou 1,7 KB · 88%”, calculada só dos bytes concluídos. Sem resultados, os tamanhos ficam em travessão e o texto explica que a economia ainda não existe; nenhum número é inventado. Durante o processamento o rótulo é “Economia até agora”. Aumento de tamanho usa a cor de falha, não o verde. Economia zero fica neutra. Aguardando, falha, ignorados e cancelados continuam na contagem separada.

A lista mostra miniatura, nome, caminho relativo, dimensões, original e resultado, economia absoluta e percentual, estado e as ações Comparar, Baixar ou Salvar, Tentar novamente e Remover. “Comprimir lote” é o botão principal antes de haver resultado. “Baixar lote em ZIP” na web, ou “Salvar lote em ZIP” no desktop, passa a ser o principal quando existe arquivo pronto. “Comparar” abre diálogo acessível. Não ocultar o nome inteiro sem alternativa acessível.

Painel: formato de saída e preset, com um microtexto sobre perda. “Manter dimensões originais” começa marcado. Enquanto marcado, largura e altura ficam esmaecidas, continuam editáveis e não entram no processamento. O texto ao lado informa os limites guardados. Desmarcar devolve o destaque dos campos. Para PNG sem perdas, o microtexto diz que os pixels são preservados. Para JPEG e WebP, avisa que há perdas. Para JPEG com transparência, o seletor de fundo e o aviso ficam visíveis, fora de tooltip. O detalhe de proporção, de não ampliar e de a pasta não alterar originais fica em “Como funciona”. A linha mostra as dimensões originais e as finais. Configurações aplicam-se aos próximos jobs; “Tentar novamente” reprocessa o original.

Na web, a barra mostra instalação e atualização da PWA. No desktop essa barra não aparece; salvar usa diálogo nativo e pasta de saída. O fluxo principal não explica WASM, cache nem arquitetura.

## Comparação

Mesma escala e posição para ambas as imagens. O slider horizontal mostra original e resultado, com rótulo, teclado e foco visível. “Ver original” e “Ver resultado” levam o slider às pontas. Zoom e arraste movem as duas juntas. “Ajustar à tela” e “100%” estão sempre visíveis. Em 100%, cada arquivo aparece no próprio tamanho em pixels; um resultado menor não é esticado para cobrir o original. A nota informa dimensões e escalas. Fundo quadriculado para transparência. Mostrar formatos, bytes, economia e eventuais avisos de cor.

Abrir por botão, fechar com Escape, manter foco no diálogo e devolver foco ao botão anterior. Não depender de hover para revelar controles essenciais.

## Estados e textos

| Estado | Texto principal | Ação |
| --- | --- | --- |
| Vazio | Arraste imagens ou escolha arquivos | Escolher imagens |
| Na fila | Aguardando | Remover |
| Processando | Comprimindo | Cancelar |
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
