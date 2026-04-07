import type { EverbridgeNotification } from "@/types";
import { onMounted, ref, toValue, type MaybeRefOrGetter } from "vue";
import { fetchAlerts } from "./useApi";

export function useEverbridgeNotifications(
  limit: MaybeRefOrGetter<number>
) {

  let everbridgeNotifications = ref<EverbridgeNotification[]>([]);

  onMounted(async () => {
    everbridgeNotifications.value = await fetchAlerts(toValue(limit))
  });

  return { everbridgeNotifications };
}