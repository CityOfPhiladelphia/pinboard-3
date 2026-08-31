// ABOUTME: Vite env var type declarations for philly-311.
// ABOUTME: Declares the VITE_SSO_311_*, VITE_API_*, VITE_AIS_* names.
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_311_SSO_CLIENT_ID: string
  readonly VITE_311_SSO_TENANT: string
  readonly VITE_311_SSO_AUTHORITY_DOMAIN: string
  readonly VITE_311_SSO_REDIRECT_URI: string
  readonly VITE_311_SSO_API_SCOPE: string
  readonly VITE_311_API_URL: string
  readonly VITE_311_API_PROXY: string
  readonly VITE_311_AIS_BASE_URL: string
  readonly VITE_311_AIS_GATEKEEPER_KEY: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
