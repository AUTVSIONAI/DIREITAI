const https = require('https');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env to get token
const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
// We need MAPBOX token. It's usually in frontend .env
const frontendEnvPath = path.resolve(__dirname, '.env');
let mapboxToken = '';
try {
    const frontendEnv = dotenv.parse(fs.readFileSync(frontendEnvPath));
    mapboxToken = frontendEnv.VITE_MAPBOX_TOKEN;
} catch (e) {
    console.log('Could not read frontend .env, checking provided info...');
}

// Fallback if not found (from previous tool outputs)
if (!mapboxToken) mapboxToken = 'pk.eyJ1IjoiZGlyZWl0YWkiLCJhIjoiY201bnY3aHk2MGlqZDJrc2I2Mm12cXEwZCJ9.7w4gY4D-3gHj7zW8i_84-A';

function searchMapbox(query, types) {
    return new Promise((resolve, reject) => {
        const typeParam = types ? `&types=${types}` : '';
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=BR&language=pt&limit=5${typeParam}`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    console.log('--- Testing Mapbox POI Search ---');
    const query = "Museu de Arte de São Paulo";

    console.log(`\nQuery: "${query}" (NO TYPES)`);
    const res1 = await searchMapbox(query, null);
    if (res1.features) {
        res1.features.forEach(f => console.log(` - [${f.place_type[0]}] ${f.text} (${f.place_name})`));
    }

    console.log(`\nQuery: "${query}" (types=poi,address)`);
    const res2 = await searchMapbox(query, 'poi,address');
    if (res2.features) {
        res2.features.forEach(f => console.log(` - [${f.place_type[0]}] ${f.text} (${f.place_name})`));
    } else {
        console.log('No results.');
    }
    
    console.log(`\nQuery: "${query}" (types=poi)`);
    const res3 = await searchMapbox(query, 'poi');
    if (res3.features) {
        res3.features.forEach(f => console.log(` - [${f.place_type[0]}] ${f.text} (${f.place_name})`));
    } else {
        console.log('No results.');
    }
}

run();
