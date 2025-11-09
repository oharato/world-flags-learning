import fs from 'node:fs/promises';
import path from 'node:path';
import wiki from 'wikijs';

const main = async () => {
  console.log('Fetching country list from Wikipedia...');
  try {
    const page = await wiki({ apiUrl: 'https://ja.wikipedia.org/w/api.php' }).page('国旗の一覧');
    const tables = await page.tables();

    let countryNames = [];
    for (const table of tables) {
      for (const row of table) {
        if (row.絵文字) {
          const fullText = row.絵文字;
          // "国名" + "の" + "国名" + "の国旗" の形式から最初の国名を抽出
          const match = fullText.match(/(.+?)の/);
          if (match?.[1]) {
            countryNames.push(match[1]);
          } else {
            // マッチしない場合はそのまま追加（例: "ヨルダン" のみの場合など）
            countryNames.push(fullText.replace(/の国旗$/, ''));
          }
        }
      }
    }

    // 重複を排除
    countryNames = [...new Set(countryNames)];

    console.log(`Found ${countryNames.length} countries.`);

    const outputPath = path.resolve(process.cwd(), 'scripts', 'country-list.json');
    await fs.writeFile(outputPath, JSON.stringify(countryNames, null, 2));
    console.log(`Country list saved to ${outputPath}`);
  } catch (error) {
    console.error('Error fetching country list:', error);
  }
};

main();
