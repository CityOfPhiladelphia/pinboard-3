import { ref, onUnmounted, type Ref } from 'vue'

// A shared "current time" that ticks once a minute so anything depending on it
// (e.g. a location's open/closed status) re-evaluates on its own instead of
// freezing at the value it had when the page loaded. One timer for the whole
// app, reference-counted so it stops when nothing is using it.
const now = ref<Date>(new Date())
let timer: ReturnType<typeof setInterval> | null = null
let consumers = 0

function start(): void {
  if (timer) return
  timer = setInterval(() => {
    now.value = new Date()
  }, 60_000)
}

function stop(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// Pause while the tab is hidden; on return, refresh immediately so a user coming
// back after a while sees correct state without waiting for the next tick.
function handleVisibilityChange(): void {
  if (document.hidden) {
    stop()
  } else {
    now.value = new Date()
    start()
  }
}

export function useNow(): Ref<Date> {
  if (consumers === 0) {
    start()
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }
  consumers += 1

  onUnmounted(() => {
    consumers -= 1
    if (consumers === 0) {
      stop()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  })

  return now
}
