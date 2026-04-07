import type { LocationDTO, OemLocation } from '@/types'
import type { Location } from '@ui/types'
import { ref, onMounted  } from 'vue'
import { fetchLocations } from './useApi'

function transformLocationDTO(dto: LocationDTO): Location[] {
  const locations: Location[] = []

  for (const gauge of dto.awareGauges) {
    locations.push({
      id: gauge.gaugeId,
      name: gauge.name,
      latitude: gauge.latitude,
      longitude: gauge.longitude,
      lastUpdated: gauge.lastUpdated,
      other: { kind: 'Aware', data: gauge },
    } satisfies OemLocation)
  }

  for (const gauge of dto.usgsGauges) {
    locations.push({
      id: gauge.gaugeId,
      name: gauge.name,
      latitude: gauge.latitude,
      longitude: gauge.longitude,
      lastUpdated: gauge.lastUpdated,
      other: { kind: 'Usgs', data: gauge },
    } satisfies OemLocation)
  }

  for (const camera of dto.cameras) {
    locations.push({
      id: camera.cameraId,
      name: camera.name,
      latitude: camera.latitude,
      longitude: camera.longitude,
      lastUpdated: camera.lastUpdated,
      other: { kind: 'Camera', data: camera },
    } satisfies OemLocation)
  }

  return locations.sort((a, b) => b.latitude - a.latitude)
}

export function useLocations() {

  // set to Loading initially
  let isLoading = ref(true);
  let errorMessage = ref<string | null>(null);
  let locations = ref<Location[]>([]);

  onMounted(async () => {
    let locationsResult = await fetchLocations();

    isLoading.value = false;

    if (locationsResult.kind === 'Error') {
      errorMessage.value = 'API error fetching locations.'
    }
    else {
      locations.value = transformLocationDTO(locationsResult.locationDto)
    }
  });

  return { locations, isLoading, errorMessage };
}