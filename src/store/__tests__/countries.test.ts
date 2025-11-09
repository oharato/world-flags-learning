import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCountriesStore } from '../countries';

globalThis.fetch = vi.fn() as any;

describe('Countries Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('初期状態が正しく設定されている', () => {
    const store = useCountriesStore();
    
    expect(store.countries).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBe(null);
    expect(store.currentLanguage).toBe('ja');
  });

  it('fetchCountries で日本語の国データを正常に取得できる', async () => {
    const mockCountries = [
      { id: 'jp', name: '日本', capital: '東京', continent: 'アジア', flag_image_url: '/flags/jp.svg', map_image_url: '/maps/jp.svg', description: '説明', summary: '概要' },
      { id: 'us', name: 'アメリカ合衆国', capital: 'ワシントンD.C.', continent: '北アメリカ', flag_image_url: '/flags/us.svg', map_image_url: '/maps/us.svg', description: '説明', summary: '概要' },
    ];

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountries,
    });

    const store = useCountriesStore();
    await store.fetchCountries();

    expect(store.countries).toEqual(mockCountries);
    expect(store.loading).toBe(false);
    expect(store.error).toBe(null);
    expect(globalThis.fetch).toHaveBeenCalledWith('/countries.ja.json');
  });

  it('fetchCountries で英語の国データを正常に取得できる', async () => {
    const mockCountries = [
      { id: 'jp', name: 'Japan', capital: 'Tokyo', continent: 'Asia', flag_image_url: '/flags/jp.svg', map_image_url: '/maps/jp.svg', description: 'Description', summary: 'Summary' },
    ];

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountries,
    });

    const store = useCountriesStore();
    store.currentLanguage = 'en';
    await store.fetchCountries();

    expect(store.countries).toEqual(mockCountries);
    expect(globalThis.fetch).toHaveBeenCalledWith('/countries.en.json');
  });

  it('fetchCountries でエラーが発生した場合、エラーメッセージが設定される', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    const store = useCountriesStore();
    await store.fetchCountries();

    expect(store.error).toBe('Failed to fetch countries data for ja');
    expect(store.loading).toBe(false);
  });

  it('fetchCountries でネットワークエラーが発生した場合、エラーメッセージが設定される', async () => {
    (globalThis.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const store = useCountriesStore();
    await store.fetchCountries();

    expect(store.error).toBe('Network error');
    expect(store.loading).toBe(false);
  });

  it('既にデータがある場合、forceReload=false では再取得しない', async () => {
    const store = useCountriesStore();
    store.countries = [
      { id: 'jp', name: '日本', capital: '東京', continent: 'アジア', flag_image_url: '/flags/jp.svg', map_image_url: '/maps/jp.svg', description: '説明', summary: '概要' },
    ];

    await store.fetchCountries(false);

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('forceReload=true の場合、既にデータがあっても再取得する', async () => {
    const mockCountries = [
      { id: 'us', name: 'アメリカ合衆国', capital: 'ワシントンD.C.', continent: '北アメリカ', flag_image_url: '/flags/us.svg', map_image_url: '/maps/us.svg', description: '説明', summary: '概要' },
    ];

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountries,
    });

    const store = useCountriesStore();
    store.countries = [
      { id: 'jp', name: '日本', capital: '東京', continent: 'アジア', flag_image_url: '/flags/jp.svg', map_image_url: '/maps/jp.svg', description: '説明', summary: '概要' },
    ];

    await store.fetchCountries(true);

    expect(globalThis.fetch).toHaveBeenCalled();
    expect(store.countries).toEqual(mockCountries);
  });

  it('setLanguage で言語を変更すると、データが再取得される', async () => {
    const mockCountries = [
      { id: 'jp', name: 'Japan', capital: 'Tokyo', continent: 'Asia', flag_image_url: '/flags/jp.svg', map_image_url: '/maps/jp.svg', description: 'Description', summary: 'Summary' },
    ];

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountries,
    });

    const store = useCountriesStore();
    store.currentLanguage = 'ja';
    store.setLanguage('en');

    await vi.waitFor(() => {
      expect(store.currentLanguage).toBe('en');
      expect(globalThis.fetch).toHaveBeenCalledWith('/countries.en.json');
    });
  });

  it('setLanguage で同じ言語を設定しても再取得しない', async () => {
    const store = useCountriesStore();
    store.currentLanguage = 'ja';
    store.setLanguage('ja');

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('getCountryById で指定したIDの国を取得できる', () => {
    const store = useCountriesStore();
    store.countries = [
      { id: 'jp', name: '日本', capital: '東京', continent: 'アジア', flag_image_url: '/flags/jp.svg', map_image_url: '/maps/jp.svg', description: '説明', summary: '概要' },
      { id: 'us', name: 'アメリカ合衆国', capital: 'ワシントンD.C.', continent: '北アメリカ', flag_image_url: '/flags/us.svg', map_image_url: '/maps/us.svg', description: '説明', summary: '概要' },
    ];

    const country = store.getCountryById('jp');
    expect(country?.name).toBe('日本');
  });

  it('getCountryById で存在しないIDを指定するとundefinedが返る', () => {
    const store = useCountriesStore();
    store.countries = [
      { id: 'jp', name: '日本', capital: '東京', continent: 'アジア', flag_image_url: '/flags/jp.svg', map_image_url: '/maps/jp.svg', description: '説明', summary: '概要' },
    ];

    const country = store.getCountryById('invalid');
    expect(country).toBeUndefined();
  });

  it('getRandomCountries で指定した数のランダムな国を取得できる', () => {
    const store = useCountriesStore();
    store.countries = [
      { id: 'jp', name: '日本', capital: '東京', continent: 'アジア', flag_image_url: '/flags/jp.svg', map_image_url: '/maps/jp.svg', description: '説明', summary: '概要' },
      { id: 'us', name: 'アメリカ合衆国', capital: 'ワシントンD.C.', continent: '北アメリカ', flag_image_url: '/flags/us.svg', map_image_url: '/maps/us.svg', description: '説明', summary: '概要' },
      { id: 'uk', name: 'イギリス', capital: 'ロンドン', continent: 'ヨーロッパ', flag_image_url: '/flags/uk.svg', map_image_url: '/maps/uk.svg', description: '説明', summary: '概要' },
      { id: 'fr', name: 'フランス', capital: 'パリ', continent: 'ヨーロッパ', flag_image_url: '/flags/fr.svg', map_image_url: '/maps/fr.svg', description: '説明', summary: '概要' },
    ];

    const randomCountries = store.getRandomCountries(2);
    expect(randomCountries.length).toBe(2);
  });

  it('getRandomCountries で excludeId を指定すると、その国が除外される', () => {
    const store = useCountriesStore();
    store.countries = [
      { id: 'jp', name: '日本', capital: '東京', continent: 'アジア', flag_image_url: '/flags/jp.svg', map_image_url: '/maps/jp.svg', description: '説明', summary: '概要' },
      { id: 'us', name: 'アメリカ合衆国', capital: 'ワシントンD.C.', continent: '北アメリカ', flag_image_url: '/flags/us.svg', map_image_url: '/maps/us.svg', description: '説明', summary: '概要' },
      { id: 'uk', name: 'イギリス', capital: 'ロンドン', continent: 'ヨーロッパ', flag_image_url: '/flags/uk.svg', map_image_url: '/maps/uk.svg', description: '説明', summary: '概要' },
    ];

    const randomCountries = store.getRandomCountries(3, 'jp');
    expect(randomCountries.every(c => c.id !== 'jp')).toBe(true);
    expect(randomCountries.length).toBe(2); // 除外後は2つ
  });

  it('複数の首都を持つ国のデータも正しく扱える', async () => {
    const mockCountries = [
      { id: 'za', name: '南アフリカ', capital: ['プレトリア', 'ケープタウン', 'ブルームフォンテーン'], continent: 'アフリカ', flag_image_url: '/flags/za.svg', map_image_url: '/maps/za.svg', description: '説明', summary: '概要' },
    ];

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountries,
    });

    const store = useCountriesStore();
    await store.fetchCountries();

    expect(store.countries.length).toBe(1);
    expect(store.countries[0]!.capital).toEqual(['プレトリア', 'ケープタウン', 'ブルームフォンテーン']);
  });
});
