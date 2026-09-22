<!-- ABOUTME: The "I see this" sub-panel content — an optional comment + a private-comment
     toggle, submitted via onUpvote. Owns its own DetailSubpanel chassis so
     ReportDetailContent only has to decide whether to render it. -->
<script setup lang="ts">
import { ref } from 'vue'
import { PhilaButton } from '@phila/phila-ui-button'
import { Switch } from '@phila/phila-ui-switch'
import { TextArea } from '@phila/phila-ui-text-area'
import { DetailSubpanel } from '@pinboard/ui'

const props = withDefaults(
  defineProps<{
    onBack: () => void
    onClose?: () => void
    upvoting?: boolean
    upvoteError?: string | null
    /** Resolves to whether the upvote succeeded, so the panel can stay open to retry on failure. */
    onUpvote?: (description: string) => Promise<boolean>
  }>(),
  {
    onClose: undefined,
    upvoteError: null,
    onUpvote: undefined,
  },
)

const upvoteDescription = ref('')
const upvoteCommentPrivate = ref(false)

async function confirmUpvote() {
  if (!props.onUpvote) return
  const succeeded = await props.onUpvote(upvoteDescription.value.trim())
  if (succeeded) props.onBack()
}
</script>

<template>
  <DetailSubpanel
    title="I see this"
    back-label="Request details"
    :on-back="onBack"
    :on-close="onClose"
  >
    <TextArea
      v-model="upvoteDescription"
      label="Add a comment (optional)"
      supporting-text="Do you have additional information about this issue to share with 311?"
      placeholder="Enter comment here..."
      :rows="6"
    >
      <template #before-input>
        <Switch v-model="upvoteCommentPrivate" aria-label="Comment privately">
          Comment privately
        </Switch>
      </template>
    </TextArea>
    <div v-if="upvoteError" class="upvote-panel__error" role="alert">
      {{ upvoteError }}
    </div>
    <template #footer>
      <div class="upvote-panel__footer">
        <PhilaButton
          variant="text-flat"
          data-test="upvote-confirm"
          :disabled="upvoting"
          @click="confirmUpvote"
        >
          {{ upvoting ? 'Submitting…' : 'Submit' }}
        </PhilaButton>
      </div>
    </template>
  </DetailSubpanel>
</template>

<style scoped>
.upvote-panel__error {
  color: var(--Schemes-Error, #b3261e);
  margin: var(--spacing-s, 0.5rem) 0 0;
}

.upvote-panel__footer {
  display: flex;
  justify-content: flex-end;
}
</style>
