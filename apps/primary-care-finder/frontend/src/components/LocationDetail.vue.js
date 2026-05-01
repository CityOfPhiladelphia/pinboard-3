import { computed } from 'vue';
import { format, parseISO } from 'date-fns';
import { useI18n } from 'vue-i18n';
const props = defineProps();
const { t, locale, messages } = useI18n();
const p = computed(() => props.location.properties);
const fullAddress = computed(() => {
    let addr = p.value.address;
    if (p.value.address_2)
        addr += ', ' + p.value.address_2;
    addr += ', Philadelphia, PA ' + p.value.zip_code;
    return addr;
});
function siteName() {
    let value = p.value.record;
    if (value ===
        'Delaware Valley Community Health (DVCH) Maria de los Santos Womens Health Center') {
        value =
            "Delaware Valley Community Health (DVCH) Maria de los Santos Women's Health Center";
    }
    return value;
}
const YES_VALUES = ['Yes', 'Established Patients'];
const ageSpecificServices = computed(() => {
    const rows = [];
    const checks = [
        ['visitType.well', 'primary_well_ad', 'primary_well_ch'],
        ['visitType.sick', 'primary_sick_ad', 'primary_sick_ch'],
        ['visitType.vaccine', 'primary_vacc_ad', 'primary_vacc_child'],
        ['specialty.mental', 'special_mental_ad', 'special_mental_ch'],
        ['specialty.dental', 'special_dental_ad', 'special_dental_ch'],
        ['specialty.eye', 'special_eye_ad', 'special_eye_ch'],
    ];
    let id = 1;
    for (const [service, adultField, childField] of checks) {
        const adult = p.value[adultField];
        const child = p.value[childField];
        if (YES_VALUES.includes(adult ?? '') || YES_VALUES.includes(child ?? '')) {
            rows.push({ id: id++, service, adult, child, existing: [adult, child] });
        }
    }
    return rows;
});
const otherServices = computed(() => {
    const rows = [];
    const checks = [
        ['visitType.sports', 'primary_sports'],
        ['visitType.prenatal', 'primary_prenatal'],
        ['visitType.women', 'primary_women'],
        ['specialty.mat', 'special_mat'],
        ['specialty.podiatry', 'special_podiatry'],
        ['specialty.nutrition', 'special_nutrition'],
        ['specialty.tobacco', 'special_tobacco'],
        ['visitType.telehealth', 'primary_telehealth'],
        ['specialty.pharmacy', 'special_pharmacy'],
    ];
    let id = 1;
    for (const [service, field] of checks) {
        const val = p.value[field];
        if (YES_VALUES.includes(val ?? '')) {
            rows.push({ id: id++, service, value: val });
        }
    }
    return rows;
});
// --- Hours ---
const DAYS = ['mon', 'tues', 'wed', 'thurs', 'fri', 'sat', 'sun'];
const DAY_I18N_KEYS = {
    mon: 'Monday',
    tues: 'Tuesday',
    wed: 'Wednesday',
    thurs: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday',
};
const exceptionsByDay = computed(() => {
    const result = {};
    for (const day of DAYS) {
        const exc = p.value[`hours_${day}_exceptions`];
        if (exc)
            result[day] = exc;
    }
    return result;
});
const exceptionsList = computed(() => {
    const arr = [];
    for (const day of DAYS) {
        const exc = p.value[`hours_${day}_exceptions`];
        if (exc)
            arr.push(exc);
    }
    return [...new Set(arr)];
});
function parseTime(raw) {
    if (!raw)
        return '';
    return format(parseISO('2022-05-24T' + raw), 'h:mm aaaa');
}
function exceptionCounter(day) {
    const exc = exceptionsByDay.value[day];
    if (!exc)
        return null;
    return 1 + exceptionsList.value.indexOf(exc);
}
function parseTimeRange(day) {
    const start = p.value[`hours_${day}_start`];
    const end = p.value[`hours_${day}_end`];
    const counter = exceptionCounter(day);
    let val;
    if (start && end) {
        val = parseTime(start) + ' - ' + parseTime(end);
    }
    else {
        val = t('closed');
    }
    if (counter)
        val += '*'.repeat(counter);
    return val;
}
function parseException(exception, index) {
    const stars = '*'.repeat(index);
    const msgs = messages.value[locale.value];
    const translated = msgs?.exceptions?.[exception];
    return stars + ' ' + (translated ?? exception);
}
// --- Tests ---
const tests = computed(() => {
    const fields = ['blood', 'sti', 'covid', 'mammo', 'xray'];
    return fields.filter((f) => p.value[`tests_${f}`] === 'Yes');
});
// --- Languages ---
const languagesSpoken = computed(() => {
    if (!p.value.language)
        return [];
    return p.value.language.split(',').map((s) => s.trim());
});
function translateLanguage(lang) {
    const msgs = messages.value[locale.value];
    return msgs?.languages?.[lang.toLowerCase()] ?? lang;
}
function translateWarning(warning) {
    const msgs = messages.value[locale.value];
    return msgs?.warnings?.[warning] ?? warning;
}
// --- Transit helpers ---
function translateTransitList(raw, category) {
    if (!raw)
        return '';
    const msgs = messages.value[locale.value];
    const translations = msgs?.transit?.[category];
    return raw
        .split(',')
        .map((s) => {
        const key = s.trim();
        return translations?.[key] ?? key;
    })
        .join(', ');
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
/** @type {__VLS_StyleScopedClasses['detail-header']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "location-detail content" },
});
/** @type {__VLS_StyleScopedClasses['location-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "detail-header" },
});
/** @type {__VLS_StyleScopedClasses['detail-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.siteName());
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "detail-body" },
});
/** @type {__VLS_StyleScopedClasses['detail-body']} */ ;
if (__VLS_ctx.p.optional_info_general) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "warning-callout" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-callout']} */ ;
    (__VLS_ctx.translateWarning(__VLS_ctx.p.optional_info_general));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "contact-section" },
});
/** @type {__VLS_StyleScopedClasses['contact-section']} */ ;
if (__VLS_ctx.p.address) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "contact-row" },
    });
    /** @type {__VLS_StyleScopedClasses['contact-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "contact-label" },
    });
    /** @type {__VLS_StyleScopedClasses['contact-label']} */ ;
    (__VLS_ctx.fullAddress);
}
if (__VLS_ctx.p.website) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "contact-row" },
    });
    /** @type {__VLS_StyleScopedClasses['contact-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
        href: (__VLS_ctx.p.website),
        target: "_blank",
    });
    (__VLS_ctx.p.website);
}
if (__VLS_ctx.p.med_phone_num) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "contact-row" },
    });
    /** @type {__VLS_StyleScopedClasses['contact-row']} */ ;
    (__VLS_ctx.p.med_phone_num);
}
if (__VLS_ctx.p.transport_bus ||
    __VLS_ctx.p.transport_subway ||
    __VLS_ctx.p.transport_train ||
    __VLS_ctx.p.transport_trolley ||
    __VLS_ctx.p.transport_parking) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "transit-section" },
    });
    /** @type {__VLS_StyleScopedClasses['transit-section']} */ ;
    if (__VLS_ctx.p.transport_bus) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.$t('transit.bus'));
        (__VLS_ctx.p.transport_bus);
    }
    if (__VLS_ctx.p.transport_subway) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.$t('transit.subway.label'));
        (__VLS_ctx.translateTransitList(__VLS_ctx.p.transport_subway, 'subway'));
    }
    if (__VLS_ctx.p.transport_train) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.$t('transit.regRail.label'));
        (__VLS_ctx.translateTransitList(__VLS_ctx.p.transport_train, 'regRail'));
    }
    if (__VLS_ctx.p.transport_trolley) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.$t('transit.trolley'));
        (__VLS_ctx.p.transport_trolley);
    }
    if (__VLS_ctx.p.transport_parking) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.$t('transit.car.label'));
        (__VLS_ctx.translateTransitList(__VLS_ctx.p.transport_parking, 'car'));
    }
}
if (__VLS_ctx.languagesSpoken.length) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.$t('languagesSpoken'));
    (__VLS_ctx.languagesSpoken.map(__VLS_ctx.translateLanguage).join(', '));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.$t('ageSpecificServices'));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
