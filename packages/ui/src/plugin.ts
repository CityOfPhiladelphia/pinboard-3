// packages/ui/src/plugin.ts
import type { Plugin, InjectionKey } from 'vue'
import type { PinboardConfig } from './types'

export const PINBOARD_CONFIG_KEY: InjectionKey<PinboardConfig> = Symbol('pinboard-config')

export function createPinboard(config: PinboardConfig): Plugin {
  return {
    install(app) {
      app.provide(PINBOARD_CONFIG_KEY, config)
    },
  }
}
