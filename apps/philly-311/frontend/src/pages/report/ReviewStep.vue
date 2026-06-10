<!-- ABOUTME: Wizard step 5 — submission review + confirm placeholder. -->
<script setup lang="ts">
import { inject, onMounted, type Ref } from 'vue'
const canAdvance = inject<Ref<boolean>>('wizard:canAdvance')
onMounted(() => {
  if (canAdvance) canAdvance.value = true
})
</script>
<template>
  <div class="wizard-step"><p>Review — coming soon.</p></div>
</template>
