// packages/ui/src/plugin.ts
import type { Plugin } from 'vue'
import type { PinboardConfig } from './types'
import { PINBOARD_CONFIG_KEY } from './types'

export function createPinboard(config: PinboardConfig): Plugin {
  return {
    install(app) {
      app.provide(PINBOARD_CONFIG_KEY, config)
    },
  }
}
