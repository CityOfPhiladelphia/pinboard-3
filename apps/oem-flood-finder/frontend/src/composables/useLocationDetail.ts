import { ref, toValue, watchEffect, type MaybeRefOrGetter, type Ref } from 'vue'
import type { Reading } from '../types'
import { fetchReadings } from './useApi';

export type ReadingState = { kind: 'Loading' } | { kind: 'Loaded', data: Reading[] } | { kind: 'Error', message: string } | { kind: 'No Call Needed' }

export function useLocationDetail(
  gaugeId: MaybeRefOrGetter<string>,
  kind: MaybeRefOrGetter<'Aware' | 'Usgs' | 'Camera'>,
  limit: MaybeRefOrGetter<number>
): Ref<ReadingState> {

  const readingState = ref<ReadingState>({ kind: 'Loading' });

  watchEffect(
    async (onCleanup) => {
      let abortController = new AbortController();

      onCleanup(() =>
        abortController.abort()
      );

      if (toValue(kind) === 'Camera') {
        readingState.value = { kind: 'No Call Needed' }
        return
      }

      readingState.value = { kind: 'Loading' };

      const readingResult = await fetchReadings(
        toValue(gaugeId),
        toValue(kind),
        toValue(limit),
        abortController
      )

      if(readingResult.kind === 'Error') {
        readingState.value = { kind: 'Error', message: 'There was an error' } // TODO: add error message
      } 
      else {
       readingState.value = { kind: 'Loaded', data: readingResult.data }; 
      }

    }
  )

  return readingState
}
