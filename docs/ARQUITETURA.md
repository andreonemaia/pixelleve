# Arquitetura

## Organização

Uma aplicação Vite na raiz. React apresenta estados; módulos TypeScript independentes cuidam de jobs, escolha de saída, resize e codecs. Um adapter abstrai entrada e salvamento para web e, depois, desktop.

| Pasta planejada | Responsabilidade |
| --- | --- |
| src/app | Layout, composição e estado da sessão |
| src/features/import | Seleção, drag and drop e validação inicial |
| src/features/queue | Lista, ações e status |
| src/features/compare | Visualização sincronizada |
| src/core | Contratos, opções, resize, seleção de resultado e métricas |
| src/codecs | Wrappers pequenos para encoders/decoders |
| src/workers | Processamento e mensagens |
| src/platform | Importação e exportação web/desktop |
| src/components | Componentes visuais reutilizáveis |
| tests/fixtures | Fixtures pequenas, sintéticas ou com licença registrada |
| src-tauri | Somente na etapa Windows |

Não criar pacotes, microserviços ou um monorepo antes de haver necessidade.

## Fluxo de processamento

1. Validar assinatura, formato, animação e dimensões com leitura limitada do cabeçalho.
2. Registrar File original e metadados mínimos em memória; gerar thumbnail sob demanda.
3. Congelar opções, atribuir jobId e revision e colocar na fila.
4. No worker, decodificar quando necessário, normalizar orientação/cor e redimensionar.
5. Codificar ou otimizar com o codec selecionado.
6. Verificar formato, tamanho, dimensões e integridade; selecionar resultado conforme intenção.
7. Retornar Blob/ArrayBuffer e métricas; criar preview apenas quando necessário.
8. Exportar e liberar recursos no ciclo de vida correto.

Quando o PNG não requer transformação, preferir otimizar os bytes existentes, evitando recodificação desnecessária. Transparência e equivalência de pixels devem ser verificadas nos fixtures.

## Motor proposto

| Operação | Candidato | Condição |
| --- | --- | --- |
| JPEG | @jsquash/jpeg com MozJPEG | Verificar API, workers e build |
| WebP | @jsquash/webp com libwebp | Verificar alpha e saída real |
| PNG encode/decode | @jsquash/png | Usar quando necessário; não substituir otimizador |
| PNG otimização | @jsquash/oxipng | Sem perdas; validar dependências de threading |
| Resize | @jsquash/resize ou pipeline nativo validado | Escolher por evidência de qualidade e integração |
| AVIF futuro | @jsquash/avif com libavif | Validar tempo, memória e WebView2 antes de ativar |
| ZIP | fflate como candidato | Validar exportação real e uso de memória |

jSquash é uma coleção de codecs WASM voltada a navegador e Web Worker. Sua documentação relata problemas de integração com Vite e workers aninhados. A etapa 0 existe para testar essa integração e registrar a combinação de versões que realmente funciona [1].

Começar com execução single-thread quando disponível e um worker de aplicação. Verificar se o build selecionado exige SharedArrayBuffer, workers aninhados ou isolamento de origem. Não presumir que single-thread seja uma opção disponível em toda versão. Não fixar antigas versões especiais sem avaliar manutenção e compatibilidade.

Se threading exigir COOP/COEP, documentar e testar na hospedagem e no WebView2; preferir uma variante validada sem essas exigências para o MVP. Canvas pode servir para renderização/normalização quando apropriado, mas nunca deve ser apresentado como esses codecs.

## Contratos indicativos

```ts
type OutputFormat = 'original' | 'jpeg' | 'png' | 'webp' | 'avif';
type JobStatus =
  | 'queued' | 'processing' | 'completed'
  | 'unchanged' | 'failed' | 'cancelled';

interface ProcessingOptions {
  format: OutputFormat;
  preset: 'light' | 'balanced' | 'maximum';
  maxWidth?: number;
  maxHeight?: number;
  allowUpscale: boolean;
  jpegBackground?: string;
}

interface ProcessRequest {
  jobId: string;
  revision: number;
  input: ArrayBuffer;
  options: ProcessingOptions;
}

interface ProcessResult {
  jobId: string;
  revision: number;
  bytes: ArrayBuffer;
  mime: string;
  extension: string;
  width: number;
  height: number;
  inputBytes: number;
  outputBytes: number;
  durationMs: number;
  usedOriginal: boolean;
  warnings: string[];
}
```

Esses contratos orientam implementação; não são APIs de bibliotecas externas. AVIF não fica habilitado no MVP. Adicionar mensagens discriminadas para started/result/error e progresso por etapas. Não inventar percentual de progresso interno quando o codec não o expõe.

Erros com código e mensagem amigável: UNSUPPORTED_FORMAT, ANIMATED_INPUT, INVALID_IMAGE, TOO_LARGE, ALPHA_BACKGROUND_REQUIRED, CODEC_UNAVAILABLE, OUT_OF_MEMORY, EXPORT_FAILED. Falha de um item não encerra a fila.

## Fila e memória

Um job pesado por vez no início. Guardar File como fonte, evitar múltiplas cópias de RGBA e fazer transfer de buffers quando seguro. Um ArrayBuffer transferido fica indisponível no emissor: ler uma cópia nova do File em retries, sem perder a fonte.

Não decodificar um lote inteiro para preparar miniaturas. Limitar thumbnails, inicializar codecs sob demanda e liberar ImageBitmap, buffers e URLs ao remover itens ou encerrar sessão.

Cancelamento de WASM síncrono pode exigir terminar o worker. Se isso acontecer, reiniciar para o próximo item. Descartar resultados de jobs removidos ou revisions antigas. Mudança de opções exige novo job a partir do original. Exportar só resultados da revision atual.

ZIP pode exigir memória adicional. Verificar orçamento antes de exportar; permitir exportar seleção ou arquivos individuais. PNG/JPEG/WebP já comprimidos podem ir ao ZIP sem compressão DEFLATE pesada. Falha na exportação não deve apagar resultados.

## Plataformas

Web: file input e drag/drop; download por Blob como base; APIs de filesystem somente como aprimoramento detectado. Cancelar diálogo é uma ação normal.

PWA: precache de shell, chunks e WASM. Lazy loading não garante que um codec esteja offline. Ajustar limites de tamanho do precache com consciência do custo e mostrar prontidão real; verificar todos os codecs offline após nova abertura. O manifest sozinho não basta [2].

Desktop: adapter Tauri para diálogos e filesystem; permissões mínimas para caminhos escolhidos. Não carregar frontend remoto nem instalar service worker no build desktop. Recursos WASM precisam resolver corretamente pelo protocolo local [3].

## Segurança e privacidade

Não persistir imagens por padrão em IndexedDB ou filesystem; apenas preferências não sensíveis. Reset libera a sessão. Sem fontes remotas ou analytics. Preview de nomes como texto, nunca HTML. Sanitizar nomes para download/ZIP e impedir caminhos relativos perigosos. Detectar formato por conteúdo.

CSP e configuração do service worker devem acomodar os recursos WASM/worker realmente utilizados, com o mínimo necessário. No desktop, restringir capabilities aos diálogos e saídas escolhidas, sem permissão global de filesystem [3].

## Referências

[1] https://github.com/jamsinclair/jSquash  
[2] https://vite-pwa-org.netlify.app/guide/service-worker-precache  
[3] https://v2.tauri.app/security/capabilities/
