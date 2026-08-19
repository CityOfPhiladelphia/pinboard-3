<!-- ABOUTME: Wizard step 2 — choose the issue type (photo recommendations + searchable
     caseType-grouped directory). View derives from store.category; Next is gated on
     a category being chosen via useWizardValidity. -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useServiceTypes } from '@/composables/useServiceTypes'
import { useWizardValidity, useWizardErrors } from '@/composables/useWizardValidity'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { Search } from '@phila/phila-ui-search'
import { LoadingCards } from '@pinboard/ui'
import { Callout } from '@phila/phila-ui-callout'
import TypeSuggestions from '@/components/wizard/TypeSuggestions.vue'
import TypeDirectory from '@/components/wizard/TypeDirectory.vue'
import ImageAnalysis from '@/components/wizard/ImageAnalysis.vue'
import ReportStep from './ReportStep.vue'
import IssueLoadError from '@/components/wizard/IssueLoadError.vue'

const store = useReportSubmissionStore()
const { list, isLoading, error, load } = useServiceTypes()

const classifying = ref(false)
const errorMessage = ref('')
const selectedServiceType = ref<string>('')

const stepTitle = `Select an issue type * (required)`
const searchPlaceholder = `Search by issue type`

const hasSurvivingSuggestions = computed(() =>
  store.photoSuggestions.some((s) => list.value.some((c) => c.serviceType === s.serviceType)),
)
const imageHeightWidthStyle = computed(() => {
  return store.photo.dimensions.height > store.photo.dimensions.width
    ? {
        height: '100%',
        width: 'auto',
      }
    : {
        height: 'auto',
        width: '100%',
      }
})

useWizardValidity(computed(() => !!store.category && !error.value))
const showErrors = useWizardErrors()

onMounted(() => {
  load()
})

watch(selectedServiceType, (selectedService) => store.setCategory(selectedService))
</script>

<template>
  <ReportStep :step-title="stepTitle">
    <template #step-content>
      <div class="issue-step">
        <template v-if="store.photo.previewUrl || store.photo.mediaUrl">
          <ImageAnalysis
            v-if="!store.photoSuggestions.length"
            v-model:classifying="classifying"
            v-model:error="errorMessage"
            class="issue-step__analysis"
          />
          <img
            v-else-if="store.photoSuggestions.length"
            :src="store.photo.previewUrl || store.photo.mediaUrl"
            class="issue-step__photo"
            :style="imageHeightWidthStyle"
          />
        </template>

        <Search :placeholder="searchPlaceholder" class="issue-step__search" />
        <div class="issue-step__issue-types">
          <Callout
            v-if="showErrors && !store.category"
            :title="'Select an issue type to continue'"
            :type="'error'"
          />
          <LoadingCards v-if="classifying || (isLoading && !list.length)" :card-scale="60" />
          <IssueLoadError v-else-if="error" />

          <template v-else>
            <TypeSuggestions
              v-if="store.photo && hasSurvivingSuggestions"
              v-model:selected="selectedServiceType"
              :suggestions="store.photoSuggestions"
              :catalog="list"
            />
            <TypeDirectory v-model:selected="selectedServiceType" :catalog="list" />
          </template>
        </div>
      </div>
    </template>
  </ReportStep>
</template>

<style scoped>
.issue-step {
  display: grid;
  height: 100%;
  width: 100%;
  grid-template-areas:
    'uploadedImage search'
    'uploadedImage issueTypes';
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
  column-gap: var(--spacing-xl, 2rem);
  row-gap: var(--spacing-s, 0.5rem);
}

.issue-step__analysis {
  grid-area: uploadedImage;
  display: grid;
  place-items: center;
}

.issue-step__photo {
  grid-area: uploadedImage;
  display: grid;
  margin: auto auto;
  border-radius: 0.75rem;

  /* Elevation/Elevation Light/2 */
  box-shadow:
    0 1px 2px 0 rgba(0, 0, 0, 0.3),
    0 2px 6px 2px rgba(0, 0, 0, 0.15);
}

.issue-step__search {
  grid-area: search;
}

.issue-step__issue-types {
  grid-area: issueTypes;
  overflow: auto;
}

.issue-step__error {
  color: var(--Schemes-On-Error-Container, #992100);
  border-radius: 0.75rem;
  background: var(--Schemes-Error-Container, #f8c9bd);

  /* Label/Default */
  font-family: var(--Label-Default-font-label-default-family, Montserrat);
  font-size: var(--Label-Default-font-label-default-size, 1rem);
  font-style: normal;
  font-weight: 600;
  line-height: var(--Label-Default-font-label-default-lineheight, 1.5rem); /* 150% */
}
</style>
