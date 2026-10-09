import { useEffect, useRef, useState } from 'react'

interface MiniaturaProps {
  arquivo: File
}

export function Miniatura({ arquivo }: MiniaturaProps) {
  const referencia = useRef<HTMLImageElement>(null)
  const [url, setUrl] = useState('')

  useEffect(() => {
    const elemento = referencia.current
    if (!elemento) return
    const observador = new IntersectionObserver((entradas) => {
      if (!entradas.some((entrada) => entrada.isIntersecting)) return
      setUrl(URL.createObjectURL(arquivo))
      observador.disconnect()
    })
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [arquivo])

  useEffect(() => {
    if (!url) return
    return () => URL.revokeObjectURL(url)
  }, [url])

  return <img ref={referencia} className="miniatura" src={url || undefined} alt="" />
}
