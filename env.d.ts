/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AMAP_KEY: string
  readonly VITE_API_BASE: string
  // 其他环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
