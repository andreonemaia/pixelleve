# PixelLeve

Aplicação planejada para comprimir, converter e redimensionar imagens para sites. Interface em português, processamento local, lotes e comparação entre original e resultado.

**Estado atual: lote no navegador, PWA no build web e aplicativo Windows exercitado no WebView2.** Dá para escolher várias imagens ou uma pasta, comprimir no dispositivo, redimensionar e baixar o resultado ou um ZIP. No desktop instalado, os mesmos passos usam diálogos nativos e uma pasta de saída; PNG, JPEG, WebP, transparência, redimensionamento, pasta, colisão, cancelamento e salvamentos foram conferidos no WebView2. A comparação abre sob demanda. O preview sem rede e o aviso de atualização da PWA foram exercitados no Chrome automatizado. A instalação pelo diálogo nativo da PWA, a janela instalada da PWA e o processamento do aplicativo Windows com a rede desligada ainda não foram executados. O instalador não está assinado. Ainda não é o aplicativo completo e não se compara aqui ao TinyPNG. O andamento está em [STATUS](docs/STATUS.md).

## Decisões iniciais

- Uma base React + TypeScript + Vite.
- Processamento real com WebAssembly em Web Workers.
- JPEG, PNG e WebP no MVP; AVIF em etapa posterior.
- A web e a PWA vieram primeiro. O Windows reutiliza a mesma aplicação com Tauri.
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

Um projeto Vite na raiz, com `src/` para a interface e o motor, e `src-tauri/` para a janela Windows. O build web sai em `dist`. O build desktop sai em `dist-desktop` e não registra service worker.

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
| `npm run desktop:dev` | Janela Windows com o Vite em `http://localhost:1420` |
| `npm run desktop:build` | Frontend local, executável e instalador NSIS |

`npm run test:motor` depende do Google Chrome instalado. Ele gera o build e abre o preview em `http://127.0.0.1:4173`. Esse endereço, ou outro HTTPS, é o que vale para a PWA. `npm run dev` não registra o service worker. Um teste nesse Chrome não comprova o WebView2.

Para a PWA, sirva o build web e abra no Chrome ou no Edge. Se o botão “Instalar aplicativo” aparecer, use-o. Se não aparecer, abra o menu do navegador e escolha Instalar PixelLeve. Espere “Pronto para usar offline” antes de desligar a rede. Feche o aplicativo, desconecte a rede e abra de novo. “Atualizar agora” só fica disponível com o lote e a exportação parados. Se a sessão ainda tem imagens ou resultados, a tela avisa a perda e oferece continuar na versão atual. Aceitar recarrega e descarta essa sessão.

Para o Windows, com Rust, ferramentas C++ do alvo MSVC e WebView2:

```text
npm run desktop:dev
npm run desktop:build
```

O instalador sai em `src-tauri/target/release/bundle/nsis/PixelLeve_0.1.0_x64-setup.exe`. Ele não está assinado e instala só para o usuário atual. A cópia gerada em 9 de outubro de 2026 foi instalada, exercitada no WebView2 e reinstalada depois de uma desinstalação silenciosa. Se o WebView2 não estiver instalado, o instalador tenta baixar o bootstrapper e precisa de rede nessa etapa.

Para repetir a prova que ainda falta, encerre o Vite, desconecte a rede e abra o PixelLeve instalado. Escolha um PNG local, comprima e confira o resultado. Não foi possível isolar a rede desta máquina sem desligar o adaptador ou bloquear o WebView2 compartilhado com outros programas, então esse passo continua manual.

## Publicação e contribuição

Hospedagem estática é suficiente para a versão web. O repositório público e os pushes iniciais foram autorizados na tarefa de abertura do projeto. O push desta etapa desktop também foi autorizado. Domínio, hospedagem da aplicação e release pública do instalador continuam dependendo de uma solicitação explícita.

A licença do código do projeto ainda não foi escolhida. As licenças de bibliotecas e binários WASM precisam ser registradas desde a prova técnica. Não incluir fotos privadas ou resultados pessoais no repositório.
