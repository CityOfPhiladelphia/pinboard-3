<!-- ABOUTME: Wizard step 2 — choose the issue type (photo recommendations + searchable
     caseType-grouped directory). View derives from store.category; Next is gated on
     a category being chosen via useWizardValidity. -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useServiceTypes } from '@/composables/useServiceTypes'
import { useWizardValidity, useWizardErrors } from '@/composables/useWizardValidity'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { PhilaButton } from '@phila/phila-ui-button'
import { Search } from '@phila/phila-ui-search'
import ServiceTypeIcon from '@/components/ServiceTypeIcon.vue'
import TypeSuggestions from '@/components/wizard/TypeSuggestions.vue'
import TypeDirectory from '@/components/wizard/TypeDirectory.vue'
import ImageAnalysis from '@/components/wizard/ImageAnalysis.vue'
import ReportStep from './ReportStep.vue'

const store = useReportSubmissionStore()
const { list, isLoading, error, load } = useServiceTypes()

const classifying = ref(false)
const errorMessage = ref('')

const stepTitle = `Select an issue type * (required)`
const searchPlaceholder = `Search by issue type`

onMounted(() => {
  void load()
})

const catalog = computed(() => list.value ?? [])
const selected = computed(() => catalog.value.find((s) => s.serviceType === store.category) ?? null)
const hasSurvivingSuggestions = computed(() =>
  store.photoSuggestions.some((s) => catalog.value.some((c) => c.serviceType === s.serviceType)),
)

useWizardValidity(computed(() => !!store.category && !error.value))
const showErrors = useWizardErrors()

function pick(serviceType: string) {
  store.setCategory(serviceType)
}
function change() {
  store.setCategory(null)
}
</script>

<template>
  <ReportStep :step-title="stepTitle">
    <template #step-content>
      <div class="issue-step">
        <ImageAnalysis
          v-if="store.photo.previewUrl && !store.photoSuggestions.length"
          v-model:classifying="classifying"
          v-model:error="errorMessage"
          class="issue-step__analysis"
        />
        <img
          v-else-if="store.photo.previewUrl && store.photoSuggestions.length"
          :src="store.photo.previewUrl"
          class="issue-step__photo"
        />
        <Search :placeholder="searchPlaceholder" class="issue-step__search"></Search>
        <div class="issue-step__issue-types">
          <p v-if="showErrors && !store.category" class="issue-step__error" role="alert">
            Select an issue type to continue
          </p>

          <p v-if="classifying || (isLoading && !catalog.length)" class="issue-step__status">
            Loading issue types…
          </p>
          <p v-else-if="error" class="issue-step__error" role="alert">
            {{ error.message || 'Could not load issue types.' }}
            <PhilaButton
              variant="secondary"
              class="issue-step__retry"
              data-test="retry-types"
              @click="() => void load()"
              >Retry</PhilaButton
            >
          </p>

          <template v-else-if="!store.category">
            <div v-if="store.photo && hasSurvivingSuggestions" class="issue-step__photo-band">
              <TypeSuggestions
                :suggestions="store.photoSuggestions"
                :catalog="catalog"
                @select="pick"
              />
            </div>

            <h5 class="issue-step__subhead">All issue types</h5>
            <TypeDirectory :catalog="catalog" @select="pick" />
          </template>

          <template v-else>
            <div class="issue-step__selected">
              <ServiceTypeIcon :service-type="store.category" :size="36" />
              <span class="issue-step__selected-body">
                <span class="issue-step__selected-name">{{ store.category }}</span>
                <span v-if="selected" class="issue-step__selected-desc">{{
                  selected.description
                }}</span>
              </span>
              <button
                type="button"
                data-test="change-type"
                class="issue-step__change"
                @click="change"
              >
                Change
              </button>
            </div>
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
  grid-template-rows: auto auto;
  column-gap: var(--spacing-xl, 2rem);
  row-gap: var(--spacing-m, 1rem);
}

.issue-step__analysis {
  grid-area: uploadedImage;
  display: grid;
  place-items: center;
  height: 100%;
  width: 100%;
}

.issue-step__photo {
  grid-area: uploadedImage;
  display: grid;
  align-self: center;
  height: auto;
  width: 100%;
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
