import fetch from 'node-fetch';

const checkInfobox = async () => {
  const response = await fetch('https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles=Austria&rvprop=content&rvslots=main&formatversion=2&format=json&origin=*');
  const data: any = await response.json();
  
  if (data.query && data.query.pages && data.query.pages[0]) {
    const content = data.query.pages[0].revisions[0].slots.main.content;
    
    // Infoboxの部分を抽出
    const infoboxMatch = content.match(/\{\{Infobox country[\s\S]*?\n\}\}/i);
    if (infoboxMatch) {
      console.log('=== Austria Infobox (first 3000 chars) ===');
      console.log(infoboxMatch[0].substring(0, 3000));
      
      // capital行を探す
      const lines = infoboxMatch[0].split('\n');
      const capitalLine = lines.find((line: string) => line.includes('capital'));
      console.log('\n=== Capital line ===');
      console.log(capitalLine);
      
      // hlist関連の行を探す
      const hlistLines = lines.filter((line: string) => line.toLowerCase().includes('hlist'));
      console.log('\n=== Lines with hlist ===');
      hlistLines.forEach((line: string) => console.log(line));
    }
  }

  console.log('\n\n=== Comparing with Japan ===');
  const response2 = await fetch('https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles=Japan&rvprop=content&rvslots=main&formatversion=2&format=json&origin=*');
  const data2: any = await response2.json();
  
  if (data2.query && data2.query.pages && data2.query.pages[0]) {
    const content = data2.query.pages[0].revisions[0].slots.main.content;
    const infoboxMatch = content.match(/\{\{Infobox country[\s\S]*?\n\}\}/i);
    if (infoboxMatch) {
      const lines = infoboxMatch[0].split('\n');
      const hlistLines = lines.filter((line: string) => line.toLowerCase().includes('hlist'));
      console.log('Lines with hlist in Japan:');
      hlistLines.forEach((line: string) => console.log(line));
    }
  }
};

checkInfobox();
