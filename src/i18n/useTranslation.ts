import { usePreferences } from '@/context/PreferencesContext'
import translations, { RTL_LANGUAGES, type TranslationKey } from './translations'

// Falls back to English for any key not yet translated in a language —
// coverage is deliberately partial right now (see translations.ts), so a
// missing key should never render blank or crash.
export function useTranslation() {
  const { language } = usePreferences()

  function t(key: TranslationKey): string {
    return translations[language][key] ?? translations.en[key]
  }

  return { t, language, isRTL: RTL_LANGUAGES.includes(language) }
}
