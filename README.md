# PixelLeve

Aplicação planejada para comprimir, converter e redimensionar imagens para sites. Interface em português, processamento local, lotes e comparação entre original e resultado.

**Estado atual: lote no navegador, ainda sem redimensionar, slider, PWA ou desktop.** Dá para escolher várias imagens ou uma pasta, comprimir no dispositivo e baixar o resultado ou um ZIP. A comparação abre sob demanda. Ainda não é o aplicativo completo, não foi verificado offline e não se compara aqui ao TinyPNG. O andamento está em [STATUS](docs/STATUS.md).

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

## Comandos

Na pasta do projeto, com Node.js 20.19+, 22.12+ ou 24:

```text
npm ci
npm run dev
```

`npm run dev` abre o servidor de desenvolvimento. Para conferir o mesmo caminho do teste de produção:

```text
npm run build
npm run preview
```

| Comando | Objetivo |
| --- | --- |
| `npm ci` | Instala a partir do lockfile |
| `npm run dev` | Desenvolvimento |
| `npm run build` | Typecheck e distribuição em `dist` |
| `npm run preview` | Serve o build local |
| `npm run typecheck` | TypeScript strict |
| `npm run lint` | ESLint |
| `npm test` | Vitest, sem navegador |
| `npm run test:motor` | Build e testes do motor no Google Chrome instalado |

`npm run test:motor` depende do Google Chrome instalado. O fluxo de ponta a ponta da interface, o ZIP e o teste sem rede ficam para as próximas etapas.

## Publicação e contribuição

Hospedagem estática é suficiente para a versão web. O repositório público e os pushes iniciais foram autorizados na tarefa de abertura do projeto. Domínio, hospedagem da aplicação, releases e pushes posteriores dependem de uma solicitação explícita.

A licença do código do projeto ainda não foi escolhida. As licenças de bibliotecas e binários WASM precisam ser registradas desde a prova técnica. Não incluir fotos privadas ou resultados pessoais no repositório.
