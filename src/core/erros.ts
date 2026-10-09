import { mensagemDoCodigo } from './mensagens'
import type { CodigoErro } from './tipos'

export class ErroMotor extends Error {
  readonly codigo: CodigoErro

  constructor(codigo: CodigoErro) {
    super(mensagemDoCodigo(codigo))
    this.name = 'ErroMotor'
    this.codigo = codigo
  }
}

export function codigoDeExcecao(erro: unknown): CodigoErro {
  if (erro instanceof ErroMotor) return erro.codigo
  if (erro instanceof Error && /memory|out of memory|allocation/i.test(erro.message)) {
    return 'OUT_OF_MEMORY'
  }
  return 'CODEC_UNAVAILABLE'
}
