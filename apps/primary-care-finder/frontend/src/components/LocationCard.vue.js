const __VLS_props = defineProps();
function siteName(location) {
    let value = location.properties.record;
    if (value ===
        'Delaware Valley Community Health (DVCH) Maria de los Santos Womens Health Center') {
        value =
            "Delaware Valley Community Health (DVCH) Maria de los Santos Women's Health Center";
    }
    return value;
}
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "location-card-content" },
});
/** @type {__VLS_StyleScopedClasses['location-card-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
(__VLS_ctx.siteName(__VLS_ctx.location));
if (__VLS_ctx.location.properties.address) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-address" },
    });
    /** @type {__VLS_StyleScopedClasses['card-address']} */ ;
    (__VLS_ctx.location.properties.address);
}
if (__VLS_ctx.location.properties.med_phone_num) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-phone" },
    });
    /** @type {__VLS_StyleScopedClasses['card-phone']} */ ;
    (__VLS_ctx.location.properties.med_phone_num);
}
// @ts-ignore
[siteName, location, location, location, location, location,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
