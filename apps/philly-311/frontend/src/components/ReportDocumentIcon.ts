import { h } from 'vue'
import type { IconComponent } from '@phila/phila-ui-core/icons'
import rawSvg from '@/assets/report-document.svg?raw'

const sourceSvg = new DOMParser().parseFromString(rawSvg, 'image/svg+xml').documentElement
const sourceAttrs = Object.fromEntries(Array.from(sourceSvg.attributes, (a) => [a.name, a.value]))
const innerMarkup = sourceSvg.innerHTML

const ReportDocumentIcon: IconComponent = () => h('svg', { ...sourceAttrs, innerHTML: innerMarkup })

export default ReportDocumentIcon
