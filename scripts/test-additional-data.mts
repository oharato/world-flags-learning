import wiki from 'wikijs';
import fetch from 'node-fetch';

/**
 * テストスクリプト: continent, map_image_url, description の取得方法を調査
 */

// wikijs の型定義
interface WikiPage {
  fullInfo(): Promise<any>;
  categories(): Promise<string[]>;
  summary(): Promise<string>;
  sections(): Promise<Array<{ title: string; level: number }>>;
  section(title: string): Promise<string>;
  content(): Promise<string | string[]>;
}

interface WikiInstance {
  page(title: string): Promise<WikiPage>;
}

interface TestResult {
  country: string;
  lang: string;
  continent?: string;
  mapImageUrl?: string;
  description?: string;
  method: string;
  success: boolean;
  error?: string;
}

// 大陸を取得する関数（複数の方法を試す）
const getContinentData = async (countryName: string, lang: 'ja' | 'en'): Promise<TestResult> => {
  const apiUrl = lang === 'ja' ? 'https://ja.wikipedia.org/w/api.php' : 'https://en.wikipedia.org/w/api.php';
  const result: TestResult = {
    country: countryName,
    lang,
    method: '',
    success: false,
  };

  try {
    // 方法1: Wikidataから取得
    const wikiInstance = wiki({ apiUrl }) as unknown as WikiInstance;
    const page = await wikiInstance.page(countryName);
    
    // ページのWikidata IDを取得
    const pageInfo = await page.fullInfo();
    console.log(`\n=== ${countryName} (${lang}) - fullInfo ===`);
    console.log(JSON.stringify(pageInfo, null, 2).substring(0, 500));

    // 方法2: カテゴリから大陸を推測
    try {
      const categories = await page.categories();
      console.log(`\n=== Categories ===`);
      console.log(categories.slice(0, 10));
      
      // 大陸名を含むカテゴリを探す
      const continents = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica'];
      const continentsJa = ['アフリカ', 'アジア', 'ヨーロッパ', '北アメリカ', '南アメリカ', 'オセアニア', '南極'];
      
      for (const cat of categories) {
        for (const continent of lang === 'en' ? continents : continentsJa) {
          if (cat.toLowerCase().includes(continent.toLowerCase())) {
            result.continent = continent;
            result.method = 'categories';
            result.success = true;
            break;
          }
        }
        if (result.continent) break;
      }
    } catch (e: any) {
      console.warn(`Error getting categories: ${e.message}`);
    }

    // 方法3: infoboxから地図画像を取得
    try {
      const infoboxUrl = `${apiUrl}?action=parse&page=${encodeURIComponent(countryName)}&prop=text&format=json&origin=*`;
      const response = await fetch(infoboxUrl);
      const data: any = await response.json();
      
      if (data.parse && data.parse.text) {
        const htmlText = data.parse.text['*'];
        
        // 地図画像を抽出（orthographic projection または location map）
        const mapRegex = /(orthographic|location|locator).*?\.(?:svg|png)/i;
        const mapMatch = htmlText.match(mapRegex);
        if (mapMatch) {
          result.mapImageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${mapMatch[0].replace(/ /g, '_')}`;
          console.log(`\nFound map image: ${mapMatch[0]}`);
        }

        // HTML内の地図画像URLを直接探す
        const imgRegex = /upload\.wikimedia\.org\/wikipedia\/commons\/[^"']+\.(svg|png)/gi;
        const imgMatches = htmlText.match(imgRegex);
        if (imgMatches) {
          console.log(`\nFound ${imgMatches.length} image URLs`);
          const mapImages = imgMatches.filter((url: string) => 
            url.toLowerCase().includes('location') || 
            url.toLowerCase().includes('orthographic') ||
            url.toLowerCase().includes('map')
          );
          if (mapImages.length > 0) {
            result.mapImageUrl = `https://${mapImages[0]}`;
            console.log(`Selected map: ${result.mapImageUrl}`);
          }
        }
      }
    } catch (e: any) {
      result.error = `Error getting map: ${e.message}`;
    }

  } catch (e: any) {
    result.error = e.message;
  }

  return result;
};

