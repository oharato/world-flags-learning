import fetch from 'node-fetch';
import wiki from 'wikijs';

/**
 * テストスクリプト: 正確な首都情報の取得方法を調査
 */

// 方法1: Wikidataから首都を取得
const getCapitalFromWikidata = async (countryName: string): Promise<string> => {
  try {
    console.log(`\n[Wikidata] Getting capital for ${countryName}...`);
    
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

    // Wikidataから首都情報を取得 (P36 = capital)
    const wikidataUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wikidataId}&props=claims|labels&languages=en|ja&format=json&origin=*`;
    const wikidataRes = await fetch(wikidataUrl);
    const wikidataData: any = await wikidataRes.json();
    
    const claims = wikidataData.entities[wikidataId]?.claims;
    if (claims && claims.P36) {
      const capitalId = claims.P36[0]?.mainsnak?.datavalue?.value?.id;
      console.log(`  ✓ Capital Wikidata ID: ${capitalId}`);
      
      // 首都のIDからラベル（名前）を取得
      const capitalLabelUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${capitalId}&props=labels&languages=en|ja&format=json&origin=*`;
      const capitalLabelRes = await fetch(capitalLabelUrl);
      const capitalLabelData: any = await capitalLabelRes.json();
      
      const capitalNameEn = capitalLabelData.entities[capitalId]?.labels?.en?.value || '';
      const capitalNameJa = capitalLabelData.entities[capitalId]?.labels?.ja?.value || '';
      
      console.log(`  ✓ Capital (EN): ${capitalNameEn}`);
      console.log(`  ✓ Capital (JA): ${capitalNameJa}`);
      
      return capitalNameEn;
    } else {
      console.log('  ✗ No capital claim (P36) found');
    }
  } catch (e: any) {
    console.log(`  ✗ Error: ${e.message}`);
  }
  
  return '';
};

