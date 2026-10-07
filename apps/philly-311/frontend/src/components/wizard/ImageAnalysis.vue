<!-- ABOUTME: Subcomponent for IssueTypeStep component. Renders the left half of the page when image analysis is running -->
<script setup lang="ts">
import { useApi } from '@/composables/useApi'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import type { Service } from '@/types/app'
import { PinboardUtilities, type PinboardTypes } from '@pinboard/ui'
import { computed, onMounted, onUnmounted, useTemplateRef } from 'vue'

interface ClassifyResponse {
  classifications: { serviceType: Service; confidence: number; caseType: string }[]
  imageUrl: string
}

const store = useReportSubmissionStore()

const classifying = defineModel<boolean>('classifying')
const error = defineModel<string>('error', { default: '' })
const imageContainerRef = useTemplateRef('imageContainerRef')

const imageContainerDim = computed(() => {
  const dimensions: PinboardTypes.Dimensions = imageContainerRef.value
    ? PinboardUtilities.resizeContainerToImageAspectRatio(store.photo.dimensions, imageContainerRef)
    : {
        height: 100,
        width: 100,
      }
  return dimensions
})

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
    <span class="image-analysis-spinner" role="status" aria-label="Analyzing your photo" />
    <label class="image-analysis-title" v-text="title" />
    <span class="image-analysis-subhead" v-text="subHead" />
    <div ref="imageContainerRef" class="image-analysis-image-container">
      <img
        v-if="imageContainerRef"
        :src="store.photo.previewUrl || store.photo.mediaUrl"
        alt="Image analysis preview image"
        class="image-analysis-image"
        :height="imageContainerDim.height"
        :width="imageContainerDim.width"
      />
    </div>
  </div>
</template>

<style scoped>
.image-analysis {
  display: grid;
  grid-template-areas:
    'ia-icon'
    'ia-title'
    'ia-subhead'
    'ia-body';
  place-items: center;
  grid-template-rows: auto auto auto 1fr;
  grid-template-columns: 1fr;
  height: 100%;
  width: 100%;
  padding: var(--spacing-2xl, 2.5rem);
}

.image-analysis-spinner {
  grid-area: ia-icon;
  width: 2rem;
  height: 2rem;
  margin-bottom: var(--spacing-xs, 0.5rem);
  border: 3px solid var(--Schemes-Border-low, #e3e3e3);
  border-top-color: var(--Schemes-Primary, #002855);
  border-radius: 50%;
  animation: image-analysis-spin 0.8s linear infinite;
}

@keyframes image-analysis-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .image-analysis-spinner {
    animation-duration: 2.4s;
  }
}

.image-analysis-title {
  grid-area: ia-title;
  color: #000;

  /* Label/ExtraLarge */
  font-family: var(--Label-ExtraLarge-font-label-xlarge-family, Montserrat);
  font-size: var(--Label-ExtraLarge-font-label-xlarge-size, 1.5rem);
  font-style: normal;
  font-weight: 600;
  line-height: var(--Label-ExtraLarge-font-label-xlarge-lineheight, 2.25rem); /* 150% */
}

.image-analysis-subhead {
  grid-area: ia-subhead;
  color: #000;

  /* Body/Default */
  font-family: var(--Body-Default-font-body-default-family, Montserrat);
  font-size: var(--Body-Default-font-body-default-size, 1rem);
  font-style: normal;
  font-weight: 400;
  line-height: var(--Body-Default-font-body-default-lineheight, 1.5rem); /* 150% */
  margin-bottom: var(--spacing-m, 1rem);
}

.image-analysis-image-container {
  grid-area: ia-body;
  display: grid;
  height: 100%;
  width: 100%;
  place-content: center;
}

.image-analysis-image {
  border-radius: 0.75rem;
  /* Elevation/Elevation Light/2 */
  box-shadow:
    0 1px 2px 0 rgba(0, 0, 0, 0.3),
    0 2px 6px 2px rgba(0, 0, 0, 0.15);
}
</style>
