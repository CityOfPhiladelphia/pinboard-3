<!-- ABOUTME: Wizard step 1 — optional photo. Upload/Camera -> processForClassify -> /classify,
     which stores the image (mediaUrl) and returns issue-type suggestions for step 2. Optional;
     Skip/Next both advance. -->
<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { processForClassify } from '@/utils/photo'
import { useApi } from '@/composables/useApi'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useWizardValidity } from '@/composables/useWizardValidity'
import ReportStep from './ReportStep.vue'

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
const stepTitle = 'Image (optional)'
const stepDescription = `This app uses machine learning to pull location data from your photo and suggest the issue type
    to report. Do not upload any images with personal or sensitive information.`

const imageCount = computed(() => {
  return store.photo ? '1/1' : '0/1'
})

const statusMessage = computed(() => {
  return classifying.value
    ? 'Analyzing your photo…'
    : store.photo
      ? 'Photo added.'
      : errorMessage.value
})

function preventDefault(e: Event) {
  e.preventDefault()
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const file = validateFileType(e.dataTransfer?.files[0])
  if (file) onFile(file)
}

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  const file = validateFileType(target.files?.[0])
  if (file) onFile(file)
}

function validateFileType(maybeFile: File | undefined) {
  if (maybeFile && /image\/(?:jpe?g|png)/.test(maybeFile?.type)) {
    return maybeFile
  } else {
    errorMessage.value = `Invalid file type: ${maybeFile?.type}. Must be jpeg or png.`
    console.error(errorMessage.value)
    return undefined
  }
}

function resetImageUpload(imgElement: HTMLImageElement, previewUrl: string) {
  waitingImageUpload.value = true
  imgElement.src = ''
  URL.revokeObjectURL(previewUrl)
}

async function onFile(file: File) {
  if (classifying.value) return
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
      resetImageUpload(imgElement, previewUrl)
      return
    }
    store.setPhoto({ mediaUrl: result.imageUrl, previewUrl })
    store.setPhotoSuggestions(
      result.classifications.map((c) => ({ serviceType: c.serviceType, confidence: c.confidence })),
    )
  } catch (err) {
    errorMessage.value = (err as Error).message || 'Photo processing failed.'
    resetImageUpload(imgElement, previewUrl)
  } finally {
    classifying.value = false
  }
}
</script>

<template>
  <ReportStep :step-title="stepTitle" :step-note="stepDescription">
    <template #step-content>
      <div class="image__step">
        <div class="image-step__count" v-text="imageCount" />
        <div class="image-step__upload-container">
          <label class="image-step__upload" @dragover="preventDefault" @drop="handleDrop"
            >Upload
            <img :id="imageId" alt="" />
            <input
              v-if="waitingImageUpload"
              type="file"
              accept="image/png, image/jpeg"
              @change="handleInput"
            />
          </label>
        </div>

        <div
          :role="errorMessage ? 'alert' : 'status'"
          :class="[{ ['image-step__error']: errorMessage }, 'image-step__status']"
          v-text="statusMessage"
        />
      </div>
    </template>
  </ReportStep>
</template>

<style scoped>
.image__step {
  display: grid;
  grid-template-areas:
    'imageCount'
    'gap-image'
    'imageUpload'
    'gap-status'
    'status';
  grid-template-rows: auto var(--spacing-l, 2rem) auto var(--spacing-xs, 0.5rem) auto;
  row-gap: 0;
}

.image-step__count {
  grid-area: imageCount;
}

.image-step__upload-container {
  grid-area: imageUpload;
  display: grid;
  height: 15rem;
  row-gap: var(--spacing-m, 1rem);
  column-gap: var(--spacing-m, 1rem);
  grid-template-rows: repeat(1, minmax(0, 1fr));
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.image-step__upload {
  display: grid;
  padding: var(--spacing-xs, 0.5rem);
  place-content: center;
  gap: var(--spacing-2xs, 0.25rem);
  grid-row: 1 / span 1;
  grid-column: 1 / span 1;
  border-radius: 0.75rem;
  border: var(--border-width-s, 1px) dashed var(--Schemes-Border-high, #9b9b9b);
}

.image-step__upload input {
  display: none;
}

.image-step__upload:focus-within {
  outline: var(--border-width-m, 0.125rem) solid var(--Schemes-Primary, rgb(16, 52, 244));
  outline-offset: 0.125rem;
}

.image-step__status {
  grid-area: status;
}

.image-step__error {
  color: var(--Schemes-Error, #c0392b);
}
</style>
