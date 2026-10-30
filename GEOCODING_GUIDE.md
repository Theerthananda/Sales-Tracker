# Geocoding Feature Guide

## Overview
The admin can now convert addresses to latitude/longitude coordinates automatically when assigning locations to salespersons.

## How to Use

### 1. Install Dependencies
First, install the required `axios` package in the backend:
```bash
cd backend
npm install
```

### 2. Restart Backend Server
After installing dependencies, restart your backend server:
```bash
npm run dev
# or
npm start
```

### 3. Use the Feature
1. Navigate to **Assign Location** page in admin dashboard
2. For each location, you'll see an **Address** input field (highlighted in blue)
3. Enter the address (e.g., "Vidyavardhaka College of Engineering, Mysore, Karnataka, India")
4. Click the **"Find"** button
5. The system will automatically fill in the **Latitude** and **Longitude** fields

## Address Format Tips

### ✅ Good Address Formats
- **Full addresses**: "Vidyavardhaka College of Engineering, Mysore, Karnataka, India"
- **With landmarks**: "India Gate, New Delhi, India"
- **Street addresses**: "123 MG Road, Bangalore, Karnataka, India"
- **Business names with location**: "Taj Mahal, Agra, Uttar Pradesh, India"

### 📝 Tips for Better Results
1. **Include city and state**: "Mysore, Karnataka" is better than just "Mysore"
2. **Add country for international**: Always include "India" for Indian addresses
3. **Use full names**: "Karnataka" instead of "KA"
4. **Be specific**: Include landmark or area name

### Example Addresses to Test
```
Vidyavardhaka College of Engineering, Mysore, Karnataka, India
Infosys Campus, Electronic City, Bangalore, Karnataka, India
Gateway of India, Mumbai, Maharashtra, India
Red Fort, Delhi, India
Mysore Palace, Mysore, Karnataka, India
```

## Troubleshooting

### "Address not found" Error
**Solutions:**
- Add more details (city, state, country)
- Try different spelling
- Use English names
- Include nearby landmarks

### Timeout Error
**Solutions:**
- Check internet connection
- Wait a moment and try again
- The geocoding service might be busy

### Wrong Coordinates
**Solutions:**
- Be more specific in the address
- Manually adjust the coordinates after geocoding
- Try a different address format

## Technical Details

### Geocoding Service
- Uses **Nominatim** (OpenStreetMap's free geocoding API)
- No API key required
- Rate limit: ~1 request per second
- Timeout: 10 seconds

### Features
- **Automatic fallback**: If first search fails, tries alternative search
- **Country prioritization**: Prioritizes Indian addresses when "India" is in the query
- **Multiple results**: Checks top 5 results for best match
- **Error logging**: Backend logs all geocoding attempts for debugging

### API Endpoint
```
POST /admin/geocode
Body: { "address": "Your address here" }
Response: {
  "success": true,
  "data": {
    "lat": 12.3456,
    "lng": 76.5432,
    "display_name": "Full formatted address",
    "address": { /* detailed address components */ }
  }
}
```

## Manual Override
You can still manually enter or adjust coordinates:
1. Use the geocoding feature to get approximate coordinates
2. Manually adjust the lat/lng fields if needed
3. The manual input fields are always available

## Notes
- The geocoding feature is optional - you can still enter coordinates manually
- Geocoding works best with well-known places and complete addresses
- For very specific or new locations, manual entry might be more accurate
