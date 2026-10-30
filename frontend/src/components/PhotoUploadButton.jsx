import { useState } from 'react';
import { salesAPI } from '../api';

function PhotoUploadButton({ assignmentId, placeId, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            const formData = new FormData();
            formData.append('photo', file);
            formData.append('assignmentId', assignmentId);
            formData.append('placeId', placeId);
            formData.append('lat', latitude);
            formData.append('lng', longitude);

            const response = await salesAPI.uploadPhoto(formData);

            if (response.data.isSuspicious) {
              alert(`Warning: Photo uploaded but location is ${response.data.distance.toFixed(2)}m away from target. This has been marked as suspicious.`);
            } else {
              alert('Photo uploaded successfully! Location verified.');
            }

            if (onSuccess) onSuccess();
          } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload photo');
          } finally {
            setUploading(false);
          }
        },
        (err) => {
          let errorMessage = 'Failed to get your location. ';
          switch(err.code) {
            case err.PERMISSION_DENIED:
              errorMessage += 'Please enable location access in your browser settings.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.';
              break;
            case err.TIMEOUT:
              errorMessage += 'Location request timed out.';
              break;
            default:
              errorMessage += 'Please enable GPS and try again.';
              break;
          }
          setError(errorMessage);
          setUploading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoUpload}
        disabled={uploading}
        id={`photo-upload-${placeId}`}
      />
      <label htmlFor={`photo-upload-${placeId}`} className="photo-upload-label">
        {uploading ? '📤 Uploading...' : '📷 Upload Photo'}
      </label>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default PhotoUploadButton;
