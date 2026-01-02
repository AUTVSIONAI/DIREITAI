const https = require('https');

// Token Mapbox (use a valid token from your env or I will try to read it)
// I will read .env first to get the token.
const fs = require('fs');
const path = require('path');

function getEnvValue(key) {
    try {
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
            if (match) return match[1].trim();
        }
    } catch (e) {
        console.error('Error reading .env:', e);
    }
    return process.env[key];
}

const MAPBOX_TOKEN = getEnvValue('VITE_MAPBOX_TOKEN');

if (!MAPBOX_TOKEN) {
    console.error('VITE_MAPBOX_TOKEN not found in .env');
    process.exit(1);
}

const queryPOI = 'Museu de Arte de São Paulo';
const queryAddress = 'Avenida Paulista 1578';
const centerLat = -23.561684;
const centerLng = -46.655981;

// Test 1: types=poi for POI
const url1 = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(queryPOI)}.json?access_token=${MAPBOX_TOKEN}&country=BR&language=pt&limit=5&types=poi&proximity=${centerLng},${centerLat}`;

// Test 2: types=address for Address
const url2 = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(queryAddress)}.json?access_token=${MAPBOX_TOKEN}&country=BR&language=pt&limit=5&types=address&proximity=${centerLng},${centerLat}`;

// Test 3: types=address,poi for Address
const url3 = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(queryAddress)}.json?access_token=${MAPBOX_TOKEN}&country=BR&language=pt&limit=5&types=address,poi&proximity=${centerLng},${centerLat}`;

// Test 4: types=address,poi for POI
const url4 = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(queryPOI)}.json?access_token=${MAPBOX_TOKEN}&country=BR&language=pt&limit=5&types=address,poi&proximity=${centerLng},${centerLat}`;

function testUrl(name, url) {
    console.log(`\nTesting ${name}...`);
    // console.log(`URL: ${url}`); 
    
    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.features && json.features.length > 0) {
                    console.log(`[${name}] Found ${json.features.length} results.`);
                    console.log(`Top result: ${json.features[0].place_name} (${json.features[0].place_type})`);
                } else {
                    console.log(`[${name}] No results found.`);
                    if (json.message) console.log(`Message: ${json.message}`);
                }
            } catch (e) {
                console.error(`[${name}] Error parsing JSON:`, e.message);
            }
        });
    }).on('error', (e) => {
        console.error(`[${name}] Request error:`, e.message);
    });
}

// Test 5: No types for POI
const url5 = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(queryPOI)}.json?access_token=${MAPBOX_TOKEN}&country=BR&language=pt&limit=5&proximity=${centerLng},${centerLat}`;

// Test 6: No types for Address
const url6 = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(queryAddress)}.json?access_token=${MAPBOX_TOKEN}&country=BR&language=pt&limit=5&proximity=${centerLng},${centerLat}`;

const queryStreet = 'Avenida Paulista';

// Test 7: No types for Street
const url7 = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(queryStreet)}.json?access_token=${MAPBOX_TOKEN}&country=BR&language=pt&limit=5&proximity=${centerLng},${centerLat}`;

// Test 8: types=address for Street
const url8 = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(queryStreet)}.json?access_token=${MAPBOX_TOKEN}&country=BR&language=pt&limit=5&types=address&proximity=${centerLng},${centerLat}`;

testUrl('Street Query (No Types)', url7);
testUrl('Street Query (types=address)', url8);
