<script setup lang="ts">
import { PinboardShell } from '@pinboard/ui'
import '@pinboard/ui/style.css'

</script>

<template>

  <PinboardShell title="Flood Monitor">

    <template #mobile-nav>
      <h4><RouterLink to="/"> Finder </RouterLink></h4>
      <h4><RouterLink to="/glossary"> Glossary </RouterLink></h4>
    </template>

    <RouterView />

  </PinboardShell>

</template>

<style>

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>