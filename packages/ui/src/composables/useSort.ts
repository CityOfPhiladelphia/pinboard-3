import { ref, watchEffect } from 'vue'

export function useHandleSortChange(value: string | string[]) {
  const sortOption = ref<string>('')

  const emit = defineEmits<{
    sortOption: [sort: string]
  }>()

  function handleSortChange() {
    value = Array.isArray(value) ? value[0] : value
    sortOption.value = value ?? ''
    emit('sortOption', sortOption.value)
  }

  watchEffect(() => {
    handleSortChange()
  })

  return { sortOption }
}
