// ABOUTME: Global vitest setup. Stubs env vars + mocks the @phila/phila-ui-*
// ABOUTME: packages so component tests can mount our wrappers without loading
// ABOUTME: their CSS or relying on the dev .env file at test time.
import { vi } from 'vitest'
import { defineComponent, h, ref, computed } from 'vue'

// ResizeObserver is not implemented in jsdom; stub it so components that observe
// DOM elements don't throw in tests.
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test')
vi.stubEnv('VITE_API_KEY', 'test-api-key')
vi.stubEnv('VITE_SSO_CLIENT_ID', 'test-client')
vi.stubEnv('VITE_SSO_TENANT', 'test')
vi.stubEnv('VITE_SSO_AUTHORITY_DOMAIN', 'test.b2clogin.com')
vi.stubEnv('VITE_SSO_REDIRECT_URI', 'http://localhost/auth/redirect')
vi.stubEnv('VITE_AIS_BASE_URL', 'https://ais.example.test')
vi.stubEnv('VITE_AIS_AUTOCOMPLETE_BASE_URL', 'https://ais-ac.example.test')
vi.stubEnv('VITE_AIS_GATEKEEPER_KEY', 'test-gatekeeper')

const stub = (name: string, tag = 'div') =>
  defineComponent({
    name,
    setup(_, { slots }) {
      return () => h(tag, {}, slots.default?.())
    },
  })

// Stub variant that declares props and renders label-like props as text so
// tests can both `findComponent().props('label')` and `wrapper.text()` work.
const formStub = (name: string, propNames: string[], labelKey = 'label') =>
  defineComponent({
    name,
    props: propNames,
    setup(props: Record<string, unknown>, { slots }) {
      return () => h('div', {}, [(props[labelKey] as string) ?? '', slots.default?.()])
    },
  })

vi.mock('@phila/phila-ui-map-core', () => ({
  Map: stub('Map', 'div'),
  MapMarker: stub('MapMarker', 'div'),
  RasterLayer: stub('RasterLayer', 'div'),
}))

vi.mock('@phila/phila-ui-tags', () => ({
  Tags: stub('Tags', 'span'),
}))

vi.mock('@phila/phila-ui-button', () => ({
  CloseButton: stub('CloseButton', 'button'),
  // Mirrors the real PhilaButton's two render modes: link (`to`) vs event button.
  PhilaButton: defineComponent({
    name: 'PhilaButton',
    props: { to: { type: [String, Object], default: undefined } },
    setup(props, { slots }) {
      return () =>
        props.to !== undefined
          ? h('a', { href: props.to }, slots.default?.())
          : h('button', {}, slots.default?.())
    },
  }),
}))

vi.mock('@phila/phila-ui-app-header', () => ({
  AppHeader: stub('AppHeader', 'nav'),
}))

vi.mock('@phila/phila-ui-app-footer', () => ({
  AppFooter: stub('AppFooter', 'footer'),
}))

const TEXT_FIELD_PROPS = [
  'label',
  'modelValue',
  'error',
  'placeholder',
  'id',
  'leadingIcon',
  'trailingIcon',
  'supportingText',
  'imaskProps',
  'className',
]
const GROUP_PROPS = [
  'groupLabel',
  'description',
  'choices',
  'modelValue',
  'error',
  'errorMessage',
  'disabled',
]

vi.mock('@phila/phila-ui-text-field', () => ({
  TextField: formStub('TextField', TEXT_FIELD_PROPS, 'label'),
}))
vi.mock('@phila/phila-ui-textarea', () => ({
  Textarea: formStub('Textarea', TEXT_FIELD_PROPS, 'label'),
}))
vi.mock('@phila/phila-ui-select-field', () => ({
  SelectField: formStub('SelectField', TEXT_FIELD_PROPS, 'label'),
}))
vi.mock('@phila/phila-ui-radio', () => ({
  RadioGroup: formStub('RadioGroup', GROUP_PROPS, 'groupLabel'),
}))
vi.mock('@phila/phila-ui-checkbox', () => ({
  CheckboxGroup: formStub('CheckboxGroup', GROUP_PROPS, 'groupLabel'),
  Checkbox: formStub('Checkbox', ['text', 'value', 'modelValue', 'disabled', 'error'], 'text'),
}))
vi.mock('@phila/phila-ui-switch', () => ({
  Switch: formStub(
    'Switch',
    ['id', 'name', 'modelValue', 'value', 'offValue', 'disabled', 'ariaLabel', 'autofocus'],
    'ariaLabel',
  ),
}))
vi.mock('@phila/phila-ui-date-field', () => ({
  DateField: formStub(
    'DateField',
    [...TEXT_FIELD_PROPS, 'format', 'datePicker', 'datePickerOptions', 'min', 'max'],
    'label',
  ),
}))

// Fallback mock for @phila/sso-vue. Tests that need to control auth state
// declare their own vi.mock('@phila/sso-vue', ...) which overrides this one.
// This fallback prevents tests that incidentally mount components using useAuth
// (e.g. routes.test.ts mounting App which renders HeaderActions) from throwing.
// authReady is false so AuthRedirectPage stays on its holding message in routes.test.ts.
vi.mock('@phila/sso-vue', () => {
  const isAuthenticated = ref(false)
  const authReady = ref(false)
  const user = ref<{ name?: string; username?: string } | null>(null)
  const userName = computed(() => user.value?.name ?? null)
  return {
    useAuth: () => ({
      isAuthenticated,
      authReady,
      user,
      userName,
      signIn: vi.fn(),
      signOut: vi.fn(),
      forgotPassword: vi.fn(),
      acquireToken: vi.fn(async () => null),
    }),
    createB2CPlugin: () => ({ install: () => undefined }),
  }
})
