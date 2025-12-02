import { ref } from 'vue';
import { useCountriesStore } from '../store/countries';

export function useCountryNameMap() {
  const countriesStore = useCountriesStore();
  const countryNameMap = ref<Map<string, string>>(new Map());
  const lookupData = ref<Record<string, { ja: string; en: string }> | null>(null);
  const isLoaded = ref(false);

  const loadCountryNameMap = async (_geoJsonCountryNames: string[]) => {
    if (isLoaded.value) return;

    try {
      // Load the pre-generated country name lookup
      const lookupResponse = await fetch('/country-names-lookup.json');
      if (lookupResponse.ok) {
        lookupData.value = await lookupResponse.json();

        // Map GeoJSON names to localized names based on current language
        for (const [geoName, names] of Object.entries(lookupData.value!)) {
          const localizedName = countriesStore.currentLanguage === 'ja' ? names.ja : names.en;
          countryNameMap.value.set(geoName, localizedName);
        }
      }
    } catch (error) {
      console.warn('Failed to load country names lookup:', error);
    }

    isLoaded.value = true;
  };

  const getLocalizedName = (englishName: string): string => {
    return countryNameMap.value.get(englishName) || englishName;
  };

  // Get the English name from a GeoJSON name (uses cached data if available)
  const getEnglishName = (geoJsonName: string): string => {
    if (lookupData.value) {
      return lookupData.value[geoJsonName]?.en || geoJsonName;
    }
    return geoJsonName;
  };

  return {
    countryNameMap,
    isLoaded,
    loadCountryNameMap,
    getLocalizedName,
    getEnglishName,
  };
}
