/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

declare module '*.wasm?url' {
  const url: string
  export default url
}

declare module 'wasm-feature-detect' {
  export function simd(): Promise<boolean>
}
