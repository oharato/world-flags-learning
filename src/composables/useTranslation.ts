import { computed } from 'vue';
import { type Translations, translations } from '../i18n/translations';
import { useCountriesStore } from '../store/countries';

export function useTranslation() {
  const countriesStore = useCountriesStore();

  const t = computed<Translations>(() => {
    return translations[countriesStore.currentLanguage];
  });

  return { t };
}
