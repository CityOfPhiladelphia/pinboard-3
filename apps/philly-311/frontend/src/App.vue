<!-- ABOUTME: Root component. Wraps every route in PinboardShell chrome inside a
     phila .content region and supplies the header's nav links and CTAs. -->
<script setup lang="ts">
import { PinboardShell } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import '@/assets/a11y.css'
import { PhilaButton } from '@phila/phila-ui-button'
import { useAuth } from '@phila/sso-vue'

const { signIn } = useAuth()

const navLinks = [
  { text: 'Map', href: '/' },
  { text: 'Reports', href: '/reports' },
  { text: 'Answers', href: '/answers' },
]
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
  >
    <template #navbar-end>
      <PhilaButton variant="primary" to="/report">Report an issue</PhilaButton>
      <button type="button" class="navbar-login" @click="signIn()">Login / Sign up</button>
    </template>
    <template #sub-footer>
      <a class="sub-footer-link" href="https://www.phila.gov/terms-of-use/">Terms of use</a>
      <a class="sub-footer-link" href="https://www.phila.gov/open-records-policy/">Right to know</a>
      <a class="sub-footer-link" href="https://www.phila.gov/privacypolicy/">Privacy Policy</a>
      <a class="sub-footer-link" href="https://www.phila.gov/accessibility-policy/"
        >Accessibility</a
      >
      <a class="sub-footer-link" href="https://www.phila.gov/feedback/">Feedback</a>
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

.sub-footer-link {
  font-weight: 400;
}

.navbar-login {
  background: none;
  border: none;
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  padding: 0 var(--spacing-s, 0.75rem);
}
.navbar-login:hover {
  text-decoration: underline;
}
</style>
