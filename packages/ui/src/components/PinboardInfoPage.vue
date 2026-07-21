<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { PhilaLink } from '@phila/phila-ui-link'
import { IconChevronLeft } from '@phila/phila-ui-core/icons'

withDefaults(
  defineProps<{
    backTo?: string
    sections: { id: string; title: string }[]
    isMobile: boolean
  }>(),
  { backTo: '/' }
)

const { t } = useI18n()
const router = useRouter()

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="pinboard-info-page layout content">
    <div class="inner-container" :class="{ mobile: isMobile }">
      <div class="content-area" :class="{ mobile: isMobile }">
        <div class="section" :class="{ mobile: isMobile }">
          <PhilaLink
            :href="backTo"
            :text="t('pinboard.infoPage.backToMap')"
            :icon="IconChevronLeft"
            size="small"
            @click.prevent="router.push(backTo)"
          />
          <slot />
        </div>
      </div>
      <nav
        v-if="sections.length"
        class="info-toc"
        :class="{ mobile: isMobile }"
        :aria-label="t('pinboard.infoPage.onThisPage')"
      >
        <h2 class="has-text-heading-6">{{ t('pinboard.infoPage.onThisPage') }}</h2>
        <ul>
          <li v-for="s in sections" :key="s.id">
            <a :href="`#${s.id}`" @click.prevent="scrollToSection(s.id)">{{ s.title }}</a>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 2rem;
  height: 100%;
  overflow-y: auto;
}

.inner-container {
  display: flex;
  max-width: 80rem;
  gap: 2rem;
  align-self: stretch;
}

.inner-container.mobile {
  /* Fill the viewport and allow the flex chain to shrink, so the content wraps
     to the phone width instead of resolving to the 45rem max and overflowing. */
  width: 100%;
  min-width: 0;
}

.content-area {
  padding: 1.5rem 2rem 0 2rem;
  justify-content: center;
  align-items: center;
}

.content-area.mobile {
  flex: 1;
  min-width: 0;
  padding: 1.5rem 1rem 0 1rem;
}

.section {
  display: flex;
  width: 100%;
  max-width: 45rem;
  padding-bottom: 2rem;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  /* Break long unbreakable tokens (e.g. URLs) so they wrap instead of forcing
     the column wider than the viewport on narrow screens. */
  overflow-wrap: anywhere;
}

.section.mobile {
  gap: 0.75rem;
  padding-bottom: 1.5rem;
  max-width: 100%;
}

/* Links are injected via v-html (no scope attribute) and may inherit a global
   `a` rule that resets wrapping — force long URLs to break with a winning
   selector so they can't push the column past the viewport. */
.section :deep(a) {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.subsection-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-xs, 0.5rem);
  align-self: stretch;
}

.info-toc {
  flex: 0 0 14rem;
  position: sticky;
  top: 1.5rem;
  align-self: flex-start;
  padding: 1.5rem 0;
}

.info-toc {
  /* Hide the on-this-page table of contents on mobile so the /info content
     fits on a phone (the sticky desktop TOC doesn't translate to small screens). */
  display: none;
}

.info-toc ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.5rem);
}

/* Zero the phila-ui typography margins on the TOC heading/items so the ul gap above is the
   only spacing (the element-level margins otherwise stack on it and spread the links apart). */
.info-toc h2 {
  margin: 0 0 0.5rem;
}

.info-toc li,
.info-toc a {
  margin: 0;
}
</style>
