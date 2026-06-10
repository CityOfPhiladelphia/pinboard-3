<!-- ABOUTME: Wizard step 2 — issue type + conditional questions placeholder. -->
<script setup lang="ts">
import { inject, onMounted, type Ref } from 'vue'
const canAdvance = inject<Ref<boolean>>('wizard:canAdvance')
onMounted(() => {
  if (canAdvance) canAdvance.value = true
})
</script>
<template>
  <div class="wizard-step"><p>Issue type — coming soon.</p></div>
</template>
