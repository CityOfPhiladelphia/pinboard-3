<!-- ABOUTME: Root component. Wraps every route in PinboardShell chrome inside a
     phila .content region and supplies the header's nav links and CTAs. -->
<script setup lang="ts">
import { PinboardShell, PhilaLink } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import '@/assets/a11y.css'
import { PhilaButton } from '@phila/phila-ui-button'
import { useAuth } from '@phila/sso-vue'
import { useRoute } from 'vue-router'
import type { NavLink } from '@pinboard/ui'

const route = useRoute()
const { signIn, signOut, isAuthenticated, userName } = useAuth()

const navLinks: NavLink[] = [
  { text: 'Map', href: '/' },
  { text: 'My Requests', href: '/reports' },
  { text: 'Answers', href: '/answers' },
]

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
    <template #navbar-left-end>
      <PhilaButton variant="primary" to="/report" class="navbar-cta">Report an issue</PhilaButton>
    </template>
    <template #navbar-end>
      <template v-if="isAuthenticated">
        <span class="navbar-user has-text-label-default">{{ userName }}</span>
        <PhilaLink href="#" variant="on-primary" @click.prevent="signOut()"> Sign out </PhilaLink>
      </template>
      <PhilaLink v-else href="#" variant="on-primary" @click.prevent="login()">
        Login / Sign up
      </PhilaLink>
    </template>
    <div class="content app-content">
      <RouterView />
    </div>
  </PinboardShell>
</template>

<style scoped>
/* Pass-through wrapper: applies phila .content typography to routed pages
   without introducing a layout box that would break the full-height map. */
.app-content {
  display: contents;
}

.navbar-cta {
  align-self: center;
}

.navbar-user {
  color: var(--Schemes-On-Inverse-Surface-Bright, #fff);
  padding-right: var(--spacing-3xl);
}
</style>
