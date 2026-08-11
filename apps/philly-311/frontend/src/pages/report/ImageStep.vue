<!-- ABOUTME: Wizard step 1 — optional photo. Upload/Camera -> processForClassify -> /classify,
     which stores the image (mediaUrl) and returns issue-type suggestions for step 2. Optional;
     Skip/Next both advance. -->
<script setup lang="ts">
import { computed, ref, useId } from 'vue'

import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useWizardValidity } from '@/composables/useWizardValidity'
import ReportStep from './ReportStep.vue'
import ImageUploadDialog from '@/components/wizard/ImageUploadDialog.vue'

const store = useReportSubmissionStore()
useWizardValidity(computed(() => true)) // the step is optional

const imageId = useId()
const uploadDialogOpen = ref(false)
const fileUpload = ref<File | undefined>(undefined)
const errorMessage = ref('')
const classifying = ref(false)

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
  fileUpload.value = validateFileType(e.dataTransfer?.files[0])
  uploadDialogOpen.value = !!fileUpload.value
}

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  fileUpload.value = validateFileType(target.files?.[0])
  uploadDialogOpen.value = !!fileUpload.value
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
</script>

<template>
  <ReportStep :step-title="stepTitle" :step-note="stepDescription">
    <template #step-content>
      <div class="image__step">
        <p class="image-step__count has-text-body-default" v-text="imageCount" />
        <div />
        <div class="image-step__upload-container">
          <label class="image-step__upload" @dragover="preventDefault" @drop="handleDrop"
            >Upload
            <img :id="imageId" alt="" />
            <input type="file" accept="image/png, image/jpeg" @change="handleInput" />
          </label>
        </div>
        <p
          :role="errorMessage ? 'alert' : 'status'"
          :class="[{ ['image-step__error']: errorMessage }, 'image-step__status']"
          v-text="statusMessage"
        />
      </div>
    </template>
  </ReportStep>
  <ImageUploadDialog v-model:open="uploadDialogOpen" v-model:file="fileUpload" />
</template>

<style scoped>
.image__step {
  display: grid;
  grid-template-areas:
    'imageCount'
    'gap-image'
    'imageUpload'
    'status';
  grid-template-rows: auto var(--spacing-xs, 0.5rem) auto auto;
  row-gap: var(--spacing-xs, 0.5rem);
}

.image-step__count {
  grid-area: imageCount;
  margin-bottom: 0 !important;
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
  margin-bottom: 0 !important;
}

.image-step__error {
  color: var(--Schemes-Error, #c0392b);
}
</style>
