<!-- ABOUTME: Wizard step 1 — optional photo upload placeholder. -->
<script setup lang="ts">
import { inject, onMounted, type Ref } from 'vue'
const canAdvance = inject<Ref<boolean>>('wizard:canAdvance')
onMounted(() => {
  if (canAdvance) canAdvance.value = true
})
</script>
<template>
  <div class="wizard-step"><p>Image step — coming soon.</p></div>
</template>
