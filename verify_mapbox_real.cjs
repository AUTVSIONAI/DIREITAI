const axios = require('axios');

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGlyZWl0YWkiLCJhIjoiY21kejNneXVmMDhrZzJpcHkxNDI3a3A1eiJ9.XDUKcah1_a8WQhD8Xyghew';
const query = 'Av. Paulista';

async function searchAddresses(query) {
    console.log(`🔍 Searching for: ${query}`);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=BR&types=place,locality,neighborhood,address&language=pt&limit=5`;
    
    try {
        const response = await axios.get(url);
        console.log('✅ Status:', response.status);
        console.log('📦 Data features length:', response.data.features.length);
        if (response.data.features.length > 0) {
            console.log('📍 First result:', response.data.features[0].place_name);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

searchAddresses(query);
