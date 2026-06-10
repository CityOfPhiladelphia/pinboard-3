<!-- ABOUTME: Wizard step 3 — location picker placeholder. -->
<script setup lang="ts">
import { inject, onMounted, type Ref } from 'vue'
import { WIZARD_CAN_ADVANCE_KEY } from '@/composables/useWizardValidity'
const canAdvance = inject<Ref<boolean>>(WIZARD_CAN_ADVANCE_KEY)
onMounted(() => {
  if (canAdvance) canAdvance.value = true
})
</script>
<template>
  <div class="wizard-step"><p>Location — coming soon.</p></div>
</template>
