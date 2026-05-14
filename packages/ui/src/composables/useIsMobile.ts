import { onMounted, onUnmounted, ref, type Ref } from "vue";

export function useIsMobile(): Ref<boolean> {

  const mql = matchMedia('(max-width: 1064px) and (max-height: 915px)');

  const isMobile = ref(mql.matches);

  function updateIsMobile(e: MediaQueryListEvent) {
    isMobile.value = e.matches
  }

  onMounted(() => {
    mql.addEventListener('change', updateIsMobile)
  })

  onUnmounted(() => {
    mql.removeEventListener('change', updateIsMobile)
  })

  return isMobile
}