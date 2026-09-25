// ABOUTME: Tests for VisibilityContactModal — draft seeding/reset on open(),
// ABOUTME: the public/private choice, the signed-out contact form and its
// ABOUTME: validation, sign-in redirect, and that Cancel discards the draft.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, ref, computed } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { IS_MOBILE_KEY } from '@pinboard/ui'
import VisibilityContactModal from '../VisibilityContactModal.vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

// Per-test controllable auth state (overrides the global setup mock).
const user = ref<{ name?: string } | null>(null)
const signIn = vi.fn()
const authState = {
  isAuthenticated: ref(false),
  user,
  userName: computed(() => user.value?.name ?? null),
  signIn,
}
vi.mock('@phila/sso-vue', () => ({
  useAuth: () => authState,
  createB2CPlugin: () => ({ install: () => undefined }),
}))

// Modal's own open/closed gating (via Teleport to a #phila-modal-target-*
// element created by ModalTarget) is Modal's own concern, covered by its own
// package tests — stub it here to a plain wrapper that always renders its
// default slot, so this file can exercise VisibilityContactModal's own logic
// without mounting ModalTarget or a Teleport target.
vi.mock('@phila/phila-ui-modal', () => ({
  Modal: defineComponent({
    name: 'Modal',
    props: ['id', 'title', 'dissmissible', 'cancellable', 'actionLabel'],
    emits: ['submit', 'cancel', 'close'],
    setup(props: Record<string, unknown>, { slots, emit }) {
      return () =>
        h('div', { class: 'modal-stub' }, [
          (props.title as string) ?? '',
          slots.default?.({ open: true, close: () => emit('close') }),
          h(
            'button',
            { type: 'button', class: 'modal-stub__cancel', onClick: () => emit('cancel') },
            'Cancel',
          ),
          h(
            'button',
            { type: 'button', class: 'modal-stub__submit', onClick: () => emit('submit') },
            (props.actionLabel as string) ?? 'Submit',
          ),
        ])
    },
  }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/report/review' }),
}))

// IS_MOBILE_KEY is a real Symbol here (not mocked) so the injected default in
// ResponsiveModal.vue would resolve to mobile if left unprovided — every
// mount() below provides it fixed to desktop instead, so these tests exercise
// the Modal branch (matching the .modal-stub assertions) rather than the
// BottomSheet one, same pattern ReportsPage.test.ts uses to avoid a real
// matchMedia call in jsdom.
vi.mock('@pinboard/ui', async () => {
  const actual = await vi.importActual<typeof import('@pinboard/ui')>('@pinboard/ui')
  return { IS_MOBILE_KEY: actual.IS_MOBILE_KEY }
})

function mountModal() {
  return mount(VisibilityContactModal, {
    global: { provide: { [IS_MOBILE_KEY]: ref(false) } },
  })
}

function open(w: ReturnType<typeof mount>) {
  return (w.vm as unknown as { open: () => void }).open()
}

beforeEach(() => {
  setActivePinia(createPinia())
  authState.isAuthenticated.value = false
  authState.user.value = null
  signIn.mockClear()
  sessionStorage.clear()
})

describe('VisibilityContactModal - visibility', () => {
  it('defaults to Private, matching the store default', () => {
    const w = mountModal()
    expect(w.find('[role="radio"][aria-checked="true"]').text()).toContain('Private')
  })

  it('selects Public and Apply commits it to the store', async () => {
    const w = mountModal()
    const [publicOption] = w.findAll('[role="radio"]')
    await publicOption.trigger('click')
    await w.find('.modal-stub__submit').trigger('click')
    expect(useReportSubmissionStore().publicVisibility).toBe(true)
  })
})

describe('VisibilityContactModal - contact info', () => {
  it('hides the contact section entirely when signed in', () => {
    authState.isAuthenticated.value = true
    const w = mountModal()
    expect(w.text()).not.toContain('Contact info')
  })

  it('shows the contact section, share off by default, when signed out', () => {
    const w = mountModal()
    expect(w.text()).toContain('Contact info')
    expect((w.find('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(false)
    expect(w.find('.vc-modal__signin').exists()).toBe(false)
  })

  it('reveals the sign-in row and name/phone fields once sharing is toggled on', async () => {
    const w = mountModal()
    await w.find('input[type="checkbox"]').setValue(true)
    expect(w.find('.vc-modal__signin').exists()).toBe(true)
    expect(w.findAll('input[id^="vc-modal-"]')).toHaveLength(2)
  })

  it('sign-in row stores a redirect and calls auth.signIn()', async () => {
    const store = useReportSubmissionStore()
    const w = mountModal()
    await w.find('input[type="checkbox"]').setValue(true)
    await w.find('.vc-modal__signin').trigger('click')
    expect(sessionStorage.getItem('auth:redirectTo')).toBe(
      `/report/review?${store.stateToUrlQueryParams()}`,
    )
    expect(signIn).toHaveBeenCalledTimes(1)
  })

  it('sign-in redirect carries the wizard state so it survives the SSO round-trip', async () => {
    const store = useReportSubmissionStore()
    store.setCategory('Graffiti')
    const w = mountModal()
    await w.find('input[type="checkbox"]').setValue(true)
    await w.find('.vc-modal__signin').trigger('click')
    expect(sessionStorage.getItem('auth:redirectTo')).toBe(
      `/report/review?${store.stateToUrlQueryParams()}`,
    )
  })

  it('blocks Apply with an error when sharing is on but name is blank', async () => {
    const w = mountModal()
    await w.find('input[type="checkbox"]').setValue(true)
    await w.find('.modal-stub__submit').trigger('click')
    expect(w.text()).toContain('Please enter your name.')
    expect(useReportSubmissionStore().shareContactInfo).toBe(false)
  })

  it('blocks Apply with an error when the phone number is not 10 digits', async () => {
    const w = mountModal()
    await w.find('input[type="checkbox"]').setValue(true)
    const inputs = w.findAll('input[id^="vc-modal-"]')
    await inputs[0].setValue('Jane Doe')
    await inputs[1].setValue('12345')
    await w.find('.modal-stub__submit').trigger('click')
    expect(w.text()).toContain('valid 10-digit phone number')
    expect(useReportSubmissionStore().shareContactInfo).toBe(false)
  })

  it('Apply commits shareContactInfo and contact, stripping non-digit phone characters', async () => {
    const w = mountModal()
    await w.find('input[type="checkbox"]').setValue(true)
    const inputs = w.findAll('input[id^="vc-modal-"]')
    await inputs[0].setValue('Jane Doe')
    await inputs[1].setValue('(215) 555-0100')
    await w.find('.modal-stub__submit').trigger('click')
    const store = useReportSubmissionStore()
    expect(store.shareContactInfo).toBe(true)
    expect(store.contact.name).toBe('Jane Doe')
    expect(store.contact.phone).toBe('2155550100')
  })

  it('Cancel discards draft edits — the store is untouched', async () => {
    const w = mountModal()
    const [, privateOption] = w.findAll('[role="radio"]')
    await privateOption.trigger('click')
    await w.find('input[type="checkbox"]').setValue(true)
    const inputs = w.findAll('input[id^="vc-modal-"]')
    await inputs[0].setValue('Jane Doe')
    await inputs[1].setValue('2155550100')
    await w.find('.modal-stub__cancel').trigger('click')
    const store = useReportSubmissionStore()
    expect(store.shareContactInfo).toBe(false)
    expect(store.contact.name).toBeUndefined()
  })
})

describe('VisibilityContactModal - open() reseeds from the store', () => {
  it('reflects the store’s current values each time it is opened, discarding any prior unapplied draft', async () => {
    const store = useReportSubmissionStore()
    const w = mountModal()

    // Edit without applying, then reopen — the edit should be gone.
    const [publicOption] = w.findAll('[role="radio"]')
    await publicOption.trigger('click')
    open(w)
    await flushPromises()
    expect(w.find('[role="radio"][aria-checked="true"]').text()).toContain('Private')

    // Now change the store directly and reopen — the modal should pick it up.
    store.setPrivacy(true)
    open(w)
    await flushPromises()
    expect(w.find('[role="radio"][aria-checked="true"]').text()).toContain('Public')
  })
})
