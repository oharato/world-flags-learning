import { ref } from 'vue';
import { useCountriesStore } from '../store/countries';

export function useCountryNameMap() {
  const countriesStore = useCountriesStore();
  const countryNameMap = ref<Map<string, string>>(new Map());
  const isLoaded = ref(false);

  const loadCountryNameMap = async (_geoJsonCountryNames: string[]) => {
    if (isLoaded.value) return;

    try {
      // Load the pre-generated country name lookup
      const lookupResponse = await fetch('/country-names-lookup.json');
      if (lookupResponse.ok) {
        const lookup: Record<string, { ja: string; en: string }> = await lookupResponse.json();

        // Map GeoJSON names to localized names based on current language
        for (const [geoName, names] of Object.entries(lookup)) {
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

  // Get the English name from a GeoJSON name
  const getEnglishName = async (geoJsonName: string): Promise<string> => {
    try {
      const lookupResponse = await fetch('/country-names-lookup.json');
      if (lookupResponse.ok) {
        const lookup: Record<string, { ja: string; en: string }> = await lookupResponse.json();
        return lookup[geoJsonName]?.en || geoJsonName;
      }
    } catch (error) {
      console.warn('Failed to get English name:', error);
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
