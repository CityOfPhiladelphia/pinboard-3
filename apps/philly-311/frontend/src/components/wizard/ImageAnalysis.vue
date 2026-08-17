<!-- ABOUTME: Subcomponent for IssueTypeStep component. Renders the left half of the page when image analysis is running -->
<script setup lang="ts">
import { useApi } from '@/composables/useApi'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { Icon } from '@phila/phila-ui-core'
import { IconStar } from '@phila/phila-ui-core/icons'
import { onMounted, onUnmounted } from 'vue'

interface ClassifyResponse {
  classifications: { serviceType: string; confidence: number; caseType: string }[]
  imageUrl: string
}

const store = useReportSubmissionStore()

const classifying = defineModel<boolean>('classifying')
const error = defineModel<string>('error')

// classifyBody.imgB64 is mutated before each fetchData() call; useApi reads
// opts.body lazily so the latest value is always sent.
const classifyBody = { imgB64: '' }
const classify = useApi<ClassifyResponse>({
  url: '/private/key/classify',
  method: 'POST',
  body: classifyBody,
})

const title = 'Analyzing your photo'
const subHead = `We’ll use this info to fill in what we can`

onMounted(() => {
  classifyImage()
})

onUnmounted(() => {
  classifying.value = false
})

async function classifyImage() {
  if (classifying.value) return
  if (!store.photo.previewUrl) return
  classifying.value = true
  error.value = ''
  try {
    classifyBody.imgB64 = store.photo.previewUrl
    const result = await classify.fetchData()
    if (!result || classify.error.value) {
      error.value = classify.error.value?.message || 'Classification failed.'
      if (store.photo.previewUrl) store.setPhotoPreview(undefined)
      classifying.value = false
      return
    }
    store.setPhoto(result.imageUrl)
    store.setPhotoSuggestions(
      result.classifications.map((c) => ({ serviceType: c.serviceType, confidence: c.confidence })),
    )
  } catch (err) {
    error.value = (err as Error).message || 'Photo processing failed.'
    if (store.photo.previewUrl) store.setPhotoPreview(undefined)
  } finally {
    classifying.value = false
  }
}
</script>

<template>
  <div class="image-analysis">
    <Icon class="image-analysis-icon" :icon="IconStar" />
    <label class="image-analysis-title" v-text="title" />
    <p class="image-analysis-subhead" v-text="subHead" />
    <img class="image-analysis-body" :src="store.$state.photo.previewUrl" />
  </div>
</template>

<style scoped>
.image-analysis {
  display: grid;
  grid-template-areas:
    'h-icon'
    'h-title'
    'h-subhead'
    'ia-body';
  place-items: center;
  grid-template-rows: auto auto auto 1fr;
  grid-template-columns: 1fr;
  height: 100%;
  width: 100%;
  padding: var(--spacing-xl, 2rem);
}

.image-analysis-icon {
  grid-area: h-icon;
  color: #000;

  /* Icons/Solid/Default */
  font-family: var(--Icon-Solid-Default-font-icon-solid-default-family, 'Font Awesome 7 Pro');
  font-size: var(--Icon-Solid-Default-font-icon-solid-default-size, 1.5rem);
  font-style: normal;
  font-weight: 900;
  line-height: normal;
}

.image-analysis-title {
  grid-area: h-title;
  color: #000;

  /* Label/ExtraLarge */
  font-family: var(--Label-ExtraLarge-font-label-xlarge-family, Montserrat);
  font-size: var(--Label-ExtraLarge-font-label-xlarge-size, 1.5rem);
  font-style: normal;
  font-weight: 600;
  line-height: var(--Label-ExtraLarge-font-label-xlarge-lineheight, 2.25rem); /* 150% */
}

.image-analysis-subhead {
  grid-area: h-subhead;
  color: #000;

  /* Body/Default */
  font-family: var(--Body-Default-font-body-default-family, Montserrat);
  font-size: var(--Body-Default-font-body-default-size, 1rem);
  font-style: normal;
  font-weight: 400;
  line-height: var(--Body-Default-font-body-default-lineheight, 1.5rem); /* 150% */
}

.image-analysis-body {
  display: grid;
  grid-area: ia-body;
  height: clamp(5rem, 25svh + 1rem, 15.9375rem);
  width: auto;
  border-radius: 0.75rem;

  /* Elevation/Elevation Light/2 */
  box-shadow:
    0 1px 2px 0 rgba(0, 0, 0, 0.3),
    0 2px 6px 2px rgba(0, 0, 0, 0.15);
}
</style>
