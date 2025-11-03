/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_DATABASE_URL: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_MEASUREMENT_ID: string
  readonly VITE_GOOGLE_API_KEY: string
  readonly VITE_CLOUDINARY_CLOUD_NAME: string
  readonly VITE_CLOUDINARY_UPLOAD_PRESET: string
  readonly VITE_FEATUREABLE_ID: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_MAINTENANCE_MODE: string
  readonly VITE_WEB3_FORM: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
