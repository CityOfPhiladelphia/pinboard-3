import { ref, watch, toValue, type Ref, type MaybeRefOrGetter, onWatcherCleanup } from 'vue'
import type { Reading } from '../types'

type ReadingState = { kind: 'Loading' } | { kind: 'Loaded', data: Reading[] } | { kind: 'Error', message: string }

export function useLocationDetail(
  gaugeId: MaybeRefOrGetter<string>,
  // limit: Ref<number>
) : Ref<ReadingState> {

  const readingState = ref<ReadingState>({ kind: 'Loading' })

  watch(
    // this lambda turns the MaybeRefOrGetter into a getter
    () => toValue(gaugeId),
    
    // callback
    async (gaugeId, _, onCleanup) => {
      console.log(gaugeId);
      let abortController = new AbortController();

      onCleanup(() =>
        abortController.abort()
      );

      readingState.value = { kind: 'Loading' };

      const myHeaders = new Headers();
      myHeaders.append("x-api-key", "");

      const response = await fetch(`https://flood-monitoring-test-api.phila.gov/aware/reading/${toValue(gaugeId)}?limit=5`, {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
        signal: abortController.signal
      });

      if (!response.ok) {
        readingState.value = { kind: 'Error', message: "Readings API response error" };
        return;
      }

      const data = await response.json();

      readingState.value = { kind: 'Loaded', data: data };
  },
  { immediate: true }
  )

  return readingState
}
