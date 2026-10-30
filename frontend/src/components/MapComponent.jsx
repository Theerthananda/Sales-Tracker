import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import { API_URL } from '../api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';



delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const visitedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const notVisitedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const suspiciousIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const currentLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapComponent({ places = [], currentLocation = null, center = [20.5937, 78.9629], zoom = 5 }) {
  const getIcon = (place) => {
    if (place.visited && !place.verified) return suspiciousIcon;
    if (place.visited) return visitedIcon;
    return notVisitedIcon;
  };

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {currentLocation && (
        <Marker position={[currentLocation.lat, currentLocation.lng]} icon={currentLocationIcon}>
          <Popup>
            <span className="text-xs text-slate-500">Salesperson Location</span>
          </Popup>
        </Marker>
      )}

      {places.map((place, index) => {
        // Draw route from current location to this place
        const routeColor = place.visited 
          ? (place.verified ? '#22c55e' : '#eab308') // green for completed, yellow for suspicious
          : '#ef4444'; // red for not visited
        
        return (
          <div key={place._id}>
            {/* Route line from current location to destination */}
            {currentLocation && (
              <Polyline
                positions={[
                  [currentLocation.lat, currentLocation.lng],
                  [place.lat, place.lng]
                ]}
                color={routeColor}
                weight={4}
                opacity={0.7}
                dashArray={place.visited ? '0' : '10, 10'}
              />
            )}

            <Marker position={[place.lat, place.lng]} icon={getIcon(place)}>
              <Popup>
                <strong>{place.name}</strong>
                <br />
                Status: {place.visited ? (place.verified ? 'Visited' : 'Suspicious') : 'Not Visited'}
                {place.visitedAt && (
                  <>
                    <br />
                    Visited: {new Date(place.visitedAt).toLocaleString()}
                  </>
                )}
                {place.distanceTraveled && (
                  <>
                    <br />
                    Distance: {(place.distanceTraveled / 1000).toFixed(2)} km
                  </>
                )}
                {place.photoUrl && (
                  <>
                    <br />
                    <img src={`${API_URL}${place.photoUrl}`} alt="Proof" style={{ width: '100%', marginTop: '10px' }} />
                  </>
                )}
              </Popup>
            </Marker>
            <Circle
              center={[place.lat, place.lng]}
              radius={place.radius || 100}
              pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
            />
          </div>
        );
      })}
    </MapContainer>
  );
}

export default MapComponent;
