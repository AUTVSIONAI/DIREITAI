const https = require('https');
const fs = require('fs');
const path = require('path');

// Load env vars
const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
let mapboxToken = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/VITE_MAPBOX_TOKEN=(.+)/);
  if (match) {
    mapboxToken = match[1].trim();
  }
}

if (!mapboxToken) {
    // try frontend env
    const feEnvPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(feEnvPath)) {
        const envContent = fs.readFileSync(feEnvPath, 'utf8');
        const match = envContent.match(/VITE_MAPBOX_TOKEN=(.+)/);
        if (match) {
            mapboxToken = match[1].trim();
        }
    }
}

async function testMapbox(query, types) {
    return new Promise((resolve, reject) => {
        const typesParam = types ? `&types=${types}` : '';
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=BR&language=pt&limit=5${typesParam}`;
        
        console.log(`\n🔍 Testing query: "${query}" with types: "${types || 'NONE'}"`);
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.features && json.features.length > 0) {
                        console.log(`✅ Found ${json.features.length} results:`);
                        json.features.forEach(f => console.log(`   - [${f.place_type[0]}] ${f.text} (${f.place_name})`));
                    } else {
                        console.log('❌ No results found.');
                    }
                    resolve();
                } catch (e) {
                    console.error('❌ Error parsing JSON:', e.message);
                    resolve();
                }
            });
        }).on('error', (e) => {
            console.error('❌ Request error:', e.message);
            resolve();
        });
    });
}

async function runTests() {
    await testMapbox('Museu de Arte de São Paulo', 'address,poi');
    await testMapbox('Museu de Arte de São Paulo', '');
}

runTests();
