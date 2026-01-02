const https = require('https');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env to get token
const frontendEnvPath = path.resolve(__dirname, '.env');
let mapboxToken = '';
try {
    const frontendEnv = dotenv.parse(fs.readFileSync(frontendEnvPath));
    mapboxToken = frontendEnv.VITE_MAPBOX_TOKEN;
} catch (e) {
    console.log('Could not read frontend .env, checking provided info...');
}
if (!mapboxToken) mapboxToken = 'pk.eyJ1IjoiZGlyZWl0YWkiLCJhIjoiY201bnY3aHk2MGlqZDJrc2I2Mm12cXEwZCJ9.7w4gY4D-3gHj7zW8i_84-A';

function searchMapbox(query, options = {}) {
    return new Promise((resolve, reject) => {
        let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=BR&language=pt&limit=5`;
        
        if (options.types) url += `&types=${options.types}`;
        if (options.proximity) url += `&proximity=${options.proximity}`;

        console.log('URL:', url);
        
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
    console.log('--- Testing Mapbox POI Explicitly ---');
    
    // SP Center approx: -46.633308, -23.550520
    const spProximity = '-46.633308,-23.550520';

    const queries = [
        { q: "Museu de Arte de São Paulo", opts: { types: "poi", proximity: spProximity } },
        { q: "MASP", opts: { types: "poi", proximity: spProximity } },
        { q: "Av Paulista 1578", opts: { types: "address", proximity: spProximity } },
        { q: "Av Paulista 1578", opts: { types: "address,poi", proximity: spProximity } }
    ];

    for (const item of queries) {
        console.log(`\nQuery: "${item.q}" (opts: ${JSON.stringify(item.opts)})`);
        const res = await searchMapbox(item.q, item.opts);
        if (res.features && res.features.length > 0) {
            res.features.forEach(f => console.log(` - [${f.place_type[0]}] ${f.text} (${f.place_name})`));
        } else {
            console.log('No results.');
        }
    }
}

run();
