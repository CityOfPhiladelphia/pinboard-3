<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { PhilaLink } from '@phila/phila-ui-link'
import { faChevronLeft } from '@fortawesome/pro-solid-svg-icons'

withDefaults(
  defineProps<{
    backTo?: string
    sections: { id: string; title: string }[]
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
    <div class="inner-container">
      <div class="content-area">
        <div class="section">
          <PhilaLink
            :href="backTo"
            :text="t('pinboard.infoPage.backToMap')"
            :icon-definition="faChevronLeft"
            size="small"
            @click.prevent="router.push(backTo)"
          />
          <slot />
        </div>
      </div>
      <nav v-if="sections.length" class="info-toc" :aria-label="t('pinboard.infoPage.onThisPage')">
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

.content-area {
  padding: 1.5rem 2rem 0 2rem;
  justify-content: center;
  align-items: center;
}

.section {
  display: flex;
  width: 100%;
  max-width: 45rem;
  padding-bottom: 2rem;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
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

@media (max-width: 768px) {
  .content-area {
    padding: 1.5rem 1rem 0 1rem;
  }

  .section {
    gap: 0.75rem;
    padding-bottom: 1.5rem;
  }

  .info-toc {
    position: static;
    flex-basis: auto;
    order: -1;
  }
}
</style>