(__VLS_ctx.$t('cards.table1Intro'));
if (__VLS_ctx.ageSpecificServices.length) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "data-table" },
    });
    /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    (__VLS_ctx.$t('service'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "center" },
    });
    /** @type {__VLS_StyleScopedClasses['center']} */ ;
    (__VLS_ctx.$t('ageRange.adult'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "center" },
    });
    /** @type {__VLS_StyleScopedClasses['center']} */ ;
    (__VLS_ctx.$t('ageRange.child'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "center" },
    });
    /** @type {__VLS_StyleScopedClasses['center']} */ ;
    (__VLS_ctx.$t('patientType.patient_type_existing_only'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [row] of __VLS_vFor((__VLS_ctx.ageSpecificServices))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (row.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.$t(row.service));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "center" },
        });
        /** @type {__VLS_StyleScopedClasses['center']} */ ;
        (__VLS_ctx.YES_VALUES.includes(row.adult ?? '') ? '✓' : '');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "center" },
        });
        /** @type {__VLS_StyleScopedClasses['center']} */ ;
        (__VLS_ctx.YES_VALUES.includes(row.child ?? '') ? '✓' : '');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "center" },
        });
        /** @type {__VLS_StyleScopedClasses['center']} */ ;
        (row.existing.includes('Established Patients') ? '✓' : '');
        // @ts-ignore
        [siteName, p, p, p, p, p, p, p, p, p, p, p, p, p, p, p, p, p, p, p, p, p, p, p, translateWarning, fullAddress, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, translateTransitList, translateTransitList, translateTransitList, languagesSpoken, languagesSpoken, translateLanguage, ageSpecificServices, ageSpecificServices, YES_VALUES, YES_VALUES,];
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.$t('tableNoData.noSpecializedServices'));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.$t('otherServices'));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
(__VLS_ctx.$t('cards.table2Intro'));
if (__VLS_ctx.otherServices.length) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "data-table" },
    });
    /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    (__VLS_ctx.$t('service'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "center" },
    });
    /** @type {__VLS_StyleScopedClasses['center']} */ ;
    (__VLS_ctx.$t('patientType.patient_type_new'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "center" },
    });
    /** @type {__VLS_StyleScopedClasses['center']} */ ;
    (__VLS_ctx.$t('patientType.patient_type_existing'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [row] of __VLS_vFor((__VLS_ctx.otherServices))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (row.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.$t(row.service));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "center" },
        });
        /** @type {__VLS_StyleScopedClasses['center']} */ ;
        (row.value === 'Yes' ? '✓' : '');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "center" },
        });
        /** @type {__VLS_StyleScopedClasses['center']} */ ;
        (__VLS_ctx.YES_VALUES.includes(row.value ?? '') ? '✓' : '');
        // @ts-ignore
        [$t, $t, $t, $t, $t, $t, $t, YES_VALUES, otherServices, otherServices,];
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.$t('tableNoData.noOtherServices'));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.$t('hours'));
__VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
    ...{ class: "data-table" },
});
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
(__VLS_ctx.$t('daysOfTheWeek'));
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
(__VLS_ctx.$t('schedule'));
__VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
for (const [day] of __VLS_vFor((__VLS_ctx.DAYS))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        key: (day),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (__VLS_ctx.$t(__VLS_ctx.DAY_I18N_KEYS[day]));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (__VLS_ctx.parseTimeRange(day));
    // @ts-ignore
    [$t, $t, $t, $t, $t, DAYS, DAY_I18N_KEYS, parseTimeRange,];
}
if (__VLS_ctx.exceptionsList.length) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "exceptions" },
    });
    /** @type {__VLS_StyleScopedClasses['exceptions']} */ ;
    for (const [exc, i] of __VLS_vFor((__VLS_ctx.exceptionsList))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (i),
        });
        (__VLS_ctx.parseException(exc, i + 1));
        // @ts-ignore
        [exceptionsList, exceptionsList, parseException,];
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.$t('tests.category'));
if (__VLS_ctx.tests.length) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
    for (const [test] of __VLS_vFor((__VLS_ctx.tests))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (test),
        });
        (__VLS_ctx.$t(`tests.${test}`));
        // @ts-ignore
        [$t, $t, tests, tests,];
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.$t('tests.noTests'));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.$t('slidingScale'));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
(__VLS_ctx.$t('slidingScaleExplanation'));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
(__VLS_ctx.p.sliding_scale ?? __VLS_ctx.$t('slidingScaleNull'));
// @ts-ignore
[p, $t, $t, $t, $t,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
