import type { Country } from '../../store/countries';

export const mockCountries: Country[] = [
  {
    id: 'jp',
    name: '日本',
    capital: '東京',
    continent: 'Asia',
    flag_image_url: '/flags/jp.svg',
    map_image_url: '/maps/jp.svg',
    description: '日の丸の説明',
    summary: '日本の概要',
  },
  {
    id: 'us',
    name: 'アメリカ合衆国',
    capital: 'ワシントンD.C.',
    continent: 'North America',
    flag_image_url: '/flags/us.svg',
    map_image_url: '/maps/us.svg',
    description: '星条旗の説明',
    summary: 'アメリカの概要',
  },
  {
    id: 'uk',
    name: 'イギリス',
    capital: 'ロンドン',
    continent: 'Europe',
    flag_image_url: '/flags/uk.svg',
    map_image_url: '/maps/uk.svg',
    description: 'ユニオンジャックの説明',
    summary: 'イギリスの概要',
  },
];
