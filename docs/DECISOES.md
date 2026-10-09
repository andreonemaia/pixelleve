# Decisões de projeto

## D01 Web primeiro com PWA e depois Tauri

Recomendação aceita como base de planejamento. Uma aplicação web permite validar interface e codecs; PWA atende instalação inicial; Tauri adiciona integração Windows reutilizando a aplicação. A recomendação não significa que empacotar desktop seja automático ou já testado.

## D02 Sem backend de processamento

Os codecs executam no dispositivo. Hospedagem estática basta para distribuir a versão web. O uso cotidiano não precisa de API paga, mas desenvolvimento, hospedagem escolhida e distribuição podem ter custos. Não prometer custo total zero em qualquer cenário.

## D03 Uma aplicação simples

React + TypeScript strict + Vite, motor isolado e adapters. Sem monorepo inicial. npm e lockfile para reproduzir a integração. Versões são definidas na prova técnica, não presumidas pela documentação.

## D04 PNG sem perdas antes de quantização

OxiPNG otimiza PNG sem perdas; reduzir paleta é outra operação [1]. MVP oferece a primeira. Quantização pode melhorar redução em certos PNGs, mas exige avaliação de qualidade, pacote e licença antes de entrar. Não apresentar otimização estrutural como equivalente à abordagem TinyPNG.

## D05 JPEG e WebP antes de AVIF

AVIF entra depois dos testes de velocidade e memória. Esse recorte permite ter MVP utilizável enquanto investigamos integração e custo computacional. Não habilitar opção visual vazia.

## D06 Um worker pesado por vez

Começar com consumo previsível de memória. Concorrência só aumenta com benchmark do corpus e máquina definidos. Número de núcleos não é evidência de memória suficiente.

## D07 Sem persistência automática de imagens

Arquivos permanecem na sessão; preferências podem persistir. Cache offline pertence aos recursos do app. Histórico de arquivos e pastas monitoradas não fazem parte do escopo inicial.

## D08 Identidade provisória

PixelLeve e paleta neutra/verde petróleo são propostas para permitir desenvolvimento imediato. Nome não passou por verificação de marca ou disponibilidade de domínio. Não criar domínio ou branding definitivo agora.

## D09 Prova técnica com OxiPNG single-thread e TypeScript 6.0.3

A etapa 0 chama o build `codec/pkg` do `@jsquash/oxipng` 2.3.0, sem o pacote paralelo. Assim o preview não precisa de COOP/COEP. JPEG e WebP usam os módulos Emscripten com `locateFile` apontando para os WASM emitidos pelo Vite. TypeScript ficou em 6.0.3 porque o `typescript-eslint` instalado não aceita a 7.0.2.

## Questões abertas

- Resultado do script Python atual do usuário e parâmetros que ele utiliza.
- Combinação exata de versões e variantes WASM que funciona no build.
- Tratamento verificável de perfis ICC/CMYK pelo pipeline escolhido.
- Limites de arquivos, memória e tempo calibrados em máquina real.
- Licença do projeto antes de publicação open-source.
- Plataforma de hospedagem, domínio e assinatura Windows quando necessários.

Questões abertas não impedem começar a etapa 0. Registrar decisões novas e sua evidência.

[1] https://github.com/oxipng/oxipng
