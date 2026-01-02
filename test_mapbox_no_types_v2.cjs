const https = require('https');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from frontend .env
const envPath = path.resolve(__dirname, 'src', '.env'); // Try src/.env first? Or root .env?
// Usually Vite projects have .env in root.
const rootEnvPath = path.resolve(__dirname, '.env');

let mapboxToken = '';

if (fs.existsSync(rootEnvPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(rootEnvPath));
    mapboxToken = envConfig.VITE_MAPBOX_TOKEN;
}

if (!mapboxToken) {
    // Try to find it in the file content if .env parsing fails or file doesn't exist
    // (Backup strategy)
    console.log('Token not found in .env, trying to hardcode for test or read from file...');
    // I'll skip hardcoding for now and rely on the file existence.
    // If it fails, I'll know.
}

console.log('Mapbox Token Length:', mapboxToken ? mapboxToken.length : 0);

const query = 'Museu de Arte de São Paulo'; // A POI
// const query = 'Avenida Paulista, 1578'; // An address

async function testMapbox(searchQuery) {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&country=BR&language=pt&limit=5`;
    
    console.log(`Testing query: "${searchQuery}"`);
    console.log(`URL: ${url.replace(mapboxToken, 'HIDDEN_TOKEN')}`);

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`Status: ${res.statusCode}`);
                    if (json.features) {
                        console.log(`Found ${json.features.length} features.`);
                        json.features.forEach(f => {
                            console.log(` - [${f.place_type[0]}] ${f.text} (${f.place_name})`);
                        });
                    } else {
                        console.log('No features found.');
                        console.log('Response:', JSON.stringify(json, null, 2));
                    }
                    resolve();
                } catch (e) {
                    console.error('Error parsing JSON:', e);
                    reject(e);
                }
            });
        }).on('error', (err) => {
            console.error('Error:', err);
            reject(err);
        });
    });
}

async function run() {
    if (!mapboxToken) {
        console.error('Please set VITE_MAPBOX_TOKEN in .env');
        return;
    }
    await testMapbox('Museu de Arte de São Paulo');
    await testMapbox('Avenida Paulista 1578');
    await testMapbox('São Paulo');
}

run();
