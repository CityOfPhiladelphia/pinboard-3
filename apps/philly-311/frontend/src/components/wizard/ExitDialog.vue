<!-- ABOUTME: Wizard exit confirmation dialog — offers saving the in-progress
     report as a draft or discarding it; cancelling keeps the user in the wizard. -->
<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { PhilaButton } from '@phila/phila-ui-button'
import { useAuth } from '@phila/sso-vue'
import { useRoute } from 'vue-router'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; save: []; discard: [] }>()

const loggedInMessage = 'Save your progress as a draft, or discard the report.'
const loggedOutMessage = `Press ${navigator.platform.toLowerCase().includes('mac') ? 'Cmd' : 'Ctrl'} + D to bookmark this page, or drag this link to your bookmarks`

const dialog = ref<HTMLDialogElement | null>(null)
const { isAuthenticated } = useAuth()
const route = useRoute()

const bookmarkTitle = computed(() => {
  return `Philly 311 Report: ${route.query.c}`
})

// The template ref isn't populated until after the first render, so an
// `immediate` watch would run before `dialog.value` exists — sync once on
// mount to cover being instantiated already-open, then watch for changes.
onMounted(() => syncOpen(props.open))
watch(() => props.open, syncOpen)

function syncOpen(open: boolean) {
  if (open) dialog.value?.showModal?.()
  else dialog.value?.close?.()
}

function close() {
  emit('update:open', false)
}
function onSave() {
  close()
  emit('save')
}
function onDiscard() {
  close()
  emit('discard')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="exit-dialog"
    aria-labelledby="exit-dialog-title"
    @close="close"
    @cancel="close"
  >
    <h2 id="exit-dialog-title" class="exit-dialog__title">Exit this report?</h2>
    <p class="exit-dialog__body">
      {{ isAuthenticated ? loggedInMessage : loggedOutMessage }}
      <a
        v-if="!isAuthenticated"
        :href="route.fullPath"
        :title="bookmarkTitle"
        draggable="true"
        v-text="bookmarkTitle"
      />
    </p>
    <div class="exit-dialog__actions">
      <button type="button" class="exit-dialog__cancel" data-test="exit-cancel" @click="close">
        Cancel
      </button>
      <PhilaButton variant="secondary" data-test="exit-discard" @click="onDiscard"
        >Discard</PhilaButton
      >
      <PhilaButton variant="primary" data-test="exit-save" @click="onSave">Save draft</PhilaButton>
    </div>
  </dialog>
</template>

<style scoped>
.exit-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 28rem;
  width: 100%;
  padding: var(--spacing-l, 2rem);
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}
.exit-dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}
.exit-dialog__title {
  margin: 0 0 var(--spacing-s, 0.75rem);
}
.exit-dialog__body {
  margin: 0 0 var(--spacing-l, 2rem);
  color: var(--Schemes-On-Surface-Variant, #4a4a4a);
}
.exit-dialog__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
}
.exit-dialog__cancel {
  margin-right: auto;
  background: none;
  border: none;
  color: var(--Schemes-Primary, #0f4d90);
  font-weight: 600;
  cursor: pointer;
}
</style>
