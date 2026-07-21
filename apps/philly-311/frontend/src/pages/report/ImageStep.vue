<!-- ABOUTME: Wizard step 1 — optional photo. Upload/Camera -> processForClassify -> /classify,
     which stores the image (mediaUrl) and returns issue-type suggestions for step 2. Optional;
     Skip/Next both advance. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
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

const classifying = ref(false)
const errorMessage = ref('')

// classifyBody.imgB64 is mutated before each fetchData() call; useApi reads
// opts.body lazily so the latest value is always sent.
const classifyBody = { imgB64: '' }
const classify = useApi<ClassifyResponse>({
  url: '/private/key/classify',
  method: 'POST',
  body: classifyBody,
})

// createObjectURL produces a short-lived preview URL; the browser holds
// the underlying blob alive until revokeObjectURL is called or page unloads.
function makePreview(file: File): string | undefined {
  return typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : undefined
}

async function onFile(e: Event) {
  if (classifying.value) return
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  classifying.value = true
  errorMessage.value = ''
  const previewUrl = makePreview(file)
  try {
    classifyBody.imgB64 = await processForClassify(file)
    const result = await classify.fetchData()
    if (!result || classify.error.value) {
      errorMessage.value = classify.error.value?.message || 'Classification failed.'
      if (previewUrl) URL.revokeObjectURL?.(previewUrl)
      return
    }
    store.setPhoto({ mediaUrl: result.imageUrl, previewUrl })
    store.setPhotoSuggestions(
      result.classifications.map((c) => ({ serviceType: c.serviceType, confidence: c.confidence })),
    )
  } catch (err) {
    errorMessage.value = (err as Error).message || 'Photo processing failed.'
    if (previewUrl) URL.revokeObjectURL?.(previewUrl)
  } finally {
    classifying.value = false
    ;(e.target as HTMLInputElement).value = ''
  }
}
</script>

<template>
  <div class="image-step">
    <h1 class="image-step__title">Images (optional)</h1>
    <p class="image-step__note">
      This app uses machine learning to pull location data from your photo and suggest the issue
      type to report. Do not upload any images with personal or sensitive information.
    </p>
    <p class="image-step__count">{{ store.photo ? '1/1' : '0/1' }}</p>

    <div class="image-step__zones">
      <label class="image-step__zone">
        <span class="image-step__zone-label">Upload</span>
        <input type="file" accept="image/*" :disabled="classifying" @change="onFile" />
      </label>
      <label class="image-step__zone">
        <span class="image-step__zone-label">Camera</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          :disabled="classifying"
          @change="onFile"
        />
      </label>
    </div>

    <div role="status">
      <p v-if="classifying" class="image-step__status">Analyzing your photo…</p>
      <p v-if="store.photo" class="image-step__status">Photo added.</p>
    </div>
    <p v-if="errorMessage" role="alert" class="image-step__error">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.image-step {
  max-width: 640px;
}
.image-step__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-s, 0.5rem);
}
.image-step__note {
  color: var(--ui-color-grey-700, #4a4a4a);
  margin: 0 0 var(--spacing-s, 0.5rem);
}
.image-step__count {
  margin: 0 0 var(--spacing-s, 0.5rem);
}
.image-step__zones {
  display: flex;
  gap: var(--spacing-m, 1rem);
}
.image-step__zone {
  flex: 1;
  min-height: 180px;
  border: 1px dashed var(--ui-color-grey-400, #b3b3b3);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.image-step__zone input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.image-step__zone:focus-within {
  outline: 2px solid var(--ui-color-primary, #0f4d90);
  outline-offset: 2px;
}
.image-step__error {
  color: var(--ui-color-red, #c0392b);
}
</style>
