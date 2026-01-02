const https = require('https');

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGlyZWl0YWkiLCJhIjoiY201b212MGt4MDNpbDJqcXl3aXZ2a2U3MyJ9.r2X8-VvQ_wXqgD0ZzJk5gA';

async function testSearch(query) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=BR&language=pt&limit=5`;
  
  console.log(`\nTesting query: "${query}"`);
  console.log(`URL: ${url}`);

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.features) {
            console.log(`Found ${json.features.length} results.`);
            json.features.forEach(f => {
              console.log(` - [${f.place_type[0]}] ${f.place_name} (${f.relevance})`);
            });
          } else {
            console.log('No features found.');
            console.log(json);
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
  await testSearch('Av Paulista');
  await testSearch('Parque Ibirapuera'); // POI
  await testSearch('São Paulo'); // Place
}

run();
