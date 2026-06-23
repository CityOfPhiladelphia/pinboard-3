<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PhilaLink } from '@phila/phila-ui-link'

defineProps<{
  feedbackHref?: string
}>()

const { t } = useI18n()
</script>

<template>
  <PhilaLink size="small" href="https://www.phila.gov/terms-of-use/">{{
    t('pinboard.footer.termsOfUse')
  }}</PhilaLink>
  <PhilaLink size="small" href="https://www.phila.gov/open-records-policy/">{{
    t('pinboard.footer.rightToKnow')
  }}</PhilaLink>
  <PhilaLink size="small" href="https://www.phila.gov/privacypolicy/">{{
    t('pinboard.footer.privacyPolicy')
  }}</PhilaLink>
  <PhilaLink size="small" href="https://www.phila.gov/accessibility-policy/">{{
    t('pinboard.footer.accessibility')
  }}</PhilaLink>
  <PhilaLink v-if="feedbackHref" size="small" :href="feedbackHref" target="_blank" rel="noopener">{{
    t('pinboard.footer.feedback')
  }}</PhilaLink>
</template>
