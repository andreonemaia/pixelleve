# Instruções para desenvolvimento do PixelLeve

Leia README.md e docs/STATUS.md antes de trabalhar. Os requisitos ficam em docs/PRODUTO.md; a ordem de execução em docs/ROADMAP.md.

## Regras do produto

- Imagens processadas no dispositivo. Nenhum upload, API externa de compressão ou telemetria.
- Recursos JS, fontes e WASM empacotados localmente; sem CDN em runtime.
- Compressão e métricas reais. Não simular resultados, downloads ou percentuais.
- Não prometer qualidade, economia ou compatibilidade que não foi verificada.
- Preservar originais e processar novamente sempre a partir da entrada original.
- Rejeitar animações no MVP sem descartar quadros silenciosamente.
- Conversão para JPEG com transparência exige escolha explícita de fundo.
- Diferenciar manter formato, conversão explícita e modo automático.
- Sem backend, banco, autenticação, pagamentos ou recursos de IA.

## Implementação

TypeScript strict; React para apresentação. Motor e adapters fora dos componentes.
Começar com um worker de processamento; aumentar concorrência somente com evidência.
Versionar cada job/configuração e descartar respostas antigas após cancelamento ou edição.
Controlar ciclo de vida de buffers, ImageBitmap, URLs de Blob e workers.
Não transformar a ausência de um codec em fallback silencioso de qualidade diferente.

## Fluxo de trabalho

Implemente a etapa solicitada e seus critérios. Apresente um plano curto e prossiga
com decisões rotineiras dentro do escopo. Preserve documentos e código existente.
Antes de adicionar dependências, confirme API, compatibilidade, versão e licença.
Use lockfile. Não crie funções vazias apresentadas como implementação completa.

Teste o comportamento relevante e o build de produção. Se uma verificação não
puder ser executada, registre como pendente com motivo. Atualize docs/STATUS.md,
docs/DEPENDENCIAS.md e docs/BENCHMARK.md quando cabível.
Relate mudanças, validação e limitações. O repositório público inicial e os
pushes desta abertura foram autorizados explicitamente. Publicações, pushes
e releases posteriores continuam dependendo de solicitação explícita.
