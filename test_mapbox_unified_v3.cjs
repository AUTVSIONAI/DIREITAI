const https = require('https');

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGlyZWl0YWkiLCJhIjoiY21kejNneXVmMDhrZzJpcHkxNDI3a3A1eiJ9.XDUKcah1_a8WQhD8Xyghew';

// Try a very specific address known to exist
const query = 'Avenida Paulista, São Paulo'; 
const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=BR&language=pt&limit=5`;

console.log('Testing URL:', url);

const req = https.get(url, (res) => {
  console.log('Response Status:', res.statusCode);
  console.log('Response Headers:', res.headers);

  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.features) {
        console.log(`Found ${json.features.length} results:`);
        json.features.forEach(f => {
          console.log(`- [${f.place_type[0]}] ${f.text} (${f.place_name})`);
        });
      } else {
        console.log('No features found. Full response:', JSON.stringify(json, null, 2));
      }
    } catch (e) {
      console.error('Error parsing JSON:', e);
      console.log('Raw data:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e);
});
