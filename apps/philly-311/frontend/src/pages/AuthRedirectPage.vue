<!-- ABOUTME: Landing page for the B2C redirect flow. Shows a holding message while
     authReady flips to true, then routes back to the page the user came from. -->
<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@phila/sso-vue'

const router = useRouter()
const { authReady } = useAuth()

// The route guard stores the intended destination in sessionStorage before
// triggering the B2C redirect so we can return the user here after sign-in.
const redirectTo = sessionStorage.getItem('auth:redirectTo') ?? '/'

watch(
  authReady,
  (ready) => {
    if (ready) {
      sessionStorage.removeItem('auth:redirectTo')
      router.replace(redirectTo)
    }
  },
  { immediate: true },
)
</script>

<template>
  <main>
    <p>Signing you in&hellip;</p>
  </main>
</template>
