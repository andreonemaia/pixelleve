# Validação

Esta especificação define verificações a implementar. Nenhum teste de aplicativo foi executado na preparação deste pacote.

## Camadas

Vitest para funções determinísticas: dimensões, nomes, métricas, seleção de resultado e transições de fila. Testes no navegador para WASM, alpha, worker e exportação, pois codecs de navegador não devem ser presumidos compatíveis com ambiente Node.

Playwright como candidato para E2E: importação, processar lote, erro isolado, comparar, baixar e exportar. Não usar mocks de codecs como única evidência de compressão real.

## Casos essenciais

| Caso | Resultado esperado |
| --- | --- |
| JPEG fotográfico | Arquivo válido, extensão/MIME corretos e dimensões esperadas |
| JPEG com EXIF rotation | Orientação correta aplicada uma vez; sem GPS na saída recodificada |
| PNG com alpha parcial | Alpha preservado em PNG/WebP; sem halo no fundo escuro/claro |
| PNG com texto pequeno | PNG sem perdas com pixels equivalentes |
| JPEG solicitado com alpha | Job pede cor de fundo antes da conversão |
| Resultado maior ao manter formato | Original retornado, economia zero e metadados originais sinalizados |
| Conversão pedida maior | Formato escolhido retornado com aumento informado |
| Resize 2000×1000 para largura 1000 | Saída 1000×500; sem ampliação involuntária |
| Arquivo renomeado e truncado | Detectar formato/conteúdo e erro claro |
| APNG/WebP animado/GIF | Rejeitar sem descartar frames silenciosamente |
| Fila com erro | Próximos itens continuam |
| Cancelar durante WASM | Resultado cancelado ignorado; worker seguinte funciona |
| Editar durante job | Resultado antigo não substitui revision atual |
| Reprocessar várias vezes | Sempre usar original, sem acumular perdas |
| Nomes duplicados e Unicode | Exportação única e válida no Windows/ZIP |
| Nome com ../ | Não produzir caminhos que escapem do destino |
| ZIP | Arquivos extraíveis, coerentes e decodificáveis |
| Lote grande | Não decodificar tudo de uma vez; liberar recursos ao remover |
| Codec indisponível | Erro real, sem fallback silencioso |

## Privacidade

Inspecionar tráfego em dev e produção durante importar/processar/exportar: arquivos, nomes e metadados não podem sair do dispositivo. Downloads iniciais de assets locais são esperados. Não incluir serviços de analytics, fontes ou CDN em runtime.

PWA guarda recursos do app; não deve armazenar imagens por padrão. Depois de limpar sessão, testar ausência de imagens em armazenamento persistente. Não confundir ausência de upload com garantia universal de remoção de metadados.

## Offline

Testar build de produção servido por localhost ou HTTPS, não simplesmente abrir HTML por file://. Após preparação dos assets, fechar e reabrir offline e processar JPEG, PNG e WebP. Testar também codec que não havia sido usado anteriormente. AVIF entra quando habilitado.

Verificar quotas de cache, WASM ausente e atualização de versão com lote ativo. A aplicação só informa prontidão offline se recursos necessários estiverem disponíveis.

## Plataforma

Primeiro Chrome e Edge atuais no Windows, com versões registradas. Executar fluxo web no Firefox e documentar eventuais diferenças de instalação/encoders. Não declarar Safari ou iOS suportados sem verificar.

Tauri exige validação própria no Windows: instalador, WebView2, WASM por protocolo local, save dialog e permissões. Não chamar esses testes de concluídos em Linux.

## Visual e acessibilidade

Conferir estados definidos em INTERFACE.md, erros, transparência e zoom a 200%. Verificar navegação por teclado, foco e leitor de tela nos fluxos principais. Capturas não substituem verificação funcional.

## Comandos e evidências

Registrar comando, ambiente, data, resultado e limitações em STATUS.md.
Quando configurados: typecheck, lint, testes relevantes e build. E2E e smoke no preview de produção são necessários para o motor e PWA.

Sem repetir suites já aprovadas se nada relevante mudou. Se uma verificação não puder rodar, registrar pendência claramente.
