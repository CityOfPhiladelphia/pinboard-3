import type { InjectionKey, Ref } from 'vue'
import type { PinboardConfig } from './types'

export const PINBOARD_CONFIG_KEY: InjectionKey<PinboardConfig> = Symbol('pinboard-config')
export const IS_MOBILE_KEY: InjectionKey<Ref<boolean>> = Symbol('is-mobile')