// 方法2: infoboxから直接パース
const getCapitalFromInfobox = async (countryName: string, lang: 'ja' | 'en'): Promise<string> => {
  const apiUrl = lang === 'ja' ? 'https://ja.wikipedia.org/w/api.php' : 'https://en.wikipedia.org/w/api.php';
  
  try {
    console.log(`\n[Infobox ${lang}] Getting capital...`);
    
    const infoboxUrl = `${apiUrl}?action=parse&page=${encodeURIComponent(countryName)}&prop=text&format=json&origin=*`;
    const response = await fetch(infoboxUrl);
    const data: any = await response.json();
    
    if (data.parse && data.parse.text) {
      const htmlText = data.parse.text['*'];
      
      // infoboxのtableを探す
      const infoboxMatch = htmlText.match(/<table[^>]*class="[^"]*infobox[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
      if (!infoboxMatch) {
        console.log('  ✗ Infobox not found');
        return '';
      }
      
      // capitalの行を探す
      const capitalRegex = lang === 'ja' 
        ? /<th[^>]*>(?:首都|最大都市)<\/th>[\s\S]*?<td[^>]*>(.*?)<\/td>/i
        : /<th[^>]*>Capital[^<]*<\/th>[\s\S]*?<td[^>]*>(.*?)<\/td>/i;
      
      const capitalMatch = infoboxMatch[1].match(capitalRegex);
      if (capitalMatch && capitalMatch[1]) {
        // HTMLタグとリンクを削除
        let capital = capitalMatch[1]
          .replace(/<sup[^>]*>.*?<\/sup>/gi, '') // 脚注を削除
          .replace(/<[^>]+>/g, '') // HTMLタグを削除
          .replace(/&nbsp;/g, ' ')
          .replace(/&#91;/g, '[')
          .replace(/&#93;/g, ']')
          .trim()
          .split(/[[\(<]/)[0] // 括弧や注釈の前まで
          .trim();
        
        console.log(`  ✓ Capital: ${capital}`);
        return capital;
      } else {
        console.log('  ✗ Capital field not found in infobox');
      }
    }
  } catch (e: any) {
    console.log(`  ✗ Error: ${e.message}`);
  }
  
  return '';
};

// 方法3: WikiAPIのpagepropsから取得
const getCapitalFromPageProps = async (countryName: string): Promise<string> => {
  try {
    console.log(`\n[PageProps] Getting capital...`);
    
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(countryName)}&prop=pageprops|revisions&rvprop=content&rvslots=main&formatversion=2&format=json&origin=*`;
    const response = await fetch(apiUrl);
    const data: any = await response.json();
    
    if (data.query && data.query.pages && data.query.pages[0]) {
      const page = data.query.pages[0];
      const content = page.revisions?.[0]?.slots?.main?.content;
      
      if (content) {
        // Infoboxテンプレートから首都を抽出
        const capitalMatch = content.match(/\|\s*capital\s*=\s*\[\[(.*?)\]\]/i) || 
                            content.match(/\|\s*capital\s*=\s*([^\n|]+)/i);
        
        if (capitalMatch && capitalMatch[1]) {
          let capital = capitalMatch[1]
            .split('|')[0] // リンクのラベル部分を除去
            .replace(/<[^>]+>/g, '')
            .trim();
          
          console.log(`  ✓ Capital: ${capital}`);
          return capital;
        } else {
          console.log('  ✗ Capital not found in wikitext');
        }
      }
    }
  } catch (e: any) {
    console.log(`  ✗ Error: ${e.message}`);
  }
  
  return '';
};

// メイン
const main = async () => {
  const testCountries = [
    { name: 'Japan', nameJa: '日本', expectedCapital: 'Tokyo' },
    { name: 'Azerbaijan', nameJa: 'アゼルバイジャン', expectedCapital: 'Baku' },
    { name: 'Afghanistan', nameJa: 'アフガニスタン', expectedCapital: 'Kabul' },
    { name: 'Israel', nameJa: 'イスラエル', expectedCapital: 'Jerusalem' },
    { name: 'Iraq', nameJa: 'イラク', expectedCapital: 'Baghdad' },
    { name: 'United States', nameJa: 'アメリカ合衆国', expectedCapital: 'Washington, D.C.' },
  ];

  console.log('========================================');
  console.log('Testing Capital Extraction Methods');
  console.log('========================================');

  for (const country of testCountries) {
    console.log('\n\n========================================');
    console.log(`Country: ${country.name} / ${country.nameJa}`);
    console.log(`Expected: ${country.expectedCapital}`);
    console.log('========================================');

    // 方法1: Wikidata
    const capitalFromWikidata = await getCapitalFromWikidata(country.name);

    // 方法2: Infobox (English)
    const capitalFromInfoboxEn = await getCapitalFromInfobox(country.name, 'en');

    // 方法3: Infobox (Japanese)
    const capitalFromInfoboxJa = await getCapitalFromInfobox(country.nameJa, 'ja');

    // 方法4: PageProps
    const capitalFromPageProps = await getCapitalFromPageProps(country.name);

    // サマリー
    console.log('\n--- Summary ---');
    console.log(`Expected:           ${country.expectedCapital}`);
    console.log(`Wikidata:           ${capitalFromWikidata || 'N/A'}`);
    console.log(`Infobox (EN):       ${capitalFromInfoboxEn || 'N/A'}`);
    console.log(`Infobox (JA):       ${capitalFromInfoboxJa || 'N/A'}`);
    console.log(`PageProps:          ${capitalFromPageProps || 'N/A'}`);
    
    // 最も正確な結果を判定
    const results = [
      { method: 'Wikidata', value: capitalFromWikidata },
      { method: 'Infobox (EN)', value: capitalFromInfoboxEn },
      { method: 'Infobox (JA)', value: capitalFromInfoboxJa },
      { method: 'PageProps', value: capitalFromPageProps },
    ].filter(r => r.value);
    
    if (results.length > 0) {
      console.log(`\n✓ Best result: ${results[0].value} (from ${results[0].method})`);
    } else {
      console.log('\n✗ No capital found');
    }

    // 待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n========================================');
  console.log('Test Complete');
  console.log('========================================');
  console.log('\n📊 Recommendations:');
  console.log('1. Best source: Wikidata (P36 property) - most reliable and structured');
  console.log('2. Fallback 1: Infobox parsing from HTML');
  console.log('3. Fallback 2: Wikitext template parsing');
  console.log('\n💡 Wikidata advantages:');
  console.log('- Structured data, not prone to text extraction errors');
  console.log('- Multilingual support (get both EN and JA names)');
  console.log('- Updated independently from Wikipedia articles');
  console.log('- Disambiguates complex cases (like Israel/Jerusalem)');
};

main();
