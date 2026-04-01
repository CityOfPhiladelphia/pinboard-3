import type { EverbridgeNotification } from "@/types";
import { onMounted, ref, toValue, type MaybeRefOrGetter } from "vue";

export function useEverbridgeNotifications(
  limit: MaybeRefOrGetter<number>
) {

  let everbridgeNotifications = ref<EverbridgeNotification[]>([]);

  async function fetchLatestAlerts() {

    const myHeaders = new Headers();
    myHeaders.append("x-api-key", import.meta.env.VITE_FLOOD_API_KEY || "");

    const url = new URL(`${import.meta.env.VITE_FLOOD_API_BASE_URL}/everbridge/notifications`);
    url.searchParams.set('limit', toValue(limit).toString());
    
    const response = await fetch(url, {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    });

    everbridgeNotifications.value = await response.json();
  }

  onMounted(fetchLatestAlerts);

  return { everbridgeNotifications };
}