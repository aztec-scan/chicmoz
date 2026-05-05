/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_KEY?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_L2_NETWORK_ID?: string;
  readonly VITE_VERSION_STRING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
