import { useCountriesStore } from '../store/countries'; // 言語設定を取得するため

export function formatDateTime(isoString: string): string {
  const countriesStore = useCountriesStore();
  const date = new Date(isoString);

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // 24時間表記
  };

  if (countriesStore.currentLanguage === 'ja') {
    // 日本語の場合: タイムゾーンは東京でタイムゾーン表示なし
    options.timeZone = 'Asia/Tokyo';
    // Intl.DateTimeFormat はタイムゾーン表示なしのオプションを直接提供しないため、
    // タイムゾーンを含まない形式でフォーマットし、後で整形する
    const formatter = new Intl.DateTimeFormat('ja-JP', options);
    const parts = formatter.formatToParts(date);
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    const hour = parts.find((p) => p.type === 'hour')?.value;
    const minute = parts.find((p) => p.type === 'minute')?.value;
    const second = parts.find((p) => p.type === 'second')?.value;
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  } else {
    // 英語の場合: タイムゾーンは日本時間 (JST)
    options.timeZone = 'Asia/Tokyo';
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    const hour = parts.find((p) => p.type === 'hour')?.value;
    const minute = parts.find((p) => p.type === 'minute')?.value;
    const second = parts.find((p) => p.type === 'second')?.value;

    // YYYY-MM-DD HH:mm:ss JST の形式で返す
    return `${year}-${month}-${day} ${hour}:${minute}:${second} JST`;
  }
}
