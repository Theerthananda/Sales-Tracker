import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, salesAPI } from '../api';
import Navbar from '../components/Navbar';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, User, CheckCircle, AlertTriangle, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';



const salespersonIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const visitedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
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

function AdminMapView() {
  const [liveLocations, setLiveLocations] = useState([]);
  const [allPlaces, setAllPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (parsedUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    fetchMapData();
    const interval = setInterval(fetchMapData, 30000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchMapData = async () => {
    try {
      const locationsRes = await adminAPI.getLiveLocations();
      setLiveLocations(locationsRes.data);
      
      // Don't fetch places for admin map view - only show salesperson locations
      setAllPlaces([]);
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch map data:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <MapPin className="w-10 h-10 text-green-400" />
            Live Map View
          </h1>
          <p className="text-slate-600">Real-time tracking of all salespersons and their visits</p>
        </motion.div>
        
        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
        >
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-blue-400" />
            <span className="font-semibold text-slate-800">Blue Markers = Salesperson Live Locations</span>
          </div>
        </motion.div>

        {/* Map Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-0 overflow-hidden"
        >
          <div className="h-[600px]">
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
            
            {liveLocations.map((sp) => {
              if (!sp.currentLocation?.lat) return null;
              
              return (
                <Marker 
                  key={sp._id}
                  position={[sp.currentLocation.lat, sp.currentLocation.lng]} 
                  icon={salespersonIcon}
                >
                  <Popup>
                    <div className="p-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {sp.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 leading-tight">{sp.name}</h3>
                          <p className="text-xs text-slate-500">Salesperson</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-slate-600 mb-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-400">Email</span>
                          <span className="text-slate-700">{sp.email}</span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-400">Last Active</span>
                          <span className="text-slate-700">
                            {sp.lastActive ? new Date(sp.lastActive).toLocaleString() : 'Never'}
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-400">Current Location</span>
                          <span className="text-slate-700">
                            {sp.currentLocation.lat.toFixed(4)}, {sp.currentLocation.lng.toFixed(4)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/admin/tracking/${sp._id}`)}
                        className="w-full py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm hover:shadow"
                      >
                        View Full Tracking
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            </MapContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminMapView;
