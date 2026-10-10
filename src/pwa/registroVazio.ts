type Bandeira = [boolean, (valor: boolean | ((atual: boolean) => boolean)) => void]

export function useRegisterSW() {
  const par: Bandeira = [false, () => undefined]
  return {
    needRefresh: par,
    offlineReady: par,
    updateServiceWorker: async () => undefined,
  }
}
