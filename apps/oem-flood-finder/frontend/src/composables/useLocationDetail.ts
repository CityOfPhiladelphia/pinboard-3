import { ref, toValue, watchEffect, type MaybeRefOrGetter, type Ref } from 'vue'
import type { Reading } from '../types'

type ReadingState = { kind: 'Loading' } | { kind: 'Loaded', data: Reading[] } | { kind: 'Error', message: string }

export function useLocationDetail(
  gaugeId: MaybeRefOrGetter<string>,
  limit: MaybeRefOrGetter<number>
): Ref<ReadingState> {

  const readingState = ref<ReadingState>({ kind: 'Loading' })

  watchEffect(
    async (onCleanup) => {
      let abortController = new AbortController();

      onCleanup(() =>
        abortController.abort()
      );

      readingState.value = { kind: 'Loading' };

      const myHeaders = new Headers();
      myHeaders.append("x-api-key", import.meta.env.VITE_FLOOD_API_KEY || "");

      const response = await fetch(`${import.meta.env.VITE_FLOOD_API_BASE_URL}/aware/reading/${toValue(gaugeId)}?limit=${toValue(limit)}`, {
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
    }
  )

  return readingState
}
