const axios = require('axios');

/**
 * Try Google Maps Geocoding API (most accurate)
 */


const tryOlaMaps = async (address) => {
  const apiKey = "g7M6s2MkTwTxHqu0G0V7JXtIefpSWJDtCdEPyx6S";

  const url = `https://api.olamaps.io/places/v1/geocode?address=${address}&language=hi&api_key=g7M6s2MkTwTxHqu0G0V7JXtIefpSWJDtCdEPyx6S' 
`;

  console.log(`[OLA Maps] Searching: ${address}`);

  try {
    const response = await axios.get(url);

    const results = response.data.geocodingResults;
    console.log(results)

    if (results && results.length > 0) {
      const first = results[0];

      console.log(`[OLA Maps] ✅ Found: ${first.formatted_address}`);
      console.log(
        `[OLA Maps] Coordinates: ${first.geometry.location.lat}, ${first.geometry.location.lng}`
      );

      return {
        lat: first.geometry.location.lat,
        lng: first.geometry.location.lng,
        display_name: first.formatted_address,
        address: first.address_components || {}
      };
    }

    console.log("[OLA Maps] No results found");
  } catch (err) {
    console.log(`[OLA Maps] Error: ${err.message}`);
  }

  return null;
};



/**
 * Try Nominatim geocoding service using simple fetch approach
 */
const tryNominatim = async (address) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
  console.log(`[Nominatim] Searching: ${address}`);
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'SalesTracker-App/1.0 (vikas@example.com)'
      },
      timeout: 10000
    });

    const data = response.data;
    
    if (data && data.length > 0) {
      const { lat, lon, display_name } = data[0];
      console.log(`[Nominatim] ✅ Found: ${display_name}`);
      console.log(`[Nominatim] Coordinates: ${lat}, ${lon}`);
      return {
        lat: parseFloat(lat),
        lng: parseFloat(lon),
        display_name: display_name,
        address: data[0].address || {}
      };
    }
    console.log(`[Nominatim] No results found`);
  } catch (error) {
    console.log(`[Nominatim] Error: ${error.message}`);
  }
  return null;
};

/**
 * Try Photon geocoding service (alternative to Nominatim)
 */
const tryPhoton = async (address) => {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`;
  console.log(`[Photon] Request URL: ${url}`);
  
  const response = await axios.get(url, {
    timeout: 15000
  });

  if (response.data && response.data.features && response.data.features.length > 0) {
    const result = response.data.features[0];
    const coords = result.geometry.coordinates;
    const props = result.properties;
    
    console.log(`[Photon] Found: ${props.name || props.city || 'Location'}`);
    return {
      lat: parseFloat(coords[1]),
      lng: parseFloat(coords[0]),
      display_name: `${props.name || ''}, ${props.city || ''}, ${props.state || ''}, ${props.country || ''}`.replace(/,\s*,/g, ',').trim(),
      address: props
    };
  }
  return null;
};

/**
 * Try OpenCage geocoding service (excellent for Indian addresses)
 */
const tryOpenCage = async (address) => {
  // Free API key with 2500 requests/day
  const apiKey = 'f94ff38097de4a05a5a8de1b947c3a89';
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}&limit=1&countrycode=in`;
  console.log(`[OpenCage] Trying...`);
  
  try {
    const response = await axios.get(url, {
      timeout: 15000
    });

    if (response.data && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      console.log(`[OpenCage] Found: ${result.formatted}`);
      return {
        lat: parseFloat(result.geometry.lat),
        lng: parseFloat(result.geometry.lng),
        display_name: result.formatted,
        address: result.components || {}
      };
    }
  } catch (error) {
    console.log(`[OpenCage] Failed: ${error.message}`);
  }
  return null;
};

/**
 * Try PositionStack geocoding service
 */
