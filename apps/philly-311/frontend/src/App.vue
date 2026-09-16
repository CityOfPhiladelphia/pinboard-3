<!-- ABOUTME: Root component. Wraps every route in PinboardShell chrome inside a
     phila .content region and supplies the header's nav links and CTAs. -->
<script setup lang="ts">
import { PinboardShell } from '@pinboard/ui'
import type { NavLink } from '@phila/phila-ui-app-header'
import '@pinboard/ui/style.css'
import '@/assets/a11y.css'
import { PhilaButton } from '@phila/phila-ui-button'
import { Callout } from '@phila/phila-ui-callout'
import { ModalTarget } from '@phila/phila-ui-modal'
import { useAuth } from '@phila/sso-vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAccountProvisioning } from '@/composables/useAccountProvisioning'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import ReportIssueIcon from '@/components/ReportIssueIcon'

const route = useRoute()
const store = useReportSubmissionStore()
const { signIn, signOut, isAuthenticated, userName } = useAuth()
const {
  status: accountStatus,
  errorMessage: accountError,
  retry: retryAccountProvisioning,
} = useAccountProvisioning()

// Marks a nav link selected when its href matches the current route, exactly
// or as a path prefix (so e.g. "/answers" stays selected on "/answers/123").
// "/" is exempt from prefix matching or it would match every route.
const isSelectedHref = (href?: string) =>
  href !== undefined && (href === route.path || (href !== '/' && route.path.startsWith(`${href}/`)))

const navLinks = computed(
  () =>
    [
      {
        text: 'Report an issue',
        href: '/report',
        icon: ReportIssueIcon,
        iconSize: 'medium' as const,
      },
      { text: 'Map', href: '/' },
      { text: 'Requests', href: '/reports' },
      { text: 'Answers', href: '/answers' },
      ...(isAuthenticated.value
        ? [
            { text: userName.value ?? '' },
            { text: 'Sign out', href: '#', onClick: () => signOut() },
          ]
        : [{ text: 'Login / Sign up', href: '#', onClick: () => login() }]),
    ].map((link) => ({ ...link, selected: isSelectedHref(link.href) })) as NavLink[],
)

const feedbackHref = 'https://www.phila.gov/feedback/'

// Mirrors authGuard's redirect mechanism (router/index.ts) so login returns
// the user to where they clicked from. If that's a wizard step, the SSO
// round-trip's reload wipes the in-memory store, so its state rides along
// in the query too — wizardGuard rehydrates it, same as an external deep link.
function login() {
  const query = store.stateToUrlQueryParams()
  const path = route.fullPath.split('?')[0]
  sessionStorage.setItem('auth:redirectTo', query ? `${path}?${query}` : path)
  signIn()
}
</script>

<template>
  <PinboardShell
    title="Philly 311"
    :logo="{
      variant: 'city',
      layout: 'single-line',
      colorScheme: 'on-primary',
      customName: 'Philly311',
      href: '/',
    }"
    :links="navLinks"
    :translations="false"
    :show-header-tooltip="false"
    :feedback-href="feedbackHref"
  >
    <div class="content app-content">
      <div v-if="accountStatus === 'pending'" class="account-provisioning-gate" role="status">
        <span class="spinner" aria-hidden="true" />
        <span class="sr-only">Logging in…</span>
      </div>
      <Callout
        v-else-if="accountStatus === 'error'"
        class="account-provisioning-gate"
        type="error"
        role="alert"
        :message="`Couldn't log you in: ${accountError}`"
      >
        <PhilaButton variant="secondary" type="button" @click="retryAccountProvisioning()">
          Try again
        </PhilaButton>
      </Callout>
      <RouterView v-else />
    </div>
  </PinboardShell>
  <ModalTarget />
</template>

<style scoped>
/* Pass-through wrapper: applies phila .content typography to routed pages
   without introducing a layout box that would break the full-height map. */
.app-content {
  display: contents;
}

.account-provisioning-gate {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--spacing-m, 1rem);
  box-sizing: border-box;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--Schemes-Border-low, #e3e3e3);
  border-top-color: var(--Schemes-Primary, #002855);
  border-radius: 50%;
  animation: spinner-rotate 0.8s linear infinite;
}

@keyframes spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}

/* @phila/phila-ui-modal 0.1.4-beta.1 (pinned) shipped with several bugs
 * (no z-index, no max-height/scroll, a BaseCard container-query breaking
 * that fix on mobile, dead cancelButtonProps/cancelLabel, Cancel/Apply
 * overflow) — all fixed in phila-ui-4's fix/modal-scroll-and-overflow
 * branch, not yet published. Once published and the catalog bumped, this
 * can shrink to just what's left: tuning the package's 24px default
 * padding/gap to this dialog's 32px Figma spec, overriding Modal.vue's own
 * classes directly rather than stacking this content's own padding on top. */
:global(.phila-modal .modal-header) {
  padding: var(--spacing-xl, 2rem) var(--spacing-xl, 2rem) 0 var(--spacing-xl, 2rem);
}
:global(.phila-modal .modal-content__inner) {
  padding: 0 var(--spacing-xl, 2rem);
}
:global(.phila-modal .modal-actions) {
  padding: 0 var(--spacing-xl, 2rem) var(--spacing-xl, 2rem) var(--spacing-xl, 2rem);
  margin-top: var(--spacing-xl, 2rem);
}
/* Modal.vue's title renders with "has-text-label-3xl" (36px, growing to
 * 40px/48px-line-height on desktop) instead of the Subtitle/Subtitle-1 style
 * Figma specs for a dialog title (24px/36px). Left as a local override
 * rather than ported upstream — unlike everything above, this one's
 * arguably intentional for other dialog variants (Announcement/Event/Task/
 * Confirm all wrap the same Modal), so it needs design input first.
 * !important since the utility class sets its own. */
:global(.phila-modal .has-text-label-3xl) {
  font-size: var(--Subtitle-Subtitle-1-font-subtitle-1-size, 1.5rem) !important;
  line-height: var(--Subtitle-Subtitle-1-font-subtitle-1-lineheight, 2.25rem) !important;
}
</style>
