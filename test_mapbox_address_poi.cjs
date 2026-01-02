const https = require('https');

// Token hardcoded para teste rápido (copiado do .env que li anteriormente)
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGlyZWl0YWkiLCJhIjoiY21kejNneXVmMDhrZzJpcHkxNDI3a3A1eiJ9.XDUKcah1_a8WQhD8Xyghew';

const queries = ['Av. Paulista', 'Museu de Arte de São Paulo'];
// Testar com types=address,poi
const types = 'address,poi';

queries.forEach(query => {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=BR&language=pt&limit=5&types=${types}`;

  console.log(`\n🔍 Buscando: "${query}" (types=${types})`);

  https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.features && json.features.length > 0) {
          console.log(`✅ Encontrados ${json.features.length} resultados:`);
          json.features.forEach(f => {
            console.log(`   - [${f.place_type[0]}] ${f.text} (${f.place_name})`);
          });
        } else {
          console.log('⚠️ Nenhum resultado encontrado.');
          if (json.message) console.log('Mensagem:', json.message);
        }
      } catch (e) {
        console.error('Erro ao processar JSON:', e.message);
      }
    });
  }).on('error', (e) => {
    console.error('Erro na requisição:', e.message);
  });
});
