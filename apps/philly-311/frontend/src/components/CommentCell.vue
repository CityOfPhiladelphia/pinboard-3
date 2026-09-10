<!-- ABOUTME: A single row in the Activity comment thread — avatar, sender name (with a
     verified badge for department/staff replies), timestamp, and body. A leading
     image-URL line in the comment's content (see utils/commentContent.ts) renders as
     a thumbnail instead of text. -->
<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@phila/phila-ui-core'
import { IconCircleCheck, IconHeadset, IconUser } from '@phila/phila-ui-core/icons'
import { parseCommentContent } from '@/utils/commentContent'
import type { Comment } from '@/types/api'

const props = defineProps<{ comment: Comment }>()

// Every anonymous/public commenter shares the same generic account name server-side —
// there's no per-person identity to show, so they're all labeled "Public user", matching
// both reference mobile apps exactly (neither has a "this was you" distinction either).
const verified = computed(() => props.comment.creator.name !== 'Philly311 App')
const senderName = computed(() => (verified.value ? props.comment.creator.name : 'Public user'))

const parsed = computed(() => parseCommentContent(props.comment.content))

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
const formattedDate = computed(() => {
  const d = new Date(props.comment.createdAt)
  return Number.isNaN(d.getTime()) ? '' : dateFormatter.format(d)
})
</script>

<template>
  <div class="comment-cell">
    <div class="comment-cell__row">
      <div class="comment-cell__avatar" :class="{ 'comment-cell__avatar--verified': verified }">
        <Icon :icon="verified ? IconHeadset : IconUser" decorative size="small" />
      </div>
      <div class="comment-cell__meta">
        <div class="comment-cell__sender">
          <span class="has-text-label-small">{{ senderName }}</span>
          <Icon
            v-if="verified"
            :icon="IconCircleCheck"
            decorative
            size="extra-small"
            class="comment-cell__verified-badge"
          />
        </div>
        <div class="comment-cell__timestamp has-text-body-small">{{ formattedDate }}</div>
      </div>
    </div>
    <img v-if="parsed.imageUrl" :src="parsed.imageUrl" alt="" class="comment-cell__image" />
    <div v-if="parsed.body" class="comment-cell__body has-text-body-default">{{ parsed.body }}</div>
  </div>
</template>

<style scoped>
.comment-cell {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m, 1rem);
  padding-bottom: var(--spacing-l, 1.5rem);
  border-bottom: 1px solid var(--Schemes-Border-low, #ccc);
}
.comment-cell__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
}
.comment-cell__avatar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-full, 9999px);
  background: var(--Schemes-Surface, #fff);
  color: var(--Schemes-On-Background, #000);
}
.comment-cell__avatar--verified {
  background: var(--Schemes-Primary, #1034f4);
  color: var(--Schemes-On-Primary, #fff);
}
.comment-cell__meta {
  min-width: 0;
}
.comment-cell__sender {
  display: flex;
  align-items: center;
  gap: var(--spacing-3xs, 0.125rem);
  color: var(--Schemes-On-Surface-Low, #636363);
}
.comment-cell__verified-badge {
  color: var(--Schemes-Primary, #1034f4);
}
.comment-cell__timestamp {
  color: var(--Schemes-On-Surface-Low, #636363);
}
.comment-cell__image {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  border-radius: var(--border-radius-l, 1rem);
}
.comment-cell__body {
  color: var(--Schemes-On-Surface, #343434);
  margin: 0;
}
</style>
