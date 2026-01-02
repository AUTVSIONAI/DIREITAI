const https = require('https');

// Token from .env
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGlyZWl0YWkiLCJhIjoiY21kejNneXVmMDhrZzJpcHkxNDI3a3A1eiJ9.XDUKcah1_a8WQhD8Xyghew';
const query = 'Paulista';

const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=BR&types=place,locality,neighborhood,address&language=pt&limit=5`;

console.log(`Testing Mapbox API with query: "${query}"`);
console.log(`URL: ${url.replace(MAPBOX_TOKEN, 'TOKEN_HIDDEN')}`);

https.get(url, (res) => {
  let data = '';

  console.log('Status Code:', res.statusCode);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        console.log('Response JSON parsed successfully.');
        console.log('Features found:', json.features?.length);
        if (json.features?.length > 0) {
            console.log('First feature:', json.features[0].place_name);
        }
      } catch (e) {
        console.error('Error parsing JSON:', e);
      }
    } else {
      console.error('Request failed. Body:', data);
    }
  });

}).on('error', (err) => {
  console.error('Error making request:', err);
});
