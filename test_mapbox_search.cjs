const https = require('https');
require('dotenv').config({ path: 'c:\\DIREITAI\\backend-oficial\\.env' }); // Load backend .env for MAPBOX_TOKEN if present there, or try src .env

// Try to find MAPBOX_TOKEN
let MAPBOX_TOKEN = process.env.VITE_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN;

// If not in backend .env, try reading frontend .env
if (!MAPBOX_TOKEN) {
  const fs = require('fs');
  try {
    const frontendEnv = fs.readFileSync('c:\\DIREITAI\\.env', 'utf8');
    const match = frontendEnv.match(/VITE_MAPBOX_TOKEN=(.*)/);
    if (match) {
      MAPBOX_TOKEN = match[1].trim();
    }
  } catch (e) {
    console.log('Could not read frontend .env');
  }
}

if (!MAPBOX_TOKEN) {
  console.error('MAPBOX_TOKEN not found');
  process.exit(1);
}

const query = 'Avenida Paulista';

function search(types) {
  const typesParam = types ? `&types=${types}` : '';
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=BR&language=pt&limit=5${typesParam}`;

  console.log(`Testing with types: ${types || 'NONE'}`);
  console.log(`URL: ${url.replace(MAPBOX_TOKEN, 'HIDDEN')}`);

  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const json = JSON.parse(data);
          console.log(`Status: ${res.statusCode}`);
          console.log(`Found: ${json.features ? json.features.length : 0} features`);
          if (json.features && json.features.length > 0) {
            console.log('Top result:', json.features[0].place_name);
            console.log('Type:', json.features[0].place_type);
          }
        } catch (e) {
          console.error('Invalid JSON');
        }
      } else {
        console.error(`Error: ${res.statusCode} ${res.statusMessage}`);
        console.error(data);
      }
    });
  }).on('error', (err) => {
    console.error('Request error:', err.message);
  });
}

search(''); // Test without types (current)
setTimeout(() => search('address,poi'), 1000); // Test with types (previous?)
