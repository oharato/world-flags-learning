import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Script to generate a GeoJSON name to localized name mapping
 * using our existing countries.ja.json and countries.en.json data
 */

interface CountryData {
  id: string;
  name: string;
}

// Manual mapping from GeoJSON names to our country IDs
// This handles name differences between GeoJSON and our data
const geoJsonToIdMapping: Record<string, string> = {
  // Different naming conventions
  'United States of America': 'united_states',
  'United States': 'united_states',
  Russia: 'russia',
  'South Korea': 'south_korea',
  'North Korea': 'north_korea',
  'Republic of the Congo': 'republic_of_the_congo',
  'Democratic Republic of the Congo': 'democratic_republic_of_the_congo',
  'The Gambia': 'the_gambia',
  Gambia: 'the_gambia',
  'The Bahamas': 'the_bahamas',
  Bahamas: 'the_bahamas',
  "Côte d'Ivoire": 'ivory_coast',
  'Ivory Coast': 'ivory_coast',
  Czechia: 'czech_republic',
  'Czech Republic': 'czech_republic',
  'Timor-Leste': 'timorleste',
  'East Timor': 'timorleste',
  eSwatini: 'eswatini',
  Eswatini: 'eswatini',
  Swaziland: 'eswatini',
  'Cabo Verde': 'cape_verde',
  'Cape Verde': 'cape_verde',
  Myanmar: 'myanmar',
  Burma: 'myanmar',
  'Vatican City': 'vatican_city',
  Vatican: 'vatican_city',
  'Republic of Ireland': 'republic_of_ireland',
  Ireland: 'republic_of_ireland',
  // Taiwan
  Taiwan: 'taiwan',
  'Chinese Taipei': 'taiwan',
  // UK and related
  'United Kingdom': 'united_kingdom',
  // UAE
  'United Arab Emirates': 'united_arab_emirates',
  // Others
  'Trinidad and Tobago': 'trinidad_and_tobago',
  'Saint Vincent and the Grenadines': 'saint_vincent_and_the_grenadines',
  'Saint Lucia': 'saint_lucia',
  'Saint Kitts and Nevis': 'saint_kitts_and_nevis',
  'Sao Tome and Principe': 'sao_tome_and_principe',
  'São Tomé and Príncipe': 'sao_tome_and_principe',
  'São Tomé and Principe': 'sao_tome_and_principe',
  'Bosnia and Herzegovina': 'bosnia_and_herzegovina',
  'Antigua and Barbuda': 'antigua_and_barbuda',
  'Papua New Guinea': 'papua_new_guinea',
  'Equatorial Guinea': 'equatorial_guinea',
  'Guinea-Bissau': 'guineabissau',
  'Sri Lanka': 'sri_lanka',
  'Costa Rica': 'costa_rica',
  'El Salvador': 'el_salvador',
  'New Zealand': 'new_zealand',
  'Saudi Arabia': 'saudi_arabia',
  'South Africa': 'south_africa',
  'South Sudan': 'south_sudan',
  'North Macedonia': 'north_macedonia',
  Macedonia: 'north_macedonia',
  'Solomon Islands': 'solomon_islands',
  'Marshall Islands': 'marshall_islands',
  'Central African Republic': 'central_african_republic',
  'Dominican Republic': 'dominican_republic',
  'Burkina Faso': 'burkina_faso',
  'Sierra Leone': 'sierra_leone',
  // Additional mappings for GeoJSON variations
  Spain: 'spain',
};

const main = async () => {
  // Load existing country data
  const enPath = path.resolve(process.cwd(), 'public', 'countries.en.json');
  const jaPath = path.resolve(process.cwd(), 'public', 'countries.ja.json');
  const geoJsonPath = path.resolve(process.cwd(), 'public', 'countries.geojson');

  const enData: CountryData[] = JSON.parse(await fs.readFile(enPath, 'utf-8'));
  const jaData: CountryData[] = JSON.parse(await fs.readFile(jaPath, 'utf-8'));
  const geoJson = JSON.parse(await fs.readFile(geoJsonPath, 'utf-8'));

  // Create lookup maps
  const enById = new Map<string, string>();
  const jaById = new Map<string, string>();

  for (const c of enData) {
    enById.set(c.id, c.name);
    // Also add lowercase version of name for matching
    enById.set(c.name.toLowerCase(), c.name);
  }

  for (const c of jaData) {
    jaById.set(c.id, c.name);
  }

  // Get GeoJSON country names
  const geoJsonNames: string[] = geoJson.features
    .map((f: any) => f.properties?.name)
    .filter((name: string | undefined): name is string => !!name);

  // Create the lookup
  const lookup: Record<string, { ja: string; en: string }> = {};
  const unmapped: string[] = [];

  for (const geoName of geoJsonNames) {
    // Try different matching strategies
    let id: string | undefined;

    // 1. Check manual mapping first
    if (geoJsonToIdMapping[geoName]) {
      id = geoJsonToIdMapping[geoName];
    }

    // 2. Try to find by converting name to ID format
    if (!id) {
      const possibleId = geoName
        .toLowerCase()
        .replace(/ /g, '_')
        .replace(/[^a-z0-9_]/g, '');
      if (enById.has(possibleId) || jaById.has(possibleId)) {
        id = possibleId;
      }
    }

    // 3. Try to find by exact name match (case-insensitive)
    if (!id) {
      const found = enData.find((c) => c.name.toLowerCase() === geoName.toLowerCase());
      if (found) {
        id = found.id;
      }
    }

    // 4. Try partial matching
    if (!id) {
      const found = enData.find(
        (c) =>
          c.name.toLowerCase().includes(geoName.toLowerCase()) || geoName.toLowerCase().includes(c.name.toLowerCase())
      );
      if (found) {
        id = found.id;
      }
    }

    if (id && enById.has(id) && jaById.has(id)) {
      lookup[geoName] = {
        en: enById.get(id)!,
        ja: jaById.get(id)!,
      };
    } else {
      unmapped.push(geoName);
      // Use original name as fallback
      lookup[geoName] = {
        en: geoName,
        ja: geoName,
      };
    }
  }

  console.log(`Mapped ${geoJsonNames.length - unmapped.length} of ${geoJsonNames.length} GeoJSON countries`);
  if (unmapped.length > 0) {
    console.log(`Unmapped (${unmapped.length}):`, unmapped);
  }

  // Save the lookup file
  const outputPath = path.resolve(process.cwd(), 'public', 'country-names-lookup.json');
  await fs.writeFile(outputPath, JSON.stringify(lookup, null, 2));
  console.log(`Saved lookup to ${outputPath}`);
};

main().catch(console.error);
