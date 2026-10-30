import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { salesAPI, API_URL } from '../api';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import VisitReportForm from '../components/VisitReportForm';
import { MapPin, Camera, CheckCircle, ArrowLeft, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';



function VisitPage() {
  const { assignmentId, placeId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [place, setPlace] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [visitStarted, setVisitStarted] = useState(false);
  const [startLocation, setStartLocation] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));

    fetchAssignment();
    getCurrentLocation();
  }, [assignmentId, placeId, navigate]);

  const fetchAssignment = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const response = await salesAPI.getAssignments(userData.id);
      const foundAssignment = response.data.find(a => a._id === assignmentId);
      
      if (foundAssignment) {
        setAssignment(foundAssignment);
        const foundPlace = foundAssignment.places.find(p => p._id === placeId);
        setPlace(foundPlace);
      }
    } catch (err) {
      console.error('Failed to fetch assignment:', err);
    }
  };

  const handleStartVisit = () => {
    if (!currentLocation) return;
    setVisitStarted(true);
    setStartLocation(currentLocation);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleUploadSuccess = () => {
    fetchAssignment();
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  if (!place || !assignment) {
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
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <MapPin className="w-10 h-10 text-green-400" />
            {place.name}
          </h1>
          <p className="text-slate-600">Complete your visit by uploading a photo proof</p>
        </motion.div>
        
        {/* Location Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
        >
          <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Navigation className="w-6 h-6 text-blue-400" />
            Location Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-green-400 mt-1" />
              <div>
                <p className="text-sm font-semibold text-slate-600">Coordinates</p>
                <p className="text-slate-800 font-medium">{place.lat.toFixed(6)}, {place.lng.toFixed(6)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-400 mt-1" />
              <div>
                <p className="text-sm font-semibold text-slate-600">Verification Radius</p>
                <p className="text-slate-800 font-medium">{place.radius}m</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full mt-1 ${place.visited ? 'bg-green-400' : 'bg-orange-400'}`} />
              <div>
                <p className="text-sm font-semibold text-slate-600">Status</p>
                <p className={`font-medium ${place.visited ? 'text-green-600' : 'text-orange-600'}`}>
                  {place.visited ? 'Visited' : 'Not Visited'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Map Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card mb-6 p-0 overflow-hidden relative z-0"
        >
          <div className="h-96 relative z-0">
            <MapComponent 
              places={[place]} 
              currentLocation={currentLocation} 
              center={[place.lat, place.lng]} 
              zoom={15} 
            />
          </div>
        </motion.div>

        {/* Start Visit / Visit Report Form */}
        {!place.visited && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            {!visitStarted ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-1">Start Visit</h2>
                  <p className="text-slate-600 text-sm">
                    Once you reach the location, tap Start to lock your starting GPS position before filling the visit report.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartVisit}
                  disabled={!currentLocation}
                  className="btn-gradient flex items-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Navigation className="w-5 h-5" />
                  Start Visit
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Visit In Progress</h2>
                    {startLocation && (
                      <p className="text-xs text-slate-500 mt-1">
                        Start coordinates locked at: {startLocation.lat.toFixed(6)}, {startLocation.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
                {currentLocation && (
                  <VisitReportForm 
                    assignmentId={assignmentId} 
                    placeId={placeId}
                    currentLocation={currentLocation}
                    startLocation={startLocation}
                    onSuccess={handleUploadSuccess}
                  />
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Visit Complete Section */}
        {place.visited && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Visit Complete!</h3>
              <p className="text-green-600 font-medium mb-6">
                This location has been visited and verified successfully.
              </p>
              {place.photoUrl && (
                <img 
                  src={`${API_URL}${place.photoUrl}`} 
                  alt="Visit proof" 
                  className="w-full max-w-md mx-auto rounded-2xl shadow-lg"
                />
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default VisitPage;
