/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ICE_URLS: string
  readonly VITE_ICE_USERNAMES: string
  readonly VITE_ICE_CREDENTIALS: string
  readonly VITE_SYSTEM_MESSAGE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
