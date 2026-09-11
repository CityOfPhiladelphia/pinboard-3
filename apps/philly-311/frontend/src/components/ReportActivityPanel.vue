<!-- ABOUTME: The Activity sub-panel content — comment thread (sort/verified-only filtering)
     plus a composer (text + photo). Owns its own DetailSubpanel chassis and loads its
     comments on mount, so ReportDetailContent only has to decide whether to render it. -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { PhilaButton } from '@phila/phila-ui-button'
import { Icon } from '@phila/phila-ui-core'
import type { FilterChoice } from '@phila/phila-ui-core'
import {
  IconArrowDown,
  IconArrowUp,
  IconCircleCheck,
  IconClose,
  IconImage,
} from '@phila/phila-ui-core/icons'
import { FilterChip } from '@phila/phila-ui-filter-chip'
import { TextArea } from '@phila/phila-ui-text-area'
import { DetailSubpanel } from '@pinboard/ui'
import CommentCell from './CommentCell.vue'
import { useComments } from '@/composables/useComments'
import type { Issue } from '@/types/api'
import { serviceTypeTintStyle } from '@/utils/serviceTypeMeta'
import { serviceTypeIconComponent } from '@/utils/reportIcon'
import { resizeImageFileToDataURL } from '@/utils/photo'

const props = defineProps<{
  report: Issue
  onBack: () => void
  onClose?: () => void
}>()

const placeholderStyle = computed(() => serviceTypeTintStyle(props.report.serviceType))
const placeholderIcon = computed(() => serviceTypeIconComponent(props.report.serviceType))

const {
  comments,
  isLoading: commentsLoading,
  errorMessage: commentsError,
  isPosting,
  postError,
  load: loadComments,
  post: postComment,
} = useComments()

onMounted(() => void loadComments(props.report.id))

const SORT_CHOICES: FilterChoice[] = [
  { text: 'Newest first', value: 'newest' },
  { text: 'Oldest first', value: 'oldest' },
]
const sortOrder = ref<'newest' | 'oldest'>('newest')
const sortIcon = computed(() => (sortOrder.value === 'newest' ? IconArrowDown : IconArrowUp))
const sortChosen = ref(false)
const sortModelValue = computed(() => (sortChosen.value ? { [sortOrder.value]: true } : {}))
function handleSortChange(value: Record<string, boolean>) {
  const selected = Object.keys(value).find((key) => value[key])
  if (selected === 'newest' || selected === 'oldest') {
    sortOrder.value = selected
    sortChosen.value = true
    return
  }
  sortOrder.value = 'newest'
  sortChosen.value = false
}
const verifiedOnly = ref(false)

const sortedComments = computed(() => {
  const list = verifiedOnly.value
    ? comments.value.filter((c) => c.creator.name !== 'Philly311 App')
    : comments.value
  const sorted = [...list].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
  return sortOrder.value === 'newest' ? sorted.reverse() : sorted
})

const newCommentText = ref('')
const pendingPhoto = ref<{ dataUrl: string } | null>(null)
const photoInput = ref<HTMLInputElement | null>(null)

async function handlePhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // allow re-selecting the same file later (e.g. after removing it)
  if (!file) return
  const dataUrl = await resizeImageFileToDataURL(file)
  pendingPhoto.value = { dataUrl }
}
function removePendingPhoto() {
  pendingPhoto.value = null
}

async function submitComment() {
  const content = newCommentText.value.trim()
  if (!content) return
  const succeeded = await postComment(props.report.id, content, pendingPhoto.value?.dataUrl)
  if (succeeded) {
    newCommentText.value = ''
    pendingPhoto.value = null
  }
}
</script>

