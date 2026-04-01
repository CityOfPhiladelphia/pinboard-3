// import type { EverbridgeNotification } from "@/types";
// import { onMounted, ref, toValue, type MaybeRefOrGetter, type Ref } from "vue";

// export type NotificationsState = { kind: 'Loading' } | { kind: 'Loaded', data: EverbridgeNotification[] } | { kind: 'Error', message: string } | { kind: 'No Call Needed' }

// export function useAlertBanner(
//   limit: MaybeRefOrGetter<number>
// ) : Ref<NotificationsState> {
//   // set to Loading initially
//   let isLoading = ref(true);
//   let errorMessage = ref<string | null>(null);
//   let everbridgeNotifications = ref<EverbridgeNotification[]>([]);

//   async function fetchLatestAlert() {

//     const myHeaders = new Headers();
//     myHeaders.append("x-api-key", import.meta.env.VITE_FLOOD_API_KEY || "");

//     const url = new URL(`${import.meta.env.VITE_FLOOD_API_BASE_URL}/everbridge/notifications`);
//     url.searchParams.set('limit', toValue(limit).toString());
    
//     const response = await fetch(url, {
//       method: "GET",
//       headers: myHeaders,
//       redirect: "follow"
//     });

//     if (!response.ok) {
//       errorMessage.value = "Error retrieving Everbridge notification(s)";
//       return;
//     }

//     const data = await response.json();
//     isLoading.value = false;
//   }

//   onMounted(fetchLatestAlert);

//   return { data };
// }