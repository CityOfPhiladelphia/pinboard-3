<!-- ABOUTME: Wizard step 1 — optional photo. Upload/Camera -> processForClassify -> /classify,
     which stores the image (mediaUrl) and returns issue-type suggestions for step 2. Optional;
     Skip/Next both advance. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@phila/phila-ui-core'
import { IconClose, IconArrowUp } from '@phila/phila-ui-core/icons'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useWizardValidity } from '@/composables/useWizardValidity'
import ReportStep from '@/components/wizard/ReportStep.vue'
import ImageUploadDialog from '@/components/wizard/ImageUploadDialog.vue'

const store = useReportSubmissionStore()

const uploadDialogOpen = ref(false)
const fileUploadUrl = ref<string>(store.photo.previewUrl || store.photo.mediaUrl || '')
const errorMessage = ref('')
const markupComplete = ref(!!fileUploadUrl.value)

const stepTitle = 'Image (optional)'
const stepDescription = `This app uses machine learning to pull location data from your photo and suggest the issue type
    to report. Do not upload any images with personal or sensitive information.`

const imageCount = computed(() => {
  return store.photo.previewUrl ? '1/1' : '0/1'
})

useWizardValidity(computed(() => markupComplete.value))

const imageScaleStyle = computed(() => {
  return {
    height: `${18 * store.photo.dimensions.height}rem`,
    width: `${18 * store.photo.dimensions.width}rem`,
  }
})

const imagePreviewStyle = computed(() => {
  return {
    ...imageScaleStyle.value,
    'background-image': `url(${fileUploadUrl.value})`,
    'background-repeat': 'no-repeat',
    'background-position': 'center center',
    'background-size': 'contain',
  }
})

watch(markupComplete, (nowComplete) => {
  if (nowComplete) store.setPhotoPreview(fileUploadUrl.value)
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
  store.resetPhoto()
  fileUploadUrl.value = ''
  markupComplete.value = false
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
  <ReportStep :step-title="stepTitle" :step-note="stepDescription" :required="false">
    <template #step-content>
      <div class="image__step">
        <p class="image-step__count has-text-body-default" v-text="imageCount" />
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
          <button class="image-step__preview-delete" @click="removeImage">
            <Icon :icon="IconClose" size="extra-small" class="image-step__preview-delete-icon" />
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
  />
</template>

<style scoped>
.image__step {
  display: grid;
  height: 100%;
  grid-template-areas:
    'imageCount'
    'imageUpload';
  grid-template-rows: auto 1fr;
  row-gap: var(--spacing-m, 1.5rem);
  overflow: auto;
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
  position: relative;
  border-radius: 0.75rem;

  /* Elevation/Elevation Light/2 */
  box-shadow:
    0 1px 2px 0 rgba(0, 0, 0, 0.3),
    0 2px 6px 2px rgba(0, 0, 0, 0.15);
  corner-top-right-shape: scoop;
  border-top-right-radius: 1.25em;
}

.image-step__preview-delete {
  cursor: pointer;
  position: absolute;
  top: 0;
  right: 0;
  translate: 50% -50%;
  background: transparent;
  border: none;
}

.image-step__preview-delete-icon {
  width: var(--scale-400, 2rem);
  height: var(--scale-400, 2rem);
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
</style>
