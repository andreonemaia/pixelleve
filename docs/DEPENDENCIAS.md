# Dependências e ambiente

## Estado

Nenhuma dependência foi instalada. As linhas abaixo são candidatas, não uma lista de versões testadas.

| Item | Finalidade | Versão testada | Licença verificada | Estado |
| --- | --- | --- | --- | --- |
| Node.js LTS e npm | Toolchain | Pendente | Pendente | Verificar requisito do Vite |
| React e TypeScript | UI e contratos | Pendente | Pendente | Etapa 0 |
| Vite | Build e workers | Pendente | Pendente | Etapa 0 |
| Tailwind CSS | Estilos | Pendente | Pendente | Etapa 1; usar integração atual |
| @jsquash/jpeg | JPEG/MozJPEG | Pendente | Pendente | Etapa 0 |
| @jsquash/webp | WebP/libwebp | Pendente | Pendente | Etapa 0 |
| @jsquash/png | PNG decode/encode | Pendente | Pendente | Conforme necessidade |
| @jsquash/oxipng | PNG sem perdas | Pendente | Pendente | Etapa 0 |
| @jsquash/resize | Resize | Pendente | Pendente | Avaliar na etapa 1 |
| fflate | ZIP | Pendente | Pendente | Etapa 1 |
| Vitest | Testes unitários | Pendente | Pendente | Etapa 0 |
| Playwright | Testes de navegador | Pendente | Pendente | Etapa 1 |
| vite-plugin-pwa | Cache/manifest | Pendente | Pendente | Etapa 2 |
| @jsquash/avif | AVIF/libavif | Pendente | Pendente | Etapa 3 |
| Tauri 2 e plugins | Windows | Pendente | Pendente | Etapa 4 |

## Registro obrigatório durante implementação

Registrar versão exata, origem oficial, data, requisito de Node, variante WASM, comportamento single/multithread, necessidade de headers e licenças/avisos dos binários incluídos. Validar compatibilidade e criar lockfile. Não fixar versões antigas copiadas de exemplos sem avaliar.

Manter lista curta de dependências. Não adicionar biblioteca de estado, componente ou RPC apenas para estruturar uma aplicação pequena.

## Windows futuro

O desenvolvimento Tauri no Windows exige Rust, Microsoft C++ Build Tools e WebView2 conforme a documentação oficial. Escolher formato do instalador e registrar pré-requisitos correspondentes. Referência: https://v2.tauri.app/start/prerequisites/

Essas ferramentas não são necessárias para começar a versão web. O usuário final não deve precisar instalar Node ou Rust para usar o aplicativo empacotado.
