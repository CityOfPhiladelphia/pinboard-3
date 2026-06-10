<!-- ABOUTME: Wizard step 5 — submission review + confirm placeholder. -->
<script setup lang="ts">
import { inject, onMounted, type Ref } from 'vue'
import { WIZARD_CAN_ADVANCE_KEY } from '@/composables/useWizardValidity'
const canAdvance = inject<Ref<boolean>>(WIZARD_CAN_ADVANCE_KEY)
onMounted(() => {
  if (canAdvance) canAdvance.value = true
})
</script>
<template>
  <div class="wizard-step"><p>Review — coming soon.</p></div>
</template>
