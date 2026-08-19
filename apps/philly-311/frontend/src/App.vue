<!-- ABOUTME: Root component. Wraps every route in PinboardShell chrome inside a
     phila .content region and supplies the header's nav links and CTAs. -->
<script setup lang="ts">
import { PinboardShell } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import '@/assets/a11y.css'
import { PhilaButton } from '@phila/phila-ui-button'
import { Callout } from '@phila/phila-ui-callout'
import { useAuth } from '@phila/sso-vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAccountProvisioning } from '@/composables/useAccountProvisioning'
import ReportDocumentIcon from '@/components/ReportDocumentIcon'

const route = useRoute()
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

const navLinks = computed(() =>
  [
    {
      text: 'Report an issue',
      href: '/report',
      icon: ReportDocumentIcon,
      iconSize: 'large' as const,
    },
    { text: 'Map', href: '/' },
    { text: 'My Requests', href: '/reports' },
    { text: 'Answers', href: '/answers' },
    ...(isAuthenticated.value
      ? [{ text: userName.value ?? '' }, { text: 'Sign out', href: '#', onClick: () => signOut() }]
      : [{ text: 'Login / Sign up', href: '#', onClick: () => login() }]),
  ].map((link) => ({ ...link, selected: isSelectedHref(link.href) })),
)

const feedbackHref = 'https://www.phila.gov/feedback/'

// Mirrors authGuard's redirect mechanism (router/index.ts) so a header-initiated
// login returns the user to where they clicked from, not '/' or a stale guard redirect.
function login() {
  sessionStorage.setItem('auth:redirectTo', route.fullPath)
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
      customName: 'Philly 311',
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
</style>
