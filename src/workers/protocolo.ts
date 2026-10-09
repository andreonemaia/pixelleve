import type { OpcoesProcessamento, SaidaMotor } from '../core/tipos'

export interface PedidoProcessamento {
  tipo: 'processar'
  jobId: string
  revisao: number
  opcoes: OpcoesProcessamento
  bytes: ArrayBuffer
}

export interface RespostaResultado extends SaidaMotor {
  tipo: 'resultado'
  jobId: string
  revisao: number
  duracaoMs: number
}

export interface RespostaErro {
  tipo: 'erro'
  jobId: string
  revisao: number
  codigo: string
  mensagem: string
}

export type RespostaWorker = RespostaResultado | RespostaErro
