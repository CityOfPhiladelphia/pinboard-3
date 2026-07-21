<!-- ABOUTME: Optional contact fields, stored in the wizard (not included in the submit payload).
     If signed in, name/email prefill from the token once; user edits are never clobbered. -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuth } from '@phila/sso-vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

const store = useReportSubmissionStore()
const { user, userName, isAuthenticated } = useAuth()

const name = ref(store.contact.name ?? '')
const email = ref(store.contact.email ?? '')
const phone = ref(store.contact.phone ?? '')
let prefilled = false

function prefillFromAuth() {
  if (prefilled) return
  if (!isAuthenticated.value) return
  if (!name.value && userName.value) name.value = userName.value
  if (!email.value && user.value?.username) email.value = user.value.username
  prefilled = true
}

watch(isAuthenticated, prefillFromAuth, { immediate: true })

watch([name, email, phone], () => {
  store.setContact({ name: name.value, email: email.value, phone: phone.value })
})
</script>

<template>
  <fieldset class="contact-info">
    <legend class="contact-info__legend">Contact info (optional)</legend>
    <p class="contact-info__note">If we have questions, we'll get in touch using these.</p>
    <label class="contact-info__field">
      Name
      <input v-model="name" type="text" autocomplete="name" />
    </label>
    <label class="contact-info__field">
      Email
      <input v-model="email" type="email" autocomplete="email" />
    </label>
    <label class="contact-info__field">
      Phone
      <input v-model="phone" type="tel" autocomplete="tel" />
    </label>
  </fieldset>
</template>

<style scoped>
.contact-info {
  border: 1px solid var(--ui-color-grey-200, #e3e3e3);
  border-radius: 8px;
  padding: var(--spacing-m, 1rem);
  margin: 0;
}
.contact-info__legend {
  font-weight: 700;
  padding: 0 4px;
}
.contact-info__note {
  margin: 0 0 var(--spacing-s, 0.75rem);
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
.contact-info__field {
  display: block;
  font-weight: 600;
  margin-bottom: var(--spacing-s, 0.75rem);
}
.contact-info__field input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin-top: 4px;
  padding: 8px 12px;
  border: 1px solid var(--ui-color-grey-400, #a1a1a1);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 400;
}
</style>
