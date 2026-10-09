# Roadmap de implementação

O Cursor deve trabalhar na etapa solicitada. Não adicionar etapas futuras para declarar o projeto completo. Estimativas de calendário dependem da integração dos codecs e da disponibilidade do ambiente Windows.

## Etapa 0 Prova técnica

Criar scaffold React/TS/Vite, scripts básicos e tela de teste mínima. Provar JPEG/MozJPEG, WebP/libwebp e PNG/OxiPNG em worker, importação local de WASM e download válido.

Concluir quando: typecheck, lint e build passarem; produção processar fixtures; formatos, dimensões e alpha forem verificados; versões e licenças estiverem registradas. Anotar tempos e tamanhos reais. Se PNG estiver bloqueado, registrar como bloqueio da etapa, sem afirmar conclusão do motor.

AVIF pode ser investigado, mas não deve atrasar nem aparecer como funcionalidade do MVP. Comparação externa com TinyPNG fica pendente até haver imagens de referência e execuções reais.

## Etapa 1 MVP web

Implementar direção visual, fila, dropzone, presets, resize, proteção de alpha, comparação e exportação individual/ZIP. Validar estados, cancelamento e reprocessamento.

Em 9 de outubro de 2026 entrou a fatia de economia, lote, pasta, fila e ZIP. No mesmo dia, redimensionamento, zoom e slider por teclado passaram a fazer parte da tela e foram exercitados com fixtures sintéticas. A etapa continua aberta enquanto fotos reais, EXIF, arquivos perto dos limites e o arraste de pasta pelo Explorer não forem verificados. PWA, AVIF e Tauri não entram nesta fatia.

Concluir a etapa quando R01–R12 de PRODUTO.md forem verificados, e testes de fluxos reais mais build passarem. Testar um lote misto de 30 imagens pequenas com um item inválido e continuar a fila. Medir comportamento com arquivos grandes dentro dos limites em máquina registrada.

## Etapa 2 PWA

Adicionar manifest, ícones, service worker, cache e atualização sem perder lote. Instalação onde suportada e experiência clara quando não há opção.

Concluir quando um build servido em contexto apropriado instalar em Chrome/Edge, abrir novamente offline e processar formatos suportados sem rede. Testar codec ainda não usado antes de desligar a rede. Atualização não pode interromper sessão ativa nem deixar mistura de assets.

Em 9 de outubro de 2026 o manifesto, os ícones locais e o service worker passaram a sair do build de produção. O Chrome automatizado recarregou o preview sem rede e processou JPEG, WebP, PNG redimensionado e ZIP. A etapa segue aberta: o diálogo de instalação não apareceu nesse Chrome, a janela instalada não foi fechada e reaberta, e o clique em “Atualizar agora” não foi executado.

A partir daqui já existe uma primeira versão usável no navegador e instalada como PWA.

## Etapa 3 AVIF e otimizar para web

Ativar AVIF só depois de medir qualidade, alpha, memória e tempo. Criar modo automático como heurística explícita: comparar original e candidatos permitidos por compatibilidade, preservando alpha e sem usar formatos não desejados.

Para fotos, explorar poucas qualidades WebP/JPEG e AVIF quando permitido. Para texto e gráficos, incluir PNG original/otimizado e WebP sem perdas se validado. Não assumir detector perfeito de conteúdo. Limitar tentativas e orçamento de tempo configurado; resultados menores precisam respeitar o limiar de qualidade definido em BENCHMARK.md.

Concluir quando seleção de candidatos for reproduzível, limites forem respeitados, métricas forem documentadas e a comparação visual estiver disponível. “Equilibrado” continua sendo preset; “automático” é função diferente.

## Etapa 4 Desktop Windows

Adicionar Tauri ao mesmo projeto, adapter nativo, pasta de saída, nomes sem colisão e instalador. Verificar protocolo de assets, WASM, worker e WebView2.

Concluir quando compilação no Windows, instalação, abrir offline, processar, salvar e desinstalar forem testados. Verificar diálogos cancelados, pasta sem permissão e conflitos de nomes. Documentar requisitos e estado de assinatura do instalador. Se o ambiente não permitir build Windows, registrar pendente; um build web não comprova desktop.

## Etapa 5 Preparação para compartilhar

README de uso com capturas reais, lista de limitações, instruções de build, registro de benchmarks e licença do projeto escolhida. Configurar verificações em CI com fixtures redistribuíveis.

Criar release, repositório remoto ou publicar apenas em tarefa que inclua essa ação. Não apresentar documentação como aplicativo entregue.

## Checklist

- [x] 0 Motor validado em produção, com as limitações registradas em STATUS.md
- [ ] 1 MVP utilizável e verificado. Economia, lote, fila, ZIP, resize, slider e zoom implementados; fotos reais, EXIF, limites e arraste pelo Explorer continuam pendentes
- [ ] 2 PWA offline verificada
- [ ] 3 AVIF e modo automático verificados
- [ ] 4 Windows instalado e testado
- [ ] 5 Material para compartilhamento preparado