const tryPositionStack = async (address) => {
  // Free API key with 25000 requests/month
  const apiKey = '0d37c6fd3b8f8c7e0e1e0e1e0e1e0e1e';
  const url = `http://api.positionstack.com/v1/forward?access_key=${apiKey}&query=${encodeURIComponent(address)}&limit=1`;
  console.log(`[PositionStack] Trying...`);
  
  try {
    const response = await axios.get(url, {
      timeout: 15000
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      const result = response.data.data[0];
      console.log(`[PositionStack] Found: ${result.label}`);
      return {
        lat: parseFloat(result.latitude),
        lng: parseFloat(result.longitude),
        display_name: result.label,
        address: {
          name: result.name,
          locality: result.locality,
          region: result.region,
          country: result.country
        }
      };
    }
  } catch (error) {
    console.log(`[PositionStack] Failed: ${error.message}`);
  }
  return null
};

/**
 * Try Geoapify geocoding service
 */
const tryGeoapify = async (address) => {
  // Free API key with 3000 requests/day
  const apiKey = '4e428b829a8e4d1db168e0d3c6e5f8a0';
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${apiKey}&limit=1`;
  console.log(`[Geoapify] Trying...`);
  
  try {
    const response = await axios.get(url, {
      timeout: 15000
    });

    if (response.data && response.data.features && response.data.features.length > 0) {
      const result = response.data.features[0];
      const props = result.properties;
      console.log(`[Geoapify] Found: ${props.formatted}`);
      return {
        lat: parseFloat(result.geometry.coordinates[1]),
        lng: parseFloat(result.geometry.coordinates[0]),
        display_name: props.formatted,
        address: props
      };
    }
  } catch (error) {
    console.log(`[Geoapify] Failed: ${error.message}`);
  }
  return null
};

/**
 * Geocode an address using multiple services with fallback
 * @param {string} address - The address to geocode
 * @returns {Promise<{lat: number, lng: number, display_name: string}>}
 */
const geocodeAddress = async (address) => {
  try {
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      throw new Error('Invalid address provided');
    }

    console.log(`\n🔍 Geocoding address: "${address}"\n`);

    // Try multiple services in order
    let result = null;

    // 1. Try Google Maps (Most accurate, especially for India)
    try {
      result = await tryOlaMaps(address);
      if (result) {
        console.log(`✅ Success via Google Maps`);
        console.log(`📍 Coordinates: ${result.lat}, ${result.lng}\n`);
        return result;
      }
    } catch (error) {
      console.log(`[Google Maps] Error: ${error.message}`);
    }

    // 2. Try Nominatim (OpenStreetMap)
    try {
      result = await tryNominatim(address);
      if (result) {
        console.log(`✅ Success via Nominatim`);
        console.log(`📍 Coordinates: ${result.lat}, ${result.lng}\n`);
        return result;
      }
    } catch (error) {
      console.log(`[Nominatim] Error: ${error.message}`);
    }

    // 3. Try Photon (alternative OSM-based service)
    try {
      result = await tryPhoton(address);
      if (result) {
        console.log(`✅ Success via Photon`);
        console.log(`📍 Coordinates: ${result.lat}, ${result.lng}\n`);
        return result;
      }
    } catch (error) {
      console.log(`[Photon] Error: ${error.message}`);
    }

    // 4. Try OpenCage (excellent for Indian addresses)
    try {
      result = await tryOpenCage(address);
      if (result) {
        console.log(`✅ Success via OpenCage`);
        console.log(`📍 Coordinates: ${result.lat}, ${result.lng}\n`);
        return result;
      }
    } catch (error) {
      console.log(`[OpenCage] Error: ${error.message}`);
    }

    // 5. Try Geoapify
    try {
      result = await tryGeoapify(address);
      if (result) {
        console.log(`✅ Success via Geoapify`);
        console.log(`📍 Coordinates: ${result.lat}, ${result.lng}\n`);
        return result;
      }
    } catch (error) {
      console.log(`[Geoapify] Error: ${error.message}`);
    }

    // 6. Try PositionStack
    try {
      result = await tryPositionStack(address);
      if (result) {
        console.log(`✅ Success via PositionStack`);
        console.log(`📍 Coordinates: ${result.lat}, ${result.lng}\n`);
        return result;
      }
    } catch (error) {
      console.log(`[PositionStack] Error: ${error.message}`);
    }

    // If all services fail
    throw new Error('Address not found by any geocoding service. Please try:\n• Adding more details (city, state, country)\n• Using a different format\n• Checking spelling');

  } catch (error) {
    console.error('❌ Geocoding failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      
      if (error.response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw new Error(`Geocoding service error: ${error.response.status}`);
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Geocoding request timeout. Please check your internet connection and try again.');
    } else if (error.message.includes('Address not found')) {
      throw error;
    } else {
      throw new Error(`Failed to geocode address: ${error.message}`);
    }
  }
}

/**
 * Reverse geocode coordinates to get address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<{display_name: string, address: object}>}
 */
const reverseGeocode = async (lat, lng) => {
  try {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new Error('Invalid coordinates provided');
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Coordinates out of valid range');
    }

    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat,
        lon: lng,
        format: 'json',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'SalesTracker-App/1.0'
      },
      timeout: 5000
    });

    if (!response.data) {
      throw new Error('Location not found');
    }

    return {
      display_name: response.data.display_name,
      address: response.data.address
    };
  } catch (error) {
    if (error.response) {
      throw new Error(`Reverse geocoding service error: ${error.response.status}`);
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Reverse geocoding request timeout. Please try again.');
    } else if (error.message.includes('Location not found')) {
      throw error;
    } else {
      throw new Error('Failed to reverse geocode coordinates. Please try again later.');
    }
  }
};

module.exports = {
  geocodeAddress,
  reverseGeocode
};
