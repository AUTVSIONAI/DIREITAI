const https = require('https');
require('dotenv').config({ path: 'c:\\DIREITAI\\.env' });

const MAPBOX_TOKEN = process.env.VITE_MAPBOX_TOKEN;
const QUERY = 'Parque Ibirapuera'; // POI

function testSearch(types) {
  return new Promise((resolve, reject) => {
    const typeParam = types ? `&types=${types}` : '';
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(QUERY)}.json?access_token=${MAPBOX_TOKEN}&country=BR&language=pt&limit=5${typeParam}`;
    
    console.log(`Testing with types=${types || 'NONE'}...`);

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`Status: ${res.statusCode}`);
          if (json.features) {
            console.log(`Found ${json.features.length} results.`);
            json.features.forEach((f, i) => {
              console.log(`  ${i+1}. [${f.place_type[0]}] ${f.place_name}`);
            });
          } else {
            console.log('No features found.');
          }
          resolve();
        } catch (e) {
          console.error('Error parsing JSON:', e);
          resolve();
        }
      });
    }).on('error', (e) => {
      console.error('Request error:', e);
      resolve();
    });
  });
}

async function run() {
  if (!MAPBOX_TOKEN) {
    console.error('VITE_MAPBOX_TOKEN not found in .env');
    return;
  }
  
  await testSearch('address');
  await testSearch('poi');
  await testSearch('address,poi');
  await testSearch(null); // No types
}

run();
