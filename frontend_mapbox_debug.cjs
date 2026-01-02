const https = require('https');
require('dotenv').config({ path: './backend-oficial/.env' });

const MAPBOX_TOKEN = process.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGlyZWl0YWkiLCJhIjoiY21kejNneXVmMDhrZzJpcHkxNDI3a3A1eiJ9.XDUKcah1_a8WQhD8Xyghew';
const query = 'Avenida Paulista';

console.log(`Testing Mapbox with token: ${MAPBOX_TOKEN.substring(0, 10)}...`);

const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=BR&types=place,locality,neighborhood,address&language=pt&limit=5`;

console.log(`URL: ${url}`);

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        console.log(`✅ Success! Found ${json.features?.length} features.`);
        if (json.features?.length > 0) {
            console.log('Top result:', json.features[0].place_name);
        }
      } catch (e) {
        console.error('❌ JSON Parse Error:', e);
      }
    } else {
      console.error(`❌ Request failed: ${res.statusCode} ${res.statusMessage}`);
      console.error('Body:', data);
    }
  });
}).on('error', (e) => {
  console.error('❌ Network Error:', e);
});
