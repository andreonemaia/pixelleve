import { codigoDeExcecao, ErroMotor } from '../core/erros'
import { mensagemDoCodigo } from '../core/mensagens'
import { processarImagem } from '../motor/processarImagem'
import type { OpcoesProcessamento, SaidaMotor } from '../core/tipos'

interface PedidoProcessamento {
  tipo: 'processar'
  jobId: string
  revisao: number
  opcoes: OpcoesProcessamento
  bytes: ArrayBuffer
}

interface RespostaResultado extends SaidaMotor {
  tipo: 'resultado'
  jobId: string
  revisao: number
  duracaoMs: number
}

interface RespostaErro {
  tipo: 'erro'
  jobId: string
  revisao: number
  codigo: string
  mensagem: string
}

interface EscopoWorker {
  onmessage: ((evento: MessageEvent<PedidoProcessamento>) => void) | null
  postMessage(mensagem: RespostaResultado | RespostaErro, transferencia?: Transferable[]): void
}

const escopo = self as unknown as EscopoWorker

escopo.onmessage = (evento: MessageEvent<PedidoProcessamento>) => {
  const pedido = evento.data
  if (pedido.tipo !== 'processar') return
  void responder(pedido)
}

async function responder(pedido: PedidoProcessamento): Promise<void> {
  const inicio = performance.now()
  try {
    const saida = await processarImagem(pedido.bytes, pedido.opcoes)
    const resposta: RespostaResultado = {
      tipo: 'resultado',
      jobId: pedido.jobId,
      revisao: pedido.revisao,
      duracaoMs: Math.round(performance.now() - inicio),
      ...saida,
    }
    escopo.postMessage(resposta, [resposta.bytes])
  } catch (erro) {
    const codigo = codigoDeExcecao(erro)
    const resposta: RespostaErro = {
      tipo: 'erro',
      jobId: pedido.jobId,
      revisao: pedido.revisao,
      codigo,
      mensagem: erro instanceof ErroMotor ? erro.message : mensagemDoCodigo(codigo),
    }
    escopo.postMessage(resposta)
  }
}
