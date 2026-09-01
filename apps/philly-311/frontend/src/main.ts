// ABOUTME: App entry point: install Pinia, sso-vue plugin, Router, then mount.
import '@phila/phila-ui-core/styles/template-light.css'
import '@phila/phila-ui-map-core/dist/assets/phila-ui-map-core.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { createSSOPlugin } from '@phila/sso-vue'
import { B2CProvider } from '@phila/sso-core'
import { createPinboard, pinboardMessages } from '@pinboard/ui'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
// ponytail: English-only for now; per-locale app messages when philly-311 localizes
app.use(
  createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: pinboardMessages }),
)
// createSSOPlugin + B2CProvider instead of createB2CPlugin: the shorthand can't
// pass apiScopes, and without a scope sso-core's post-login acquireToken gets an
// empty token, treats it as interaction-required, and redirect-loops through B2C.
app.use(
  createSSOPlugin({
    clientConfig: {
      provider: new B2CProvider({
        clientId: import.meta.env.VITE_311_SSO_CLIENT_ID,
        b2cEnvironment: import.meta.env.VITE_311_SSO_TENANT,
        authorityDomain: import.meta.env.VITE_311_SSO_AUTHORITY_DOMAIN,
        redirectUri: import.meta.env.VITE_311_SSO_REDIRECT_URI,
        apiScopes: import.meta.env.VITE_311_SSO_API_SCOPE
          ? [import.meta.env.VITE_311_SSO_API_SCOPE]
          : [],
        policies: {
          signUpSignIn: 'B2C_1A_SIGNUP_SIGNIN',
          signInOnly: 'B2C_1A_AD_SIGNIN_ONLY',
          resetPassword: 'B2C_1A_PASSWORDRESET',
        },
      }),
      debug: Boolean(import.meta.env.DEV),
    },
  }),
)
app.use(router)
app.provide('router', router)
app.use(
  createPinboard({
    title: 'Philly 311',
    map: {
      center: [-75.1652, 39.9526],
      zoom: 11,
      minZoom: 10.5,
      mobile: { zoom: 9.5 },
    },
  }),
)
app.mount('#app')
