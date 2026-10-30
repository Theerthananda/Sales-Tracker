import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../api';
import Navbar from '../components/Navbar';
import { UserPlus, MapPin, Plus, Trash2, Send, Search, MapPinned } from 'lucide-react';
import { motion } from 'framer-motion';

function AssignLocation() {
  const [salespersons, setSalespersons] = useState([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [places, setPlaces] = useState([{ name: '', address: '', lat: '', lng: '', radius: 100 }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
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

    fetchSalespersons();
  }, [navigate]);

  const fetchSalespersons = async () => {
    try {
      const response = await adminAPI.getAllSalespersons();
      
      // Handle different response formats
      if (response.data.success) {
        setSalespersons(response.data.data || []);
      } else if (Array.isArray(response.data)) {
        setSalespersons(response.data);
      } else {
        setSalespersons([]);
      }
    } catch (error) {
      console.error('Failed to fetch salespersons:', error);
      setSalespersons([]);
    }
  };

  const addPlace = () => {
    setPlaces([...places, { name: '', address: '', lat: '', lng: '', radius: 100 }]);
  };

  const removePlace = (index) => {
    setPlaces(places.filter((_, i) => i !== index));
  };

  const updatePlace = (index, field, value) => {
    const updatedPlaces = [...places];
    updatedPlaces[index][field] = value;
    setPlaces(updatedPlaces);
  };

  const geocodeAddress = async (index) => {
    const place = places[index];
    if (!place.address || place.address.trim().length === 0) {
      setMessage('Please enter an address first');
      return;
    }

    setLoading(true);
    setMessage('Searching for address coordinates...');

    try {
      const response = await adminAPI.geocodeAddress(place.address);
      if (response.data.success) {
        const { lat, lng, display_name } = response.data.data;
        const updatedPlaces = [...places];
        updatedPlaces[index].lat = lat;
        updatedPlaces[index].lng = lng;
        // Optionally update the name if it's empty
        if (!updatedPlaces[index].name) {
          updatedPlaces[index].name = display_name.split(',')[0];
        }
        setPlaces(updatedPlaces);
        setMessage(`Found address: ${display_name}\nCoordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to geocode address. Please try:\n• Adding more details (city, state, country)\n• Using a different format\n• Checking spelling';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate inputs
      if (!selectedSalesperson) {
        setMessage('Please select a salesperson');
        setLoading(false);
        return;
      }

      if (!date) {
        setMessage('Please select a date');
        setLoading(false);
        return;
      }

      if (places.some(p => !p.name || !p.lat || !p.lng)) {
        setMessage('Please fill in all location details (name, latitude, longitude)');
        setLoading(false);
        return;
      }

      const formattedPlaces = places.map(p => ({
        name: p.name,
        lat: parseFloat(p.lat),
        lng: parseFloat(p.lng),
        radius: parseInt(p.radius)
      }));

      const salespersonName = salespersons.find(sp => sp._id === selectedSalesperson)?.name || 'Salesperson';

      const response = await adminAPI.assignLocation({
        salespersonId: selectedSalesperson,
        date: new Date(date),
        places: formattedPlaces
      });

      setMessage(`Assignment created successfully. ${salespersonName} has been assigned ${places.length} location(s) for ${new Date(date).toLocaleDateString()}`);
      
      // Reset form
      setPlaces([{ name: '', address: '', lat: '', lng: '', radius: 100 }]);
      setSelectedSalesperson('');
      setDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to assign location';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

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
            <UserPlus className="w-10 h-10 text-green-400" />
            Assign Location
          </h1>
          <p className="text-slate-500 text-sm">Search and select a salesperson to assign locations</p>
        </motion.div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl mb-6 ${
              message.toLowerCase().includes('success')
                ? 'bg-green-50 border-l-4 border-green-500 text-green-700'
                : message.toLowerCase().includes('searching')
                  ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700'
                  : 'bg-red-50 border-l-4 border-red-500 text-red-700'
            }`}
          >
            <p className="font-medium whitespace-pre-line">{message}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Salesperson
              </label>
              <select
                value={selectedSalesperson}
                onChange={(e) => setSelectedSalesperson(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-300 outline-none"
              >
                <option value="">-- Select Salesperson --</option>
                {Array.isArray(salespersons) && salespersons.map((sp) => (
                  <option key={sp._id} value={sp._id}>
                    {sp.name} ({sp.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-300 outline-none"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-green-400" />
                Locations
              </h3>
              <div className="space-y-4">
                {places.map((place, index) => (
                  <div key={index} className="bg-gray-50 p-6 rounded-xl space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-slate-800">Location {index + 1}</h4>
                      {places.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePlace(index)}
                          className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Place Name</label>
                      <input
                        type="text"
                        value={place.name}
                        onChange={(e) => updatePlace(index, 'name', e.target.value)}
                        placeholder="e.g., Client Office, Retail Store"
                        required
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-300 outline-none"
                      />
                    </div>
                    
                    {/* Address Input with Geocoding */}
                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <MapPinned className="w-4 h-4 text-blue-500" />
                        Address (Auto-fill Coordinates)
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={place.address}
                          onChange={(e) => updatePlace(index, 'address', e.target.value)}
                          placeholder="e.g., 123 Main St, New York, NY 10001"
                          className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-300 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => geocodeAddress(index)}
                          disabled={loading || !place.address}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed sm:whitespace-nowrap w-full sm:w-auto"
                        >
                          <Search className="w-4 h-4" />
                          Find
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        Tip: Enter an address and click "Find" to automatically get coordinates
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={place.lat}
                          onChange={(e) => updatePlace(index, 'lat', e.target.value)}
                          placeholder="e.g., 28.6139"
                          required
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-300 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={place.lng}
                          onChange={(e) => updatePlace(index, 'lng', e.target.value)}
                          placeholder="e.g., 77.2090"
                          required
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-300 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Verification Radius (meters)</label>
                      <input
                        type="number"
                        value={place.radius}
                        onChange={(e) => updatePlace(index, 'radius', e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-300 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addPlace}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors font-semibold"
              >
                <Plus className="w-5 h-5" />
                Add Another Location
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-gradient w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="spinner border-white border-t-transparent w-5 h-5" />
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Assign Locations</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default AssignLocation;
