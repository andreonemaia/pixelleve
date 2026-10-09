import { codigoDeExcecao, ErroMotor } from '../core/erros'
import { mensagemDoCodigo } from '../core/mensagens'
import { processarImagem } from '../motor/processarImagem'
import type { PedidoProcessamento, RespostaErro, RespostaResultado } from './protocolo'

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
