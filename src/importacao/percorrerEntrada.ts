export interface EntradaSistema {
  isFile: boolean
  isDirectory: boolean
  name: string
  lerArquivo: () => Promise<File>
  lerFilhos: () => Promise<EntradaSistema[]>
}

export interface EntradaImportada {
  arquivo: File
  caminhoRelativo: string
}

export async function percorrerEntrada(
  entrada: EntradaSistema,
  caminho: string,
  destino: EntradaImportada[],
): Promise<void> {
  if (entrada.isFile) {
    const arquivo = await entrada.lerArquivo()
    destino.push({ arquivo, caminhoRelativo: caminho || arquivo.name })
    return
  }
  if (!entrada.isDirectory) return
  const filhos = await entrada.lerFilhos()
  for (const filho of filhos) {
    const proximo = caminho ? `${caminho}/${filho.name}` : filho.name
    await percorrerEntrada(filho, proximo, destino)
  }
}
