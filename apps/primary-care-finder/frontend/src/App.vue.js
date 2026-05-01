import { computed, ref, toRaw } from 'vue';
import { Pinboard, PinboardShell, CircleLayer, MapNavigationControl, GeolocationButton, BasemapToggle, useUserLocation, useHaversineDistance, } from '@pinboard/ui';
import '@pinboard/ui/style.css';
import { useLocations } from './composables/useLocations';
import LocationCard from './components/LocationCard.vue';
import LocationDetail from './components/LocationDetail.vue';
const searchPlaceholderText = 'Search by address or keyword...';
const { locations, isLoading, errorMessage, geojson } = useLocations();
const { userLocation } = useUserLocation();
const searchString = ref('');
const locationsWithDistance = computed(() => {
    const { latitude, longitude } = userLocation.value;
    const hasUserLocation = !Number.isNaN(latitude) && !Number.isNaN(longitude);
    return locations.value.map((loc) => ({
        ...loc,
        locationCardInfo: {
            ...loc.locationCardInfo,
            subheader: hasUserLocation
                ? `${useHaversineDistance({ latitude: loc.latitude, longitude: loc.longitude }, { latitude, longitude }, 1)} mi`
                : undefined,
        },
    }));
});
const filteredLocations = computed(() => {
    if (!searchString.value)
        return locationsWithDistance.value;
    const terms = searchString.value
        .replace(/\W+/g, ' ')
        .toLowerCase()
        .split(' ')
        .filter(Boolean);
    return locationsWithDistance.value.filter((loc) => {
        const haystack = JSON.stringify(Object.values(loc)).toLowerCase();
        return terms.some((term) => haystack.includes(term));
    });
});
function handleSearchSubmit(s) {
    searchString.value = s;
}
function handleGeolocate(locationData) {
    console.log('Geolocation Accuracy: ', locationData.accuracy);
    userLocation.value = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
    };
}
function handleGeolocateError(error) {
    console.log(error);
}
function getCardDetails(loc) {
    return { heading: loc.name, isLoading: false };
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.PinboardShell | typeof __VLS_components.PinboardShell} */
PinboardShell;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    title: "Primary Care Finder",
    logo: ({
        variant: 'city',
        layout: 'single-line',
        colorScheme: 'on-primary',
        customName: 'Primary Care Finder',
        href: '/',
    }),
    infoTitle: "About this tool",
}));
const __VLS_2 = __VLS_1({
    title: "Primary Care Finder",
    logo: ({
        variant: 'city',
        layout: 'single-line',
        colorScheme: 'on-primary',
        customName: 'Primary Care Finder',
        href: '/',
    }),
    infoTitle: "About this tool",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
{
    const { 'mobile-nav': __VLS_7 } = __VLS_3.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
        href: "/",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
        href: "/about",
    });
}
{
    const { 'info-body': __VLS_8 } = __VLS_3.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "has-text-body-small" },
    });
    /** @type {__VLS_StyleScopedClasses['has-text-body-small']} */ ;
}
let __VLS_9;
/** @ts-ignore @type {typeof __VLS_components.Pinboard | typeof __VLS_components.Pinboard} */
Pinboard;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({
    ...{ 'onSearch': {} },
    locations: (__VLS_ctx.filteredLocations),
    getCardDetails: (__VLS_ctx.getCardDetails),
    isLoading: (__VLS_ctx.isLoading),
    errorMessage: (__VLS_ctx.errorMessage),
    locationPanelSearch: (__VLS_ctx.searchPlaceholderText),
    geojson: (__VLS_ctx.geojson),
}));
const __VLS_11 = __VLS_10({
    ...{ 'onSearch': {} },
    locations: (__VLS_ctx.filteredLocations),
    getCardDetails: (__VLS_ctx.getCardDetails),
    isLoading: (__VLS_ctx.isLoading),
    errorMessage: (__VLS_ctx.errorMessage),
    locationPanelSearch: (__VLS_ctx.searchPlaceholderText),
    geojson: (__VLS_ctx.geojson),
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
let __VLS_14;
const __VLS_15 = ({ search: {} },
    { onSearch: (__VLS_ctx.handleSearchSubmit) });
const { default: __VLS_16 } = __VLS_12.slots;
{
    const { 'location-card': __VLS_17 } = __VLS_12.slots;
    const [{ location }] = __VLS_vSlot(__VLS_17);
    const __VLS_18 = LocationCard;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        location: location,
    }));
    const __VLS_20 = __VLS_19({
        location: location,
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    // @ts-ignore
    [filteredLocations, getCardDetails, isLoading, errorMessage, searchPlaceholderText, geojson, handleSearchSubmit,];
}
{
    const { 'location-detail': __VLS_23 } = __VLS_12.slots;
    const [{ location }] = __VLS_vSlot(__VLS_23);
    const __VLS_24 = LocationDetail;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
        location: location,
    }));
    const __VLS_26 = __VLS_25({
        location: location,
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    // @ts-ignore
    [];
}
{
    const { 'map-content': __VLS_29 } = __VLS_12.slots;
    const [{ geojson, hoveredId, selectedId, isMobile, mobileControlsTarget, onHover, onHoverEnd, onSelect, }] = __VLS_vSlot(__VLS_29);
    if (!isMobile) {
        let __VLS_30;
        /** @ts-ignore @type {typeof __VLS_components.MapNavigationControl} */
        MapNavigationControl;
        // @ts-ignore
        const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
            position: "bottom-right",
        }));
        const __VLS_32 = __VLS_31({
            position: "bottom-right",
        }, ...__VLS_functionalComponentArgsRest(__VLS_31));
    }
    let __VLS_35;
    /** @ts-ignore @type {typeof __VLS_components.BasemapToggle} */
    BasemapToggle;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
        position: "top-right",
        teleportTo: (isMobile ? mobileControlsTarget : undefined),
    }));
    const __VLS_37 = __VLS_36({
        position: "top-right",
        teleportTo: (isMobile ? mobileControlsTarget : undefined),
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
    let __VLS_40;
    /** @ts-ignore @type {typeof __VLS_components.GeolocationButton} */
    GeolocationButton;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
        ...{ 'onLocated': {} },
        ...{ 'onError': {} },
        position: (isMobile ? 'top-right' : 'bottom-right'),
        teleportTo: (isMobile ? mobileControlsTarget : undefined),
    }));
    const __VLS_42 = __VLS_41({
        ...{ 'onLocated': {} },
        ...{ 'onError': {} },
        position: (isMobile ? 'top-right' : 'bottom-right'),
        teleportTo: (isMobile ? mobileControlsTarget : undefined),
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    let __VLS_45;
    const __VLS_46 = ({ located: {} },
        { onLocated: (__VLS_ctx.handleGeolocate) });
    const __VLS_47 = ({ error: {} },
        { onError: (__VLS_ctx.handleGeolocateError) });
    var __VLS_43;
    var __VLS_44;
    if (geojson) {
        let __VLS_48;
        /** @ts-ignore @type {typeof __VLS_components.CircleLayer} */
        CircleLayer;
        // @ts-ignore
        const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
            ...{ 'onMouseenter': {} },
            ...{ 'onMouseleave': {} },
            ...{ 'onClick': {} },
            id: "locations",
            source: ({ type: 'geojson', data: __VLS_ctx.toRaw(geojson) }),
            paint: ({
                'circle-radius': [
                    'case',
                    ['==', ['get', 'id'], selectedId ?? ''],
                    12,
                    ['==', ['get', 'id'], hoveredId ?? ''],
                    10,
                    7,
                ],
                'circle-color': [
                    'case',
                    ['==', ['get', 'id'], selectedId ?? ''],
                    '#0D47A1',
                    ['==', ['get', 'id'], hoveredId ?? ''],
                    '#1976D2',
                    '#1976D2',
                ],
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2,
            }),
        }));
        const __VLS_50 = __VLS_49({
            ...{ 'onMouseenter': {} },
            ...{ 'onMouseleave': {} },
            ...{ 'onClick': {} },
            id: "locations",
            source: ({ type: 'geojson', data: __VLS_ctx.toRaw(geojson) }),
            paint: ({
                'circle-radius': [
                    'case',
                    ['==', ['get', 'id'], selectedId ?? ''],
                    12,
                    ['==', ['get', 'id'], hoveredId ?? ''],
                    10,
                    7,
                ],
                'circle-color': [
                    'case',
                    ['==', ['get', 'id'], selectedId ?? ''],
                    '#0D47A1',
                    ['==', ['get', 'id'], hoveredId ?? ''],
                    '#1976D2',
                    '#1976D2',
                ],
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2,
            }),
        }, ...__VLS_functionalComponentArgsRest(__VLS_49));
        let __VLS_53;
        const __VLS_54 = ({ mouseenter: {} },
            { onMouseenter: ((e) => onHover(e.features?.[0]?.properties?.id)) });
        const __VLS_55 = ({ mouseleave: {} },
            { onMouseleave: (onHoverEnd) });
        const __VLS_56 = ({ click: {} },
            { onClick: ((e) => {
                    const feature = e.features?.[0];
                    if (!feature)
                        return;
                    const loc = __VLS_ctx.locationsWithDistance.find((l) => l.id === feature.properties?.id);
                    if (loc)
                        onSelect(loc);
                }) });
        var __VLS_51;
        var __VLS_52;
    }
    // @ts-ignore
    [handleGeolocate, handleGeolocateError, toRaw, locationsWithDistance,];
}
// @ts-ignore
[];
var __VLS_12;
var __VLS_13;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
