import { ref, computed, onMounted, onBeforeUnmount, nextTick, type Ref } from 'vue'
import type { BasicLocation } from '../types'

// Print one or more locations by teleporting their details into a hidden,
// print-only container (see styles/print.css) and opening the browser print
// dialog. Lives here rather than in a component so any finder rendering a
// location detail can offer print without re-implementing the plumbing.
export function usePrint(locations: Ref<BasicLocation[]>) {
  const printIds = ref<string[]>([])

  const printLocations = computed(() =>
    printIds.value
      .map((id) => locations.value.find((loc) => loc.id === id))
      .filter((loc): loc is BasicLocation => loc !== undefined)
  )

  function print(location: BasicLocation) {
    printIds.value = [location.id]
    // Wait for the print container to render the detail before opening the dialog.
    nextTick(() => window.print())
  }

  function clearPrint() {
    printIds.value = []
  }

  onMounted(() => window.addEventListener('afterprint', clearPrint))
  onBeforeUnmount(() => window.removeEventListener('afterprint', clearPrint))

  return { printIds, printLocations, print }
}
