/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WHATSAPP_NUMBER?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_DROPBOX_APP_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
