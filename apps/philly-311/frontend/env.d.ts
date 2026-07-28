// ABOUTME: Vite env var type declarations for philly-311.
// ABOUTME: Declares the VITE_SSO_*, VITE_API_*, VITE_AIS_* names.
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SSO_CLIENT_ID: string
  readonly VITE_SSO_TENANT: string
  readonly VITE_SSO_AUTHORITY_DOMAIN: string
  readonly VITE_SSO_REDIRECT_URI: string
  readonly VITE_SSO_API_SCOPE?: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_KEY: string
  readonly VITE_AIS_BASE_URL: string
  readonly VITE_AIS_AUTOCOMPLETE_BASE_URL: string
  readonly VITE_AIS_GATEKEEPER_KEY: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
