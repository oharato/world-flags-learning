import { ref } from 'vue';
import { useCountriesStore } from '../store/countries';

export function useCountryNameMap() {
  const countriesStore = useCountriesStore();
  const countryNameMap = ref<Map<string, string>>(new Map());
  const isLoaded = ref(false);

  const loadCountryNameMap = async (geoJsonCountryNames: string[]) => {
    if (isLoaded.value) return;

    // Load localized country names
    await countriesStore.fetchCountries();

    // Create mapping from English names (in countries.en.json) to current locale names
    const enResponse = await fetch('/countries.en.json');
    if (enResponse.ok) {
      const enData = await enResponse.json();

      // Map GeoJSON names to localized names
      for (const geoName of geoJsonCountryNames) {
        const localizedCountry = countriesStore.countries.find((c) => {
          const enCountry = enData.find(
            (en: any) =>
              en.name.toLowerCase() === geoName.toLowerCase() ||
              en.name.toLowerCase().includes(geoName.toLowerCase()) ||
              geoName.toLowerCase().includes(en.name.toLowerCase())
          );
          return enCountry && c.id === enCountry.id;
        });

        if (localizedCountry) {
          countryNameMap.value.set(geoName, localizedCountry.name);
        }
      }
    }

    isLoaded.value = true;
  };

  const getLocalizedName = (englishName: string): string => {
    return countryNameMap.value.get(englishName) || englishName;
  };

  return {
    countryNameMap,
    isLoaded,
    loadCountryNameMap,
    getLocalizedName,
  };
}
