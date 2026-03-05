import { ref, watch, toValue, type Ref, type MaybeRefOrGetter, onWatcherCleanup } from 'vue'
import type { Reading } from '../types'

type ReadingState = { kind: 'Loading' } | { kind: 'Loaded', data: Reading[] } | { kind: 'Error', message: string }

export function useLocationDetail(
  gaugeId: MaybeRefOrGetter<string>,
  limit: MaybeRefOrGetter<number>
) : Ref<ReadingState> {

  const readingState = ref<ReadingState>({ kind: 'Loading' })

  watch(
    // this lambda turns the MaybeRefOrGetter into a getter
    () => [toValue(gaugeId), toValue(limit)] as const,
    
    // callback
    async ([gaugeId, limit], _, onCleanup) => {

      let abortController = new AbortController();

      onCleanup(() =>
        abortController.abort()
      );

      readingState.value = { kind: 'Loading' };

      const myHeaders = new Headers();
      myHeaders.append("x-api-key", "");

      const response = await fetch(`https://flood-monitoring-test-api.phila.gov/aware/reading/${toValue(gaugeId)}?limit=${toValue(limit)}`, {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
        signal: abortController.signal
      });

      if (!response.ok) {
        readingState.value = { kind: 'Error', message: "Readings API resposne error" };
        return;
      }

      const data = await response.json();

      readingState.value = { kind: 'Loaded', data: data };
  },
  { immediate: true }
  )

  return readingState
}
