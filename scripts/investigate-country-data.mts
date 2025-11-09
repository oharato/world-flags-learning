import wiki from 'wikijs';
import fetch from 'node-fetch';
import fs from 'fs/promises'; // fs/promisesをインポート

// 調査対象の国
const testCountries = [
  { nameJa: '日本', nameEn: 'Japan' },
  { nameJa: 'アメリカ合衆国', nameEn: 'United States' },
  { nameJa: 'モナコ', nameEn: 'Monaco' }, // descriptionで問題があった国
  { nameJa: 'オーストリア', nameEn: 'Austria' }, // infoで問題があった国
  { nameJa: '中央アフリカ共和国', nameEn: 'Central African Republic' }, // infoで問題があった国
  { nameJa: 'バーレーン', nameEn: 'Bahrain' }, // socket hang upエラーがあった国
  { nameJa: 'ミャンマー', nameEn: 'Myanmar' }, // infoで問題があった国
  { nameJa: 'モロッコ', nameEn: 'Morocco' }, // infoで問題があった国
];

const investigateCountry = async (country: { nameJa: string; nameEn: string }) => {
  console.log(`\n--- Investigating ${country.nameJa} (${country.nameEn}) ---`);

  // --- 大陸情報の調査 (REST Countries API) ---
  console.log('1. Investigating Continent (REST Countries API)...');
  let cca2 = '';
  try {
    const restCountriesResponse = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(country.nameEn)}?fields=region,subregion,cca2`);
    const restCountriesData = await restCountriesResponse.json();
    if (restCountriesData && restCountriesData.length > 0) {
      console.log(`   - Region: ${restCountriesData[0].region}`);
      console.log(`   - Subregion: ${restCountriesData[0].subregion}`);
      console.log(`   - CCA2 (ISO 3166-1 alpha-2): ${restCountriesData[0].cca2}`);
      cca2 = restCountriesData[0].cca2;
    } else {
      console.log('   - No data found from REST Countries API.');
    }
  } catch (error: any) {
    console.error('   - Error fetching from REST Countries API (Continent):', error.message);
  }

  // --- 地図画像URLの調査 (REST Countries API & wikijs) ---
  console.log('2. Investigating Map Image URL...');
  try {
    const restCountriesResponse = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(country.nameEn)}?fields=maps`);
    const restCountriesData = await restCountriesResponse.json();
    if (restCountriesData && restCountriesData.length > 0 && restCountriesData[0].maps) {
      console.log(`   - Google Maps: ${restCountriesData[0].maps.googleMaps}`);
      console.log(`   - OpenStreetMaps: ${restCountriesData[0].maps.openStreetMaps}`);
    } else {
      console.log('   - No map data found from REST Countries API.');
    }

    // wikijsで地図画像を検索 (英語版)
    const wikiEn = wiki({ apiUrl: 'https://en.wikipedia.org/w/api.php' });
    const pageEn = await wikiEn.page(country.nameEn);
    const images = await pageEn.images();
    const mapImages = images.filter((img: string) => img.toLowerCase().includes('map') || img.toLowerCase().includes('location'));
    console.log(`   - wikijs (en) found ${mapImages.length} map/location images.`);
    if (mapImages.length > 0) {
      console.log('     - First map image:', mapImages[0]);
    }
  } catch (error: any) {
    console.error('   - Error investigating map images:', error.message);
  }

  // --- description (国旗の成り立ち) の調査 (wikijs) ---
  console.log('3. Investigating Description (Flag sections from wikijs)...');
  try {
    const wikiEn = wiki({ apiUrl: 'https://en.wikipedia.org/w/api.php' });
    const pageEn = await wikiEn.page(country.nameEn);
    const sections = await pageEn.sections();
    
    console.log('   - Available sections (en):');
    sections.forEach(s => console.log(`     - ${s.title} (Level: ${s.level})`));

    const potentialFlagSections = sections.filter(s => 
      s.title.toLowerCase().includes('flag') || 
      s.title.toLowerCase().includes('design') || 
      s.title.toLowerCase().includes('symbolism') ||
      s.title.toLowerCase().includes('history')
    );

    if (potentialFlagSections.length > 0) {
      console.log('   - Potential flag-related sections (en):');
      for (const s of potentialFlagSections) {
        try {
          const content = await pageEn.section(s.title);
          console.log(`     - Section "${s.title}" content (first 100 chars):`, content.substring(0, Math.min(content.length, 100)) + '...');
        } catch (e: any) {
          console.warn(`     - Error getting content for section "${s.title}":`, e.message);
        }
      }
    } else {
      console.log('   - No obvious flag-related sections found (en).');
    }
  } catch (error: any) {
    console.error('   - Error investigating description:', error.message);
  }

  // --- description (国旗の成り立ち) の調査 (日本語版 wikijs) ---
  console.log('4. Investigating Description (Flag sections from wikijs - Japanese)...');
  try {
    const wikiJa = wiki({ apiUrl: 'https://ja.wikipedia.org/w/api.php' });
    const pageJa = await wikiJa.page(country.nameJa);
    const sections = await pageJa.sections();
    
    console.log('   - Available sections (ja):');
    sections.forEach(s => console.log(`     - ${s.title} (Level: ${s.level})`));

    const potentialFlagSections = sections.filter(s => 
      s.title.includes('国旗') || 
      s.title.includes('デザイン') || 
      s.title.includes('象徴') ||
      s.title.includes('歴史')
    );

    if (potentialFlagSections.length > 0) {
      console.log('   - Potential flag-related sections (ja):');
      for (const s of potentialFlagSections) {
        try {
          const content = await pageJa.section(s.title);
          console.log(`     - Section "${s.title}" content (first 100 chars):`, content.substring(0, Math.min(content.length, 100)) + '...');
        } catch (e: any) {
          console.warn(`     - Error getting content for section "${s.title}":`, e.message);
        }
      }
    } else {
      console.log('   - No obvious flag-related sections found (ja).');
    }
  } catch (error: any) {
    console.error('   - Error investigating description (Japanese):', error.message);
  }
};

const main = async () => {
  for (const country of testCountries) {
    await investigateCountry(country);
    await new Promise(resolve => setTimeout(resolve, 1000)); // API負荷軽減
  }
  console.log('\n--- Investigation Complete ---');
};

main();