// 国旗の説明を取得する関数
const getFlagDescription = async (countryName: string, lang: 'ja' | 'en'): Promise<string> => {
  const apiUrl = lang === 'ja' ? 'https://ja.wikipedia.org/w/api.php' : 'https://en.wikipedia.org/w/api.php';
  
  try {
    const wikiInstance = wiki({ apiUrl }) as unknown as WikiInstance;
    const page = await wikiInstance.page(countryName);
    
    // 方法1: 国旗専用ページを探す
    const flagPageName = lang === 'ja' 
      ? `${countryName}の国旗`
      : `Flag of ${countryName}`;
    
    try {
      console.log(`\nTrying to find flag page: ${flagPageName}`);
      const flagPage = await wikiInstance.page(flagPageName);
      const summary = await flagPage.summary();
      console.log(`✓ Found flag page summary (${summary.length} chars)`);
      return summary.substring(0, 500);
    } catch (e) {
      console.log(`✗ Flag page not found: ${flagPageName}`);
    }

    // 方法2: メインページのセクションから取得
    try {
      const sections = await page.sections();
      console.log(`\nSections found: ${sections.map((s: { title: string }) => s.title).join(', ')}`);
      
      const flagSectionNames = lang === 'ja' 
        ? ['国旗', '旗', 'シンボル', '国章']
        : ['flag', 'national symbols', 'symbols'];
      
      for (const sectionName of flagSectionNames) {
        const flagSection = sections.find((s: { title: string }) =>
          s.title.toLowerCase().includes(sectionName.toLowerCase())
        );
        
        if (flagSection) {
          console.log(`✓ Found section: ${flagSection.title}`);
          const content = await page.section(flagSection.title);
          if (content && content.length > 50) {
            return content.substring(0, 500);
          }
        }
      }
    } catch (e: any) {
      console.log(`✗ Error getting sections: ${e.message}`);
    }

    // 方法3: 本文から国旗に関する記述を抽出
    try {
      const content = await page.content();
      if (typeof content === 'string') {
        const flagRegex = lang === 'ja'
          ? /国旗[はわ].*?[。]/g
          : /flag\s+(?:is|consists|features).*?\./gi;
        const matches = content.match(flagRegex);
        if (matches && matches.length > 0) {
          console.log(`✓ Found flag description in content`);
          return matches.slice(0, 3).join(' ').substring(0, 500);
        }
      }
    } catch (e: any) {
      console.log(`✗ Error getting content: ${e.message}`);
    }

  } catch (e: any) {
    console.log(`✗ Error: ${e.message}`);
  }

  return '';
};

// WikidataからContinentを取得
const getContinentFromWikidata = async (countryName: string): Promise<string> => {
  try {
    // WikipediaページからWikidata IDを取得
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(countryName)}&prop=pageprops&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    const searchData: any = await searchRes.json();
    
    const pages = searchData.query.pages;
    const pageId = Object.keys(pages)[0];
    const wikidataId = pages[pageId]?.pageprops?.wikibase_item;
    
    if (!wikidataId) {
      console.log('✗ No Wikidata ID found');
      return '';
    }

    console.log(`\n✓ Wikidata ID: ${wikidataId}`);

    // Wikidataから大陸情報を取得 (P30 = continent)
    const wikidataUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wikidataId}&props=claims&format=json&origin=*`;
    const wikidataRes = await fetch(wikidataUrl);
    const wikidataData: any = await wikidataRes.json();
    
    const claims = wikidataData.entities[wikidataId]?.claims;
    if (claims && claims.P30) {
      const continentId = claims.P30[0]?.mainsnak?.datavalue?.value?.id;
      console.log(`✓ Continent Wikidata ID: ${continentId}`);
      
      // 大陸のIDを名前に変換
      const continentMap: Record<string, string> = {
        'Q15': 'Africa',
        'Q48': 'Asia',
        'Q46': 'Europe',
        'Q49': 'North America',
        'Q18': 'South America',
        'Q538': 'Oceania',
        'Q51': 'Antarctica',
      };
      
      return continentMap[continentId] || '';
    }
  } catch (e: any) {
    console.log(`✗ Error getting Wikidata: ${e.message}`);
  }
  
  return '';
};

// メインのテスト実行
const main = async () => {
  const testCountries = [
    { name: 'Japan', nameJa: '日本' },
    { name: 'Austria', nameJa: 'オーストリア' },
    { name: 'Brazil', nameJa: 'ブラジル' },
  ];

  for (const country of testCountries) {
    console.log('\n\n========================================');
    console.log(`Testing: ${country.name} / ${country.nameJa}`);
    console.log('========================================');

    // 英語版でテスト
    console.log('\n--- English Version ---');
    const resultEn = await getContinentData(country.name, 'en');
    console.log('Result:', resultEn);

    // Wikidataから大陸を取得
    const continent = await getContinentFromWikidata(country.name);
    if (continent) {
      console.log(`✓ Continent from Wikidata: ${continent}`);
    }

    // 国旗の説明を取得
    console.log('\n--- Flag Description (English) ---');
    const descEn = await getFlagDescription(country.name, 'en');
    console.log(`Description length: ${descEn.length}`);
    if (descEn) {
      console.log(`Preview: ${descEn.substring(0, 200)}...`);
    }

    // 日本語版でテスト
    console.log('\n--- Japanese Version ---');
    const resultJa = await getContinentData(country.nameJa, 'ja');
    console.log('Result:', resultJa);

    console.log('\n--- Flag Description (Japanese) ---');
    const descJa = await getFlagDescription(country.nameJa, 'ja');
    console.log(`Description length: ${descJa.length}`);
    if (descJa) {
      console.log(`Preview: ${descJa.substring(0, 200)}...`);
    }

    // 待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n========================================');
  console.log('Test Complete');
  console.log('========================================');
  console.log('\nSummary:');
  console.log('- Continent: Best source is Wikidata (P30 property)');
  console.log('- Map Image: Can be extracted from infobox HTML');
  console.log('- Description: Can be obtained from dedicated flag pages or sections');
};

main();
