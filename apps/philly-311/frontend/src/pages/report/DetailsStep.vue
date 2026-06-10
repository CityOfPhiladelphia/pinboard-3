<!-- ABOUTME: Wizard step 4 — issue details + custom fields placeholder. -->
<script setup lang="ts">
import { inject, onMounted, type Ref } from 'vue'
import { WIZARD_CAN_ADVANCE_KEY } from '@/composables/useWizardValidity'
const canAdvance = inject<Ref<boolean>>(WIZARD_CAN_ADVANCE_KEY)
onMounted(() => {
  if (canAdvance) canAdvance.value = true
})
</script>
<template>
  <div class="wizard-step"><p>Details — coming soon.</p></div>
</template>
