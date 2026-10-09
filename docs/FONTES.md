# Fontes técnicas

Consultadas em 9 de outubro de 2026. São referências primárias para a arquitetura e instruções; não comprovam que a combinação de dependências deste projeto já funciona. Conferir novamente durante a instalação.

| Fonte | O que fundamenta |
| --- | --- |
| [Cursor Rules](https://cursor.com/docs/rules) | Regras de projeto em .cursor/rules com extensão .mdc, frontmatter e alwaysApply; AGENTS.md como instruções Markdown |
| [jSquash](https://github.com/jamsinclair/jSquash) | Coleção WASM voltada a navegador/workers, codecs disponíveis e problemas conhecidos com Vite/workers aninhados |
| [Squoosh](https://github.com/GoogleChromeLabs/squoosh) | Referência de aplicação de compressão no navegador; inspiração, sem copiar identidade |
| [OxiPNG](https://github.com/oxipng/oxipng) | Otimização PNG sem perdas; distinção em relação a quantização |
| [Vite PWA](https://vite-pwa-org.netlify.app/guide/) | Integração de PWA ao build Vite |
| [Precache](https://vite-pwa-org.netlify.app/guide/service-worker-precache) | Recursos necessários no cache para uso offline |
| [Atualização PWA](https://vite-pwa-org.netlify.app/guide/prompt-for-update) | Atualização do service worker e recursos |
| [Tauri pré-requisitos](https://v2.tauri.app/start/prerequisites/) | Rust, C++ Build Tools e WebView2 para desenvolvimento Windows |
| [Tauri capabilities](https://v2.tauri.app/security/capabilities/) | Permissões e limites das integrações desktop |
| [Tauri WebViews](https://v2.tauri.app/reference/webview-versions/) | Runtime de renderização depende da plataforma/dispositivo |

## Interpretação das referências

As bibliotecas acima tornam a proposta tecnicamente plausível. A decisão de começar pela web, os presets, limites e divisão de etapas são recomendações do projeto. Integração de WASM, qualidade visual, economia e funcionamento offline precisam ser demonstrados pelo código e testes.

As versões não foram fixadas nesta documentação. A etapa 0 deve inspecionar versões atuais, tipos exportados e exemplos oficiais antes de escrever wrappers. Não construir o projeto sobre APIs lembradas de tutoriais antigos.
