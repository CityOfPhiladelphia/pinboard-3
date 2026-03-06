import type { Gauge } from '@/types'
import { ref, onMounted, type Ref } from 'vue'

type State = { kind: 'Loading' } | { kind: 'Loaded', data: Gauge[] } | { kind: 'Error', message: string }

export function useFetchGauges(): Ref<State> {

  // set to Loading initially
  const state = ref<State>({ kind: 'Loading' })

  async function fetchGauges() {

    const myHeaders = new Headers();
    myHeaders.append("x-api-key", import.meta.env.VITE_FLOOD_API_KEY || "");

    const response = await fetch(`${import.meta.env.VITE_FLOOD_API_BASE_URL}/aware/gauge/all`, {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    });

    if (!response.ok) {
      state.value = { kind: 'Error', message: "Error retrieving gauges" };
      return;
    }

    const data = await response.json();

    state.value = { kind: 'Loaded', data: data };

  }

  onMounted(fetchGauges)

  return state
}
