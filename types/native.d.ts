export type NativeApi = {
  readonly platform: NodeJS.Platform
  revealDbFile(): Promise<void>
}

declare global {
  interface Window {
    native?: NativeApi
  }
}

export {}
