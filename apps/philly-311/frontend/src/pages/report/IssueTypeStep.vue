<!-- ABOUTME: Wizard step 2 — choose the issue type (photo recommendations + searchable
     caseType-grouped directory). View derives from store.category; Next is gated on
     a category being chosen via useWizardValidity. -->
<script setup lang="ts">
import { computed, onBeforeMount, ref, useId, watch } from 'vue'
import { useServiceTypes } from '@/composables/useServiceTypes'
import { useWizardValidity, useWizardErrors } from '@/composables/useWizardValidity'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { Search } from '@phila/phila-ui-search'
import { LoadingCards } from '@pinboard/ui'
import { Callout } from '@phila/phila-ui-callout'
import TypeSuggestions from '@/components/wizard/TypeSuggestions.vue'
import TypeDirectory from '@/components/wizard/TypeDirectory.vue'
import ImageAnalysis from '@/components/wizard/ImageAnalysis.vue'
import ReportStep from '@/components/wizard/ReportStep.vue'
import WizardLoadError from '@/components/wizard/WizardLoadError.vue'
import type { ServiceType } from '@/types/api.ts'

const issueStepId = useId()
const store = useReportSubmissionStore()
const { list, isLoading, error, load } = useServiceTypes()

const searchMatchedIssueTypes = ref<ServiceType[]>([])
const classifying = ref(false)
const errorMessage = ref('')
const selectedServiceType = ref<string>('')
const searchTerms = ref('')

const stepTitle = `Select an issue type`
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

onBeforeMount(() => {
  if (!list.value.length) {
    load()
  } else {
    searchMatchedIssueTypes.value = [...list.value]
  }
})

watch(selectedServiceType, (selectedService) => store.setCategory(selectedService))

function handleSearchChange(search: string) {
  if (!search) searchMatchedIssueTypes.value = [...list.value]
  searchTerms.value = search
}

function handleSearchSubmit() {
  const uniqueTerms = searchTerms.value
    ? new Set(searchTerms.value.toLocaleLowerCase().split(' '))
    : null
  if (!uniqueTerms) {
    searchMatchedIssueTypes.value = [...list.value]
    return
  }
  searchMatchedIssueTypes.value = [...list.value].filter((serviceType) => {
    const terms = new Set(
      [
        serviceType.serviceType.toLocaleLowerCase().split(' '),
        serviceType.caseType.toLocaleLowerCase().split(' '),
        serviceType.department.toLocaleLowerCase().split(' '),
        serviceType.description.toLocaleLowerCase().split(' '),
      ].flat(),
    )
    return terms.intersection(uniqueTerms).size
  })
}
</script>

<template>
  <ReportStep :id="issueStepId" :error-active="false" :step-title="stepTitle" :required="true">
    <template #step-content>
      <div :id="issueStepId" class="issue-step">
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

        <Search
          :placeholder="searchPlaceholder"
          class="issue-step__search"
          @update:model-value="handleSearchChange"
          @search="handleSearchSubmit"
        />
        <div class="issue-step__issue-types">
          <Callout
            v-if="showErrors && !store.category"
            :title="'Select an issue type to continue'"
            :type="'error'"
          />
          <LoadingCards v-if="classifying || (isLoading && !list.length)" :card-scale="60" />
          <WizardLoadError v-else-if="error" :error-message="error.message" />

          <template v-else>
            <TypeSuggestions
              v-if="store.photo && hasSurvivingSuggestions"
              v-model:selected="selectedServiceType"
              :suggestions="store.photoSuggestions"
              :catalog="searchMatchedIssueTypes.length ? searchMatchedIssueTypes : list"
            />
            <TypeDirectory
              v-model:selected="selectedServiceType"
              :catalog="searchMatchedIssueTypes.length ? searchMatchedIssueTypes : list"
            />
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
  row-gap: var(--spacing-m, 1rem);
  overflow: auto;
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
</style>
