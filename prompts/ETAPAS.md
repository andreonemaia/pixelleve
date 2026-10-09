# Prompts por etapa

Use um prompt por sessão ou etapa concluída. O primeiro está em COMECE-AQUI.md. Não execute prompts posteriores se os critérios da etapa anterior estiverem bloqueados.

## Etapa 1 MVP web

```text
Implemente a etapa 1 do PixelLeve.
Leia AGENTS.md, docs/STATUS.md, docs/PRODUTO.md, docs/ARQUITETURA.md,
docs/INTERFACE.md, docs/ROADMAP.md e docs/VALIDACAO.md.
Confira a evidência da etapa 0 e resolva bloqueios que impeçam o MVP.

Preserve o motor validado e implemente uma interface em português com
dropzone, fila, presets, PNG/JPEG/WebP, resize proporcional, comparação,
download individual e ZIP reais. Siga a direção visual da documentação.
Sem AVIF, modo automático ou desktop nesta etapa.

Trate transparência, animações, resultados maiores, nomes duplicados,
cancelamento, alterações de configuração e limites de memória.
Use snapshots por job e reprocessamento a partir do original.
Não habilite controles sem motor funcional.

Implemente e execute testes relevantes de funções e fluxos no navegador.
Valide também produção e visual em larguras 1440, 1024 e 390 px,
teclado e zoom a 200%. Registre diferenças de suporte sem inventar testes.
Atualize documentação e relato de resultados, limitações e comandos.
Não publicar nem fazer push.
```

## Etapa 2 PWA

```text
Implemente a etapa 2 do PixelLeve após conferir a etapa 1 em docs/STATUS.md.
Leia requisitos PWA em PRODUTO.md, ARQUITETURA.md e VALIDACAO.md.

Adicione manifest, ícones locais, service worker e fluxo de atualização
que preserve lotes ativos. Inclua no cache chunks e binários WASM de
todos os codecs anunciados como disponíveis offline.
Confira configurações de tamanho máximo de precache e runtime.

Valide build de produção em localhost ou HTTPS, instalação no navegador
alvo, fechar/reabrir offline e processar cada formato, incluindo um
codec que não foi usado antes de desligar a rede.
Não diga "offline pronto" se faltarem recursos ou a verificação.
Não persistir imagens do usuário; só recursos do app e preferências.

Teste atualização com lote ativo e recursos de versão nova.
Atualize STATUS.md com testes realmente executados e pendências.
Não implementar Tauri ainda, não publicar e não fazer push.
```

## Etapa 3 AVIF e modo automático

```text
Implemente a etapa 3 conforme ROADMAP.md, BENCHMARK.md e ARQUITETURA.md.
Leia STATUS.md e confira as etapas anteriores.

Valide @jsquash/avif no worker e no build; meça tempo, memória,
transparência e qualidade em corpus registrado antes de habilitar AVIF.
Não use WebP com extensão .avif como fallback.

Adicione "Otimizar para web" com formatos permitidos pela pessoa,
preservação de alpha, candidatos limitados e orçamento de tempo.
Inclua o original quando compatível.
Escolha uma métrica de qualidade, implementação e limiar calibrado;
registre tudo antes de anunciar seleção automática.
Se esse critério não puder ser validado, mantenha presets manuais e
registre o bloqueio sem simular o modo automático.

Compare formatos iguais e dimensões iguais nos benchmarks.
Não envie imagens a TinyPNG automaticamente; comparação externa só
quando houver dados reais autorizados. Atualize documentos e execute
testes pertinentes. Sem desktop, publicação ou push nesta etapa.
```

## Etapa 4 Windows com Tauri

```text
Implemente a etapa 4 reutilizando a aplicação do PixelLeve.
Leia STATUS.md, ARQUITETURA.md, ROADMAP.md, VALIDACAO.md e FONTES.md.
Confirme versões e pré-requisitos Tauri 2 no ambiente Windows.

Adicione src-tauri, configuração, adapter de import/export e diálogos
nativos. Empacote frontend e WASM localmente, sem frontend remoto.
Desative registro de service worker no build desktop.
Use capabilities mínimas; permita salvar só no destino escolhido,
com nomes sanitizados e sem sobrescrita silenciosa.

Verifique worker/WASM no protocolo Tauri, alpha e codecs no WebView2,
cancelamento de diálogos, falta de permissão, instalação e abertura
offline. Gere e teste instalador no Windows; um build web não comprova
desktop. Se o ambiente não permitir, registre a limitação e o passo
exato pendente, sem afirmar que o instalador foi validado.

Documente build e requisitos para desenvolvedor e usuário final.
Atualize STATUS.md e DEPENDENCIAS.md com execução real.
Sem publicar release, fazer push ou ativar updater automático.
```

## Retomar uma sessão

```text
Retome o PixelLeve lendo AGENTS.md e docs/STATUS.md.
Confira código e resultados registrados; identifique a etapa atual e
a próxima tarefa independente. Continue dentro da etapa já solicitada.
Não refaça trabalho concluído nem avance para etapa futura por conta própria.
No final, atualize o andamento, verificações e pendências.
```

## Revisar uma etapa

```text
Revise a etapa atual do PixelLeve contra seus critérios em PRODUTO.md,
ROADMAP.md e VALIDACAO.md. Inspecione o código, rode as verificações
relevantes que ainda faltam e corrija defeitos dentro desse escopo.
Priorize integridade de arquivos, alpha, resultados reais, privacidade,
cancelamento, memória e build de produção.
Diferencie falhas encontradas de itens ainda não verificados.
Atualize STATUS.md e relate evidências. Não adicionar funções futuras.
```
