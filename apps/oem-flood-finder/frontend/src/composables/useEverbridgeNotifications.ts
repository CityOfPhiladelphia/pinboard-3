import type { EverbridgeNotification } from '@/types'
import { onMounted, ref, toValue, type MaybeRefOrGetter } from 'vue'

export function useEverbridgeNotifications(limit: MaybeRefOrGetter<number>) {
  const everbridgeNotifications = ref<EverbridgeNotification[]>([])

  if (import.meta.env.DEV) {
    onMounted(fetchLatestAlertsDev)
  } else {
    onMounted(fetchLatestAlertsProxy)
  }

  return { everbridgeNotifications }

  async function fetchLatestAlertsProxy() {
    const url = new URL(
      'https://haydr3k097.execute-api.us-east-1.amazonaws.com/getOemEverbridgeNotifications',
    )
    url.searchParams.set('limit', toValue(limit).toString())

    try {
      const response = await fetch(url)
      everbridgeNotifications.value = await response.json()
    } catch (err) {
      console.log(err)
      everbridgeNotifications.value = []
    }
  }

  async function fetchLatestAlertsDev() {
    const myHeaders = new Headers()
    myHeaders.append('x-api-key', import.meta.env.VITE_FLOOD_API_KEY || '')

    const url = new URL(`${import.meta.env.VITE_FLOOD_API_BASE_URL}/everbridge/notifications`)
    url.searchParams.set('limit', toValue(limit).toString())

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow',
      })
      everbridgeNotifications.value = await response.json()
    } catch (err) {
      console.log(err)
      everbridgeNotifications.value = []
    }
  }
}
