<!-- ABOUTME: Wizard step 1 — optional photo. Upload/Camera -> processForClassify -> /classify,
     which stores the image (mediaUrl) and returns issue-type suggestions for step 2. Optional;
     Skip/Next both advance. -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Icon } from '@phila/phila-ui-core'
import { IconAdd, IconArrowUp } from '@phila/phila-ui-core/icons'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useWizardValidity } from '@/composables/useWizardValidity'
import ReportStep from './ReportStep.vue'
import ImageUploadDialog from '@/components/wizard/ImageUploadDialog.vue'
import type { Dimensions } from '@/types/wizard.ts'

const store = useReportSubmissionStore()

const uploadDialogOpen = ref(false)
const fileUploadUrl = ref<string>('')
const errorMessage = ref('')
const markupComplete = ref(false)
const imageScale = ref<Dimensions>({
  height: 1,
  width: 1,
})

const stepTitle = 'Image (optional)'
const stepDescription = `This app uses machine learning to pull location data from your photo and suggest the issue type
    to report. Do not upload any images with personal or sensitive information.`

const imageCount = computed(() => {
  return store.photo.previewUrl ? '1/1' : '0/1'
})

useWizardValidity(computed(() => markupComplete.value))

const imageScaleStyle = computed(() => {
  return {
    height: `${18 * imageScale.value.height}rem`,
    width: `${18 * imageScale.value.width}rem`,
  }
})

const imagePreviewStyle = computed(() => {
  return {
    ...imageScaleStyle.value,
    'background-image': `url(${store.$state.photo.previewUrl})`,
    'background-repeat': 'no-repeat',
    'background-position': 'center center',
    'background-size': 'contain',
  }
})

watch(markupComplete, (nowComplete) => {
  if (nowComplete && !store.$state.photo.previewUrl) store.setPhotoPreview(fileUploadUrl.value)
})

onMounted(() => {
  if (store.$state.photo.previewUrl) markupComplete.value = true
})

function preventDefault(e: Event) {
  e.preventDefault()
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  fileUploadUrl.value = validateFileType(e.dataTransfer?.files[0]) ?? ''
  uploadDialogOpen.value = !!fileUploadUrl.value
}

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  fileUploadUrl.value = validateFileType(target.files?.[0]) ?? ''
  uploadDialogOpen.value = !!fileUploadUrl.value
}

function removeImage() {
  URL.revokeObjectURL(fileUploadUrl.value)
  store.setPhotoPreview(undefined)
  fileUploadUrl.value = ''
  markupComplete.value = false
  imageScale.value = {
    height: 1,
    width: 1,
  }
}

function validateFileType(maybeFile: File | undefined) {
  if (maybeFile && /image\/(?:jpe?g|png)/.test(maybeFile?.type)) {
    return URL.createObjectURL(maybeFile)
  } else {
    errorMessage.value = `Invalid file type: ${maybeFile?.type}. Must be jpeg or png.`
    console.error(errorMessage.value)
    return ''
  }
}
</script>

<template>
  <ReportStep :step-title="stepTitle" :step-note="stepDescription">
    <template #step-content>
      <div class="image__step">
        <p class="image-step__count has-text-body-default" v-text="imageCount" />
        <div />

        <label
          v-if="!markupComplete"
          class="image-step__upload"
          :style="imageScaleStyle"
          @dragover="preventDefault"
          @drop="handleDrop"
        >
          <Icon :icon="IconArrowUp" size="extra-small" style="margin: auto" />
          Upload
          <input type="file" accept="image/png, image/jpeg" @change="handleInput" />
        </label>
        <div v-else class="image-step__preview" :style="imagePreviewStyle">
          <button @click="removeImage">
            <Icon :icon="IconAdd" size="extra-small" class="image-step__preview-delete" />
          </button>
        </div>
      </div>
    </template>
  </ReportStep>
  <ImageUploadDialog
    v-if="uploadDialogOpen"
    v-model:open="uploadDialogOpen"
    v-model:complete="markupComplete"
    v-model:file="fileUploadUrl"
    v-model:scale="imageScale"
  />
</template>

<style scoped>
.image__step {
  display: grid;
  grid-template-areas:
    'imageCount'
    'gap-image'
    'imageUpload';
  grid-template-rows: auto var(--spacing-m, 1.5rem) 1fr;
}

.image-step__count {
  grid-area: imageCount;
  margin-bottom: 0 !important;
}

.image-step__upload {
  grid-area: imageUpload;
  display: grid;
  padding: var(--spacing-xs, 0.5rem);
  place-content: center;
  border-radius: 0.75rem;
  border: var(--border-width-s, 1px) dashed var(--Schemes-Border-high, #9b9b9b);
}

.image-step__preview {
  grid-area: imageUpload;
  anchor-name: --preview;
  corner-top-right-shape: scoop;
  border-top-right-radius: 1.25em;
}

.image-step__preview-delete {
  cursor: pointer;
  position: absolute;
  position-anchor: --preview;
  position-area: top right;
  translate: -50% 50%;
  transform: rotate(45deg);
  width: var(--scale-400, 2rem);
  height: var(--scale-400, 2rem);
  display: grid;
  place-items: center;
  border-radius: var(--border-radius-full, 624.9375rem);
  background: var(--Schemes-Error, #cc3000);
  color: var(--Schemes-On-Error, #fff);
  text-align: center;
  /* Elevation/Elevation Light/1 */
  box-shadow: var(
    --elevation-light-1,
    0 1px 2px 0 rgba(0, 0, 0, 0.3),
    0 1px 3px 1px rgba(0, 0, 0, 0.15)
  );
}

.image-step__upload input {
  height: 0;
  width: 0;
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
