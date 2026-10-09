import { esvaziarLeitor } from './esvaziarLeitor'
import { percorrerEntrada, type EntradaImportada, type EntradaSistema } from './percorrerEntrada'

export function navegadorAceitaPasta(): boolean {
  return 'webkitdirectory' in document.createElement('input')
}

export function navegadorAceitaArrasteDePasta(): boolean {
  return typeof DataTransferItem !== 'undefined' && 'webkitGetAsEntry' in DataTransferItem.prototype
}

export function entradasDeLista(lista: FileList, usarCaminho: boolean): EntradaImportada[] {
  return Array.from(lista).map((arquivo) => ({
    arquivo,
    caminhoRelativo: usarCaminho && arquivo.webkitRelativePath ? arquivo.webkitRelativePath : arquivo.name,
  }))
}

export async function coletarDoArraste(lista: DataTransferItemList): Promise<EntradaImportada[]> {
  const destino: EntradaImportada[] = []
  const tarefas: Promise<void>[] = []
  for (let indice = 0; indice < lista.length; indice += 1) {
    const item = lista[indice]
    const bruto = item.webkitGetAsEntry?.() ?? null
    if (bruto) {
      tarefas.push(percorrerEntrada(adaptar(bruto), bruto.name, destino))
      continue
    }
    const arquivo = item.getAsFile()
    if (arquivo) destino.push({ arquivo, caminhoRelativo: arquivo.name })
  }
  await Promise.all(tarefas)
  return destino
}

function adaptar(entrada: FileSystemEntry): EntradaSistema {
  return {
    isFile: entrada.isFile,
    isDirectory: entrada.isDirectory,
    name: entrada.name,
    lerArquivo: () =>
      new Promise((resolve, reject) => {
        ;(entrada as FileSystemFileEntry).file(resolve, reject)
      }),
    lerFilhos: async () => {
      const leitor = (entrada as FileSystemDirectoryEntry).createReader()
      const filhos = await esvaziarLeitor(
        () =>
          new Promise<FileSystemEntry[]>((resolve, reject) => {
            leitor.readEntries(resolve, reject)
          }),
      )
      return filhos.map(adaptar)
    },
  }
}
