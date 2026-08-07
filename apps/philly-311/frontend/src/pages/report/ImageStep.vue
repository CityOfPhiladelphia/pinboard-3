<!-- ABOUTME: Wizard step 1 — optional photo. Upload/Camera -> processForClassify -> /classify,
     which stores the image (mediaUrl) and returns issue-type suggestions for step 2. Optional;
     Skip/Next both advance. -->
<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { processForClassify } from '@/utils/photo'
import { useApi } from '@/composables/useApi'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useWizardValidity } from '@/composables/useWizardValidity'

interface ClassifyResponse {
  classifications: { serviceType: string; confidence: number; caseType: string }[]
  imageUrl: string
}

const store = useReportSubmissionStore()
useWizardValidity(computed(() => true)) // the step is optional

const waitingImageUpload = ref(true)
const classifying = ref(false)
const errorMessage = ref('')
const imageId = useId()

// classifyBody.imgB64 is mutated before each fetchData() call; useApi reads
// opts.body lazily so the latest value is always sent.
const classifyBody = { imgB64: '' }
const classify = useApi<ClassifyResponse>({
  url: '/private/key/classify',
  method: 'POST',
  body: classifyBody,
})

async function onFile(e: Event) {
  if (classifying.value) return
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  waitingImageUpload.value = false
  classifying.value = true
  errorMessage.value = ''
  const previewUrl = URL.createObjectURL(file)
  const imgElement = document.getElementById(imageId) as HTMLImageElement
  imgElement.src = previewUrl
  try {
    classifyBody.imgB64 = await processForClassify(file)
    const result = await classify.fetchData()
    if (!result || classify.error.value) {
      errorMessage.value = classify.error.value?.message || 'Classification failed.'
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      return
    }
    store.setPhoto({ mediaUrl: result.imageUrl, previewUrl })
    store.setPhotoSuggestions(
      result.classifications.map((c) => ({ serviceType: c.serviceType, confidence: c.confidence })),
    )
  } catch (err) {
    errorMessage.value = (err as Error).message || 'Photo processing failed.'
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  } finally {
    classifying.value = false
    target.value = ''
  }
}
</script>

<template>
  <h1 class="image-step__title">Images (optional)</h1>
  <div
    class="image-step__note"
    v-text="
      `This app uses machine learning to pull location data from your photo and suggest the issue type
    to report. Do not upload any images with personal or sensitive information.`
    "
  />

  <div class="image-step__count">{{ store.photo ? '1/1' : '0/1' }}</div>
  <div class="image-step__upload-container">
    <label class="image-step__upload">
      <span v-if="waitingImageUpload" class="image-step__upload-label">Upload</span>
      <img :id="imageId" alt="Upload" style="display: none" onload="this.style.display = ''" />
      <input type="file" accept="image/*" @change="onFile" />
    </label>
  </div>

  <div role="status">
    <div v-if="classifying" class="image-step__status">Analyzing your photo…</div>
    <div v-else-if="store.photo" class="image-step__status">Photo added.</div>
    <div v-else-if="errorMessage" role="alert" class="image-step__error">{{ errorMessage }}</div>
  </div>
</template>

<style scoped>
.image-step__title {
  align-self: stretch;
  /* Heading/H5 */
  color: #374151;
  font-family: var(--Heading-H5-font-heading-5-family, Montserrat);
  font-size: var(--Heading-H5-font-heading-5-size, 1.25rem);
  font-style: normal;
  font-weight: 600;
  line-height: var(--Heading-H5-font-heading-5-lineheight, 1.75rem); /* 140% */
}

.image-step__note {
  max-width: 39rem;
  align-self: stretch;
  margin: var(--spacing-xs, 0.5rem) 0;
  color: var(--Schemes-On-Surface-Variant, #4a4a4a);
  color: #374151;

  /* Body/Default */
  font-family: var(--Body-Default-font-body-default-family, Montserrat);
  font-size: var(--Body-Default-font-body-default-size, 1rem);
  font-style: normal;
  font-weight: 400;
  line-height: var(--Body-Default-font-body-default-lineheight, 2rem); /* 150% */
}

.image-step__count {
  margin-bottom: var(--spacing-l, 2rem);
}

.image-step__upload-container {
  margin: 0 0.25rem;
  display: grid;
  height: 15rem;
  row-gap: var(--spacing-m, 1rem);
  column-gap: var(--spacing-m, 1rem);
  align-self: stretch;
  grid-template-rows: repeat(1, minmax(0, 1fr));
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.image-step__upload {
  display: flex;
  padding: var(--spacing-xs, 0.5rem);
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-2xs, 0.25rem);
  align-self: stretch;
  grid-row: 1 / span 1;
  grid-column: 1 / span 1;
  justify-self: stretch;
  border-radius: 0.75rem;
  border: var(--border-width-s, 1px) dashed var(--Schemes-Border-high, #9b9b9b);
}

.image-step__upload input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.image-step__upload:focus-within {
  outline: var(--border-width-m, 0.125rem) solid var(--Schemes-Primary, rgb(16, 52, 244));
  outline-offset: 0.125rem;
}

.image-step__error {
  color: var(--Schemes-Error, #c0392b);
}
</style>
