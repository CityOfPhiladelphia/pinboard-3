<script setup lang="ts">
import { Pinboard } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <Pinboard title="OEM Flood Finder">
    <template #mobile-nav>
      <h4><RouterLink to="/">Home</RouterLink></h4>
      <h4><RouterLink to="/finder">Finder</RouterLink></h4>
    </template>
    <RouterView />
  </Pinboard>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
