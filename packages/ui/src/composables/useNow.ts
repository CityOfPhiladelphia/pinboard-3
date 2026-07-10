import { ref, onUnmounted, type Ref } from 'vue'

// A shared "current time" that ticks at the top of each minute so anything
// depending on it (e.g. a location's open/closed status) re-evaluates on its own
// instead of freezing at the value it had when the page loaded. One timer for the
// whole app, reference-counted so it stops when nothing is using it.
const now = ref<Date>(new Date())
let tickTimeout: ReturnType<typeof setTimeout> | null = null
let consumers = 0

// A hair past the minute boundary, so `new Date()` has definitely crossed into
// the new minute before we read it.
const TICK_MARGIN_MS = 50

// Fire at the next wall-clock minute (:00), then re-align each tick so the timing
// never drifts away from the minute boundary. This is deliberately a
// self-rescheduling setTimeout rather than setInterval: setInterval fires at a
// fixed offset from when it started (wherever inside the minute that happened to
// be) and accumulates drift, whereas recomputing the delay each tick keeps us
// landing on :00 so open/closed status flips exactly on the minute.
function scheduleTick(): void {
  const msUntilNextMinute = 60_000 - (Date.now() % 60_000) + TICK_MARGIN_MS
  tickTimeout = setTimeout(() => {
    now.value = new Date()
    scheduleTick()
  }, msUntilNextMinute)
}

function start(): void {
  if (tickTimeout) return
  scheduleTick()
}

function stop(): void {
  if (tickTimeout) {
    clearTimeout(tickTimeout)
    tickTimeout = null
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
