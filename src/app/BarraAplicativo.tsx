import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { podeAtualizarAgora } from '../core/atualizacao'
import { cacheCobreCodecs } from '../pwa/cache'

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>
}

let pedidoGuardado: EventoInstalacao | null = null

interface BarraAplicativoProps {
  processando: boolean
  exportando: boolean
}

export function BarraAplicativo({ processando, exportando }: BarraAplicativoProps) {
  const [pedido, definirPedido] = useState<EventoInstalacao | null>(pedidoGuardado)
  const [instalado, definirInstalado] = useState(estaInstalado)
  const [cachePronto, definirCachePronto] = useState(false)
  const registro = useRegisterSW()
  const prontoOffline = registro.offlineReady[0] || cachePronto
  const precisaAtualizar = registro.needRefresh[0]
  const podeAtualizar = podeAtualizarAgora(processando, exportando)

  useEffect(() => {
    const aoOferecer = (evento: Event) => {
      evento.preventDefault()
      const instalacao = evento as EventoInstalacao
      pedidoGuardado = instalacao
      definirPedido(instalacao)
    }
    const aoInstalado = () => {
      pedidoGuardado = null
      definirPedido(null)
      definirInstalado(true)
    }
    window.addEventListener('beforeinstallprompt', aoOferecer)
    window.addEventListener('appinstalled', aoInstalado)
    return () => {
      window.removeEventListener('beforeinstallprompt', aoOferecer)
      window.removeEventListener('appinstalled', aoInstalado)
    }
  }, [])

  useEffect(() => {
    let ativo = true
    let temporizador = 0
    const conferir = async () => {
      if (!('caches' in window)) return
      const urls: string[] = []
      const nomes = await caches.keys()
      for (const nome of nomes) {
        const cache = await caches.open(nome)
        for (const requisicao of await cache.keys()) urls.push(new URL(requisicao.url).pathname)
      }
      if (!ativo) return
      if (cacheCobreCodecs(urls)) {
        definirCachePronto(true)
        window.clearInterval(temporizador)
      }
    }
    void conferir()
    temporizador = window.setInterval(() => void conferir(), 500)
    return () => {
      ativo = false
      window.clearInterval(temporizador)
    }
  }, [])

  async function aoInstalar() {
    if (!pedido) return
    await pedido.prompt()
    pedidoGuardado = null
    definirPedido(null)
  }

  async function aoAtualizar() {
    if (!podeAtualizarAgora(processando, exportando)) return
    await registro.updateServiceWorker(true)
  }

  return (
    <section className="barra-aplicativo" aria-label="Aplicativo">
      {prontoOffline ? (
        <p data-teste="offline">
          Pronto para usar offline
        </p>
      ) : (
        <p>A disponibilidade offline aparece quando a interface e os codecs estiverem no cache.</p>
      )}
      {instalado ? null : pedido ? (
        <button type="button" data-teste="instalar" onClick={() => void aoInstalar()}>
          Instalar aplicativo
        </button>
      ) : (
        <p data-teste="orientacao-instalar">
          Para instalar no Windows, abra o menu do Chrome ou do Edge e escolha Instalar PixelLeve.
        </p>
      )}
      {precisaAtualizar ? (
        <div data-teste="atualizacao">
          <p>
            Há uma versão nova. Atualizar recarrega a página e encerra as imagens desta sessão. Baixe o que precisar
            antes.
          </p>
          <button type="button" data-teste="atualizar" disabled={!podeAtualizar} onClick={() => void aoAtualizar()}>
            Atualizar agora
          </button>
          {podeAtualizar ? null : <p>A atualização espera o lote ou a exportação terminar.</p>}
        </div>
      ) : null}
    </section>
  )
}

function estaInstalado(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
}
