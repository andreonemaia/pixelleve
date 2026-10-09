# PixelLeve

Aplicação planejada para comprimir, converter e redimensionar imagens para sites. Interface em português, processamento local, lotes e comparação entre original e resultado.

**Estado atual: especificação preparada. Não há aplicação executável neste pacote.** Leia [COMECE-AQUI.md](COMECE-AQUI.md) para iniciar no Cursor.

## Decisões iniciais

- Uma base React + TypeScript + Vite.
- Processamento real com WebAssembly em Web Workers.
- JPEG, PNG e WebP no MVP; AVIF em etapa posterior.
- PWA antes de aplicativo Windows com Tauri.
- Sem backend obrigatório, login, API paga ou telemetria.
- Sem quotas comerciais; proteções técnicas contra excesso de memória.
- Original preservado; saídas nunca sobrescrevem entradas automaticamente.

## Documentação

| Arquivo | Uso |
| --- | --- |
| [PRODUTO](docs/PRODUTO.md) | Escopo, requisitos e critérios de aceitação |
| [ARQUITETURA](docs/ARQUITETURA.md) | Motor, workers, filas, formatos e plataformas |
| [INTERFACE](docs/INTERFACE.md) | Direção visual e estados da experiência |
| [ROADMAP](docs/ROADMAP.md) | Etapas e condições de conclusão |
| [VALIDACAO](docs/VALIDACAO.md) | Testes de integridade, privacidade e operação |
| [BENCHMARK](docs/BENCHMARK.md) | Método e registro de resultados reais |
| [DECISOES](docs/DECISOES.md) | Motivos das escolhas e questões ainda abertas |
| [DEPENDENCIAS](docs/DEPENDENCIAS.md) | Registro de versões e licenças a preencher |
| [STATUS](docs/STATUS.md) | Andamento e próximo passo |
| [FONTES](docs/FONTES.md) | Referências primárias |
| [Prompts](prompts/ETAPAS.md) | Instruções para cada etapa no Cursor |

## Estrutura planejada

Um projeto Vite simples, sem monorepo no início. O Cursor criará `src/`, testes e configuração durante a etapa 0. `src-tauri/` só será criado na etapa 4.

## Comandos futuros

Os scripts abaixo deverão ser implementados na etapa 0. Eles ainda não existem.

| Comando | Objetivo |
| --- | --- |
| `npm install` | Instalar dependências na primeira montagem |
| `npm ci` | Instalação reproduzível após existir lockfile |
| `npm run dev` | Desenvolvimento |
| `npm run build` | Gerar distribuição |
| `npm run preview` | Servir o build para verificar WASM e PWA |
| `npm run typecheck` | Verificação TypeScript |
| `npm run lint` | Verificação estática |
| `npm test` | Testes de unidades |
| `npm run test:e2e` | Fluxos reais no navegador, a partir da etapa 1 |

## Publicação e contribuição

Hospedagem estática é suficiente para a versão web. O repositório público e os pushes iniciais foram autorizados na tarefa de abertura do projeto. Domínio, hospedagem da aplicação, releases e pushes posteriores dependem de uma solicitação explícita.

A licença do código do projeto ainda não foi escolhida. As licenças de bibliotecas e binários WASM precisam ser registradas desde a prova técnica. Não incluir fotos privadas ou resultados pessoais no repositório.
