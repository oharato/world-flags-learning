import fetch from 'node-fetch';

/**
 * シンプルなテストスクリプト: continent, map_image_url, description の取得方法を調査
 */

// WikidataからContinentを取得
const getContinentFromWikidata = async (countryName: string): Promise<string> => {
  try {
    console.log(`\n[Wikidata] Getting continent for ${countryName}...`);
    
    // WikipediaページからWikidata IDを取得
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(countryName)}&prop=pageprops&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    const searchData: any = await searchRes.json();
    
    const pages = searchData.query.pages;
    const pageId = Object.keys(pages)[0];
    const wikidataId = pages[pageId]?.pageprops?.wikibase_item;
    
    if (!wikidataId) {
      console.log('  ✗ No Wikidata ID found');
      return '';
    }

    console.log(`  ✓ Wikidata ID: ${wikidataId}`);

    // Wikidataから大陸情報を取得 (P30 = continent)
    const wikidataUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wikidataId}&props=claims&format=json&origin=*`;
    const wikidataRes = await fetch(wikidataUrl);
    const wikidataData: any = await wikidataRes.json();
    
    const claims = wikidataData.entities[wikidataId]?.claims;
    if (claims && claims.P30) {
      const continentId = claims.P30[0]?.mainsnak?.datavalue?.value?.id;
      console.log(`  ✓ Continent Wikidata ID: ${continentId}`);
      
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
      
      const continent = continentMap[continentId] || '';
      console.log(`  ✓ Continent: ${continent}`);
      return continent;
    } else {
      console.log('  ✗ No continent claim (P30) found');
    }
  } catch (e: any) {
    console.log(`  ✗ Error: ${e.message}`);
  }
  
  return '';
};

// infoboxから地図画像を取得
const getMapImageFromInfobox = async (countryName: string, lang: 'ja' | 'en'): Promise<string> => {
  const apiUrl = lang === 'ja' ? 'https://ja.wikipedia.org/w/api.php' : 'https://en.wikipedia.org/w/api.php';
  
  try {
    console.log(`\n[Map Image] Getting from ${lang} Wikipedia...`);
    
    const infoboxUrl = `${apiUrl}?action=parse&page=${encodeURIComponent(countryName)}&prop=text&format=json&origin=*`;
    const response = await fetch(infoboxUrl);
    const data: any = await response.json();
    
    if (data.parse && data.parse.text) {
      const htmlText = data.parse.text['*'];
      
      // HTML内の地図画像URLを直接探す
      const imgRegex = /upload\.wikimedia\.org\/wikipedia\/commons\/[^"']+\.(svg|png)/gi;
      const imgMatches = htmlText.match(imgRegex);
      
      if (imgMatches) {
        console.log(`  ✓ Found ${imgMatches.length} total images`);
        
        // 地図関連の画像を優先
        const mapKeywords = ['location', 'orthographic', 'locator', 'map', lang === 'ja' ? 'ja.svg' : 'en.svg'];
        
        for (const keyword of mapKeywords) {
          const mapImages = imgMatches.filter((url: string) => 
            url.toLowerCase().includes(keyword.toLowerCase())
          );
          if (mapImages.length > 0) {
            const mapUrl = `https://${mapImages[0]}`;
            console.log(`  ✓ Selected map (keyword: ${keyword}): ${mapUrl.substring(0, 80)}...`);
            return mapUrl;
          }
        }
        
        console.log('  ✗ No map-related image found');
      } else {
        console.log('  ✗ No images found in HTML');
      }
    }
  } catch (e: any) {
    console.log(`  ✗ Error: ${e.message}`);
  }
  
  return '';
};

// 国旗ページから説明を取得
const getFlagDescription = async (countryName: string, lang: 'ja' | 'en'): Promise<string> => {
  const apiUrl = lang === 'ja' ? 'https://ja.wikipedia.org/w/api.php' : 'https://en.wikipedia.org/w/api.php';
  
  try {
    console.log(`\n[Flag Description] Getting from ${lang} Wikipedia...`);
    
    // 国旗専用ページ名
    const flagPageName = lang === 'ja' 
      ? `${countryName}の国旗`
      : `Flag of ${countryName}`;
    
    console.log(`  Trying: ${flagPageName}`);
    
    // ページの要約を取得
    const summaryUrl = `${apiUrl}?action=query&titles=${encodeURIComponent(flagPageName)}&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`;
    const response = await fetch(summaryUrl);
    const data: any = await response.json();
    
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    
    if (pageId === '-1') {
      console.log('  ✗ Flag page not found');
      return '';
    }
    
    const extract = pages[pageId]?.extract;
    if (extract && extract.length > 50) {
      console.log(`  ✓ Found description (${extract.length} chars)`);
      console.log(`  Preview: ${extract.substring(0, 150)}...`);
      return extract.substring(0, 500) + (extract.length > 500 ? '...' : '');
    } else {
      console.log('  ✗ Description too short or missing');
    }
  } catch (e: any) {
    console.log(`  ✗ Error: ${e.message}`);
  }
  
  return '';
};

// メイン
const main = async () => {
  const testCountries = [
    { name: 'Japan', nameJa: '日本' },
    { name: 'Austria', nameJa: 'オーストリア' },
    { name: 'Brazil', nameJa: 'ブラジル' },
    { name: 'Ghana', nameJa: 'ガーナ' },
  ];

  console.log('========================================');
  console.log('Testing Data Extraction Methods');
  console.log('========================================');

  for (const country of testCountries) {
    console.log('\n\n========================================');
    console.log(`Country: ${country.name} / ${country.nameJa}`);
    console.log('========================================');

    // 1. Continent from Wikidata
    const continent = await getContinentFromWikidata(country.name);

    // 2. Map Image from English Wikipedia
    const mapImageEn = await getMapImageFromInfobox(country.name, 'en');

    // 3. Map Image from Japanese Wikipedia
    const mapImageJa = await getMapImageFromInfobox(country.nameJa, 'ja');

    // 4. Flag Description from English Wikipedia
    const descEn = await getFlagDescription(country.name, 'en');

    // 5. Flag Description from Japanese Wikipedia
    const descJa = await getFlagDescription(country.nameJa, 'ja');

    // サマリー
    console.log('\n--- Summary ---');
    console.log(`Continent: ${continent || 'N/A'}`);
    console.log(`Map Image (EN): ${mapImageEn ? '✓' : '✗'}`);
    console.log(`Map Image (JA): ${mapImageJa ? '✓' : '✗'}`);
    console.log(`Description (EN): ${descEn ? '✓ (' + descEn.length + ' chars)' : '✗'}`);
    console.log(`Description (JA): ${descJa ? '✓ (' + descJa.length + ' chars)' : '✗'}`);

    // 待機
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\n========================================');
  console.log('Test Complete');
  console.log('========================================');
  console.log('\n📊 Recommendations:');
  console.log('1. Continent: Use Wikidata API (P30 property)');
  console.log('2. Map Image: Extract from infobox HTML (look for "location", "orthographic")');
  console.log('3. Description: Use dedicated "Flag of [Country]" Wikipedia pages');
  console.log('\n💡 Implementation Strategy:');
  console.log('- Add these as optional enhancements to avoid breaking existing code');
  console.log('- Use try-catch blocks to handle failures gracefully');
  console.log('- Consider caching Wikidata responses to reduce API calls');
};

main();
