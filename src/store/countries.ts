import { defineStore } from 'pinia';

// 国データの型定義
export interface Country {
  id: string;
  name: string;
  capital: string | string[];
  continent: string;
  flag_image_url: string;
  map_image_url: string;
  description: string;
  summary: string;
}

export type Language = 'ja' | 'en';

export const useCountriesStore = defineStore('countries', {
  state: () => ({
    countries: [] as Country[],
    loading: false,
    error: null as string | null,
    currentLanguage: 'ja' as Language, // デフォルトは日本語
  }),
  actions: {
    async fetchCountries(forceReload: boolean = false) {
      if (this.countries.length > 0 && !forceReload) {
        return; // 既に読み込み済みの場合は何もしない (強制リロードでない場合)
      }
      this.loading = true;
      this.error = null;
      try {
        const filename = `countries.${this.currentLanguage}.json`;
        const response = await fetch(`/${filename}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch countries data for ${this.currentLanguage}`);
        }
        const data = await response.json();
        this.countries = data;
      } catch (e: any) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
    setLanguage(lang: Language) {
      if (this.currentLanguage !== lang) {
        this.currentLanguage = lang;
        this.fetchCountries(true); // 言語が変わったら強制的に再読み込み
      }
    },
  },
  getters: {
    getCountryById: (state) => (id: string) => {
      return state.countries.find(country => country.id === id);
    },
    // クイズ用のランダムな国リストを取得するゲッター
    getRandomCountries: (state) => (count: number, excludeId?: string) => {
      const filteredCountries = excludeId 
        ? state.countries.filter(c => c.id !== excludeId)
        : state.countries;
      const shuffled = [...filteredCountries].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    },
  },
});
