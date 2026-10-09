export function escolherSaida(
  entrada: Uint8Array,
  saida: Uint8Array,
  manterFormatoEDimensoes: boolean,
): { bytes: Uint8Array; usouOriginal: boolean } {
  if (manterFormatoEDimensoes && saida.byteLength >= entrada.byteLength) {
    return { bytes: entrada, usouOriginal: true }
  }
  return { bytes: saida, usouOriginal: false }
}
