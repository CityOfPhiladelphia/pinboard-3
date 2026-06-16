import { createI18n } from 'vue-i18n'
import { pinboardMessages, mergeDeep } from '@pinboard/ui'
import en from './en'
import es from './es'
import ch from './ch'
import vi from './vi'
import ru from './ru'
import fr from './fr'
import ar from './ar'
import pt from './pt'
import ht from './ht'
import sw from './sw'

const appMessages = { en, es, ch, vi, ru, fr, ar, pt, ht, sw }
const messages = mergeDeep(pinboardMessages, appMessages)

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
})

export default i18n
