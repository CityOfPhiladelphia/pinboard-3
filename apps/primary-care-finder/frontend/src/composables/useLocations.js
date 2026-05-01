import { ref, onMounted } from 'vue';
const ARCGIS_URL = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/red_PrimaryCare/FeatureServer/0/query';
function isVisible(feature) {
    const props = feature.properties;
    // Exclude incomplete records
    if (props.data_complete !== '2')
        return false;
    // Exclude test records
    if (['3', '5', '6', '7', '8', '9'].includes(props.record))
        return false;
    // Exclude test addresses
    if (props.address === 'Test')
        return false;
    return true;
}
export function useLocations() {
    const locations = ref([]);
    const isLoading = ref(true);
    const errorMessage = ref(null);
    const geojson = ref(null);
    async function fetchLocations() {
        try {
            const params = new URLSearchParams({
                where: '1=1',
                outFields: '*',
                f: 'geojson',
            });
            const response = await fetch(`${ARCGIS_URL}?${params}`);
            if (!response.ok) {
                errorMessage.value = 'Error retrieving primary care sites';
                return;
            }
            const rawGeojson = await response.json();
            const filteredFeatures = rawGeojson.features.filter(isVisible);
            locations.value = filteredFeatures.map((feature) => ({
                id: String(feature.properties.objectid),
                name: String(feature.properties.record ?? feature.properties.address ?? ''),
                latitude: feature.geometry.coordinates[1],
                longitude: feature.geometry.coordinates[0],
                properties: feature.properties,
                geometry: feature.geometry,
                locationCardInfo: {
                    heading: String(feature.properties.record ?? feature.properties.address ?? ''),
                    body: String(feature.properties.address ?? ''),
                },
            }));
            geojson.value = {
                type: 'FeatureCollection',
                features: filteredFeatures.map((f) => ({
                    ...f,
                    properties: { ...f.properties, id: String(f.properties.objectid) },
                })),
            };
        }
        catch {
            errorMessage.value = 'Error retrieving primary care sites';
        }
        finally {
            isLoading.value = false;
        }
    }
    onMounted(fetchLocations);
    return { locations, isLoading, errorMessage, geojson };
}
