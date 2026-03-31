<script setup lang='ts'>
import { AppFooter } from '@phila/phila-ui-app-footer'
import { AppHeader } from '@phila/phila-ui-app-header'
import { FunctionalComponent, h, VNode } from 'vue';
import MobileNavPanel from './MobileNavPanel.vue';

defineProps<{
  title: string
}>()

const slots = defineSlots<{
  default(): VNode[]
  'mobile-nav'(): VNode[]
}>()

const MobileNavContent: FunctionalComponent = () =>
  h(MobileNavPanel, null, { default: () => slots['mobile-nav']?.() })

</script>


<template>

  <div class="pinboard">

    <AppHeader id="pinboard-nav"
      :show-trusted-site="true"
      :mobile-nav="$slots['mobile-nav'] ? MobileNavContent : undefined"
      :links="[]"
      :navbar-brand="{
      brandingImage: { src: '', href: '/', altText: 'City of Philadelphia' },
      brandingLink: { text: title , href: '/' },
    }" />

    <main class="pinboard-main">
      <slot />
    </main>

    <AppFooter :sub-footer-only="true" />

  </div>

</template>


<style scoped>
.pinboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.pinboard-main {
  flex: 1;
  overflow: hidden;
}
</style>
