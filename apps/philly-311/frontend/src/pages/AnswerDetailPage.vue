<!-- ABOUTME: Placeholder for an in-app knowledge-article page; the real article render
     (loadArticle + sanitized body) ports in a later Answers slice. -->
<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
const id = route.params.id as string
</script>
<template>
  <section class="answer-page">
    <h1>Answer</h1>
    <p>This answer is coming soon. (id: {{ id }})</p>
    <RouterLink to="/">Back to the map</RouterLink>
  </section>
</template>
<style scoped>
.answer-page {
  padding: var(--spacing-l, 2rem);
}
</style>