<template>
  <DetailSubpanel
    title="Activity"
    back-label="Request details"
    :on-back="onBack"
    :on-close="onClose"
  >
    <div class="activity-panel__content">
      <div class="activity-panel__header">
        <div class="activity-panel__avatar" :style="report.mediaUrl ? undefined : placeholderStyle">
          <img v-if="report.mediaUrl" :src="report.mediaUrl" :alt="report.serviceType" />
          <Icon v-else :icon="placeholderIcon" decorative size="large" />
        </div>
        <div class="activity-panel__title has-text-label-default">
          {{ report.serviceType }}
        </div>
        <div v-if="report.address" class="activity-panel__subtitle has-text-body-small">
          {{ report.address }}
        </div>
        <div class="activity-panel__disclaimer has-text-body-small">
          Please use respectful, community conscious language. You will not receive replies here.
          <a href="tel:311" class="activity-panel__call-link">Call 311</a> to speak to an agent.
        </div>
      </div>

      <div v-if="comments.length" class="activity-panel__filters">
        <FilterChip
          label="Sort"
          color="grey"
          :icon="sortIcon"
          :choices="SORT_CHOICES"
          :model-value="sortModelValue"
          @update:model-value="handleSortChange"
        />
        <FilterChip
          text="Verified only"
          color="grey"
          :icon="IconCircleCheck"
          :selected="verifiedOnly"
          @update:selected="verifiedOnly = $event"
        />
      </div>

      <div
        v-if="commentsLoading && !comments.length"
        class="activity-panel__status has-text-body-default"
      >
        Loading activity…
      </div>
      <div
        v-else-if="commentsError"
        class="activity-panel__status has-text-body-default"
        role="alert"
      >
        {{ commentsError }}
      </div>
      <div v-else-if="!comments.length" class="activity-panel__status has-text-body-default">
        No comments yet.
      </div>
      <div v-else-if="!sortedComments.length" class="activity-panel__status has-text-body-default">
        No verified comments.
      </div>
      <div v-else class="activity-panel__list">
        <CommentCell v-for="comment in sortedComments" :key="comment.id" :comment="comment" />
      </div>
    </div>

    <template #footer>
      <div class="activity-panel__composer">
        <div v-if="postError" class="activity-panel__error" role="alert">
          {{ postError }}
        </div>
        <div class="activity-panel__composer-row">
          <input
            ref="photoInput"
            type="file"
            accept="image/*"
            class="activity-panel__photo-input"
            @change="handlePhotoSelected"
          />
          <PhilaButton
            :icon="IconImage"
            :icon-only="true"
            variant="standard"
            size="small"
            aria-label="Attach a photo"
            @click="photoInput?.click()"
          />
          <div v-if="pendingPhoto" class="activity-panel__photo-preview">
            <img :src="pendingPhoto.dataUrl" alt="" />
            <button
              type="button"
              class="activity-panel__photo-remove"
              aria-label="Remove photo"
              @click="removePendingPhoto"
            >
              <Icon
                :icon="IconClose"
                decorative
                size="extra-small"
                class="activity-panel__photo-remove-icon"
              />
            </button>
          </div>
          <div class="activity-panel__textarea">
            <TextArea
              v-model="newCommentText"
              placeholder="Add a comment…"
              aria-label="Add a comment"
              :rows="1"
              :max-length="null"
            />
          </div>
          <PhilaButton
            :icon="IconArrowUp"
            :icon-only="true"
            variant="primary"
            size="small"
            data-test="activity-send"
            aria-label="Post comment"
            :disabled="!newCommentText.trim() || isPosting"
            @click="submitComment"
          />
        </div>
      </div>
    </template>
  </DetailSubpanel>
</template>

<style scoped>
.activity-panel__content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-l, 1.5rem);
}
.activity-panel__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2xs, 0.25rem);
  text-align: center;
  color: var(--Schemes-On-Surface-Low, #636363);
}
.activity-panel__avatar {
  width: 64px;
  height: 64px;
  border-radius: var(--border-radius-full, 9999px);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--Sidewalk-Grey-700-Sidewalk-Grey, #f1f1f1);
  margin-bottom: var(--spacing-2xs, 0.25rem);
}
.activity-panel__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.activity-panel__title {
  color: var(--Schemes-On-Background, #000);
}
.activity-panel__disclaimer {
  margin-top: var(--spacing-2xs, 0.25rem);
}
.activity-panel__call-link {
  font-weight: 600;
  color: var(--Schemes-Primary, #1034f4);
}
.activity-panel__filters {
  display: flex;
  justify-content: center;
  gap: var(--spacing-xs, 0.5rem);
}
.activity-panel__status {
  color: var(--Schemes-On-Surface-Low, #636363);
  text-align: center;
  padding: var(--spacing-l, 1.5rem) 0;
}
.activity-panel__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-l, 1.5rem);
}
.activity-panel__error {
  color: var(--Schemes-Error, #b3261e);
  margin: var(--spacing-s, 0.5rem) 0 0;
}
.activity-panel__composer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-s, 0.75rem);
}
.activity-panel__composer-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.5rem);
}
.activity-panel__textarea {
  flex: 1 1 auto;
  min-width: 0;
}
.activity-panel__photo-input {
  display: none;
}
.activity-panel__photo-preview {
  position: relative;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  margin-right: 8px;
}
.activity-panel__photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--border-radius-m, 12px);
}
.activity-panel__photo-remove {
  cursor: pointer;
  position: absolute;
  top: 0;
  right: 0;
  translate: 50% -50%;
  background: transparent;
  border: none;
  padding: 0;
}
.activity-panel__photo-remove-icon {
  width: var(--scale-300, 1.5rem);
  height: var(--scale-300, 1.5rem);
  border-radius: var(--border-radius-full, 9999px);
  background: var(--Schemes-Error, #cc3000);
  color: var(--Schemes-On-Error, #fff);
  text-align: center;
  box-shadow: var(
    --elevation-light-1,
    0 1px 2px 0 rgba(0, 0, 0, 0.3),
    0 1px 3px 1px rgba(0, 0, 0, 0.15)
  );
}
</style>
