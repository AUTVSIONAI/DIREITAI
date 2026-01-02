const https = require('https');

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGlyZWl0YWkiLCJhIjoiY201M2xvYTVxMHJ4ZDJrcHh6ZDM1Ym13ZSJ9.M-cM7i69ppxX0QcI-2FwTA';

const query = 'Paulista'; // Common street name
const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=BR&language=pt&limit=5`;

console.log('Testing URL:', url);

https.get(url, (res) => {
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
        console.log('No features found');
      }
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
  });
}).on('error', (e) => {
  console.error('Error:', e);
});
