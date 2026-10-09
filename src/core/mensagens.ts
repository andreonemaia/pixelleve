import type { CodigoErro } from './tipos'

export function mensagemDoCodigo(codigo: CodigoErro): string {
  switch (codigo) {
    case 'UNSUPPORTED_FORMAT':
      return 'Use uma imagem estática PNG, JPEG ou WebP.'
    case 'ANIMATED_INPUT':
      return 'Imagens animadas ainda não são aceitas.'
    case 'INVALID_IMAGE':
      return 'Não foi possível ler esta imagem. O arquivo parece inválido ou incompleto.'
    case 'TOO_LARGE':
      return 'Esta imagem passa do limite técnico: 40 MiB ou 24 megapixels.'
    case 'ALPHA_BACKGROUND_REQUIRED':
      return 'JPEG não guarda transparência. Escolha uma cor de fundo antes de converter.'
    case 'CODEC_UNAVAILABLE':
      return 'O codec necessário não ficou disponível neste navegador.'
    case 'OUT_OF_MEMORY':
      return 'Não houve memória suficiente para processar esta imagem.'
    case 'EXPORT_FAILED':
      return 'Não foi possível preparar o arquivo para download.'
  }
}
