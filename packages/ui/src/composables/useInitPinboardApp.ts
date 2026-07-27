import { onBeforeUnmount, provide, ref } from 'vue'
import { useLocale } from './useLocale'
import { useIsMobile } from './useIsMobile'
import { IS_MOBILE_KEY } from '../keys'

export function useInitPinboardApp(localeAppKey?: string) {
  const { locale, init, setLocale } = localeAppKey ? useLocale(localeAppKey) : {}
  if (init) init()

  const infoSheetOpen = ref(false)
  const isDraggingSheet = ref(false)
  const dragY = ref(0)

  function openInfoSheet(event: Event) {
    event.preventDefault()
    event.stopPropagation()
    infoSheetOpen.value = true
  }

  function closeInfoSheet() {
    infoSheetOpen.value = false
    dragY.value = 0
  }

  /* Drag-down-to-dismiss. BottomSheet's built-in drag is snap-point based
   * and a single snap point ([60]) clamps it to no movement, so we layer
   * our own pointer tracking on top: translate the sheet to follow the
   * pointer, dismiss past DRAG_DISMISS_THRESHOLD on release, otherwise
   * spring back. Clicks (zero delta) pass through. */
  const DRAG_DISMISS_THRESHOLD = 160
  let dragStartY = 0

  function onSheetPointerDown(e: PointerEvent) {
    dragStartY = e.clientY
    dragY.value = 0
    isDraggingSheet.value = true
    document.addEventListener('pointermove', onSheetPointerMove)
    document.addEventListener('pointerup', onSheetPointerUp)
    document.addEventListener('pointercancel', onSheetPointerUp)
  }

  function onSheetPointerMove(e: PointerEvent) {
    if (!isDraggingSheet.value) return
    dragY.value = Math.max(0, e.clientY - dragStartY)
  }

  function onSheetPointerUp() {
    if (!isDraggingSheet.value) return
    isDraggingSheet.value = false
    document.removeEventListener('pointermove', onSheetPointerMove)
    document.removeEventListener('pointerup', onSheetPointerUp)
    document.removeEventListener('pointercancel', onSheetPointerUp)
    if (dragY.value > DRAG_DISMISS_THRESHOLD) {
      closeInfoSheet()
    } else {
      dragY.value = 0
    }
  }

  const isMobile = useIsMobile()
  provide(IS_MOBILE_KEY, isMobile)

  onBeforeUnmount(() => {
    document.removeEventListener('pointermove', onSheetPointerMove)
    document.removeEventListener('pointerup', onSheetPointerUp)
    document.removeEventListener('pointercancel', onSheetPointerUp)
  })

  return {
    isMobile,
    locale,
    setLocale,
    infoSheetOpen,
    dragY,
    openInfoSheet,
    closeInfoSheet,
    onSheetPointerDown,
    onSheetPointerMove,
    onSheetPointerUp,
  }
}
