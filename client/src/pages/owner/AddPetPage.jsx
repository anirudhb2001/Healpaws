import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import './AddPetPage.css'
import { Camera, Plus, Save, X, Upload, FileText } from 'lucide-react';

const AddPetPage = ({ navigateBack, petData }) => {
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    species: '',
    age: '',
    weight: '',
    gender: 'male',
    color: '',
    microchipId: '',
    dateOfBirth: '',
    allergies: '',
    medications: '',
    specialNeeds: '',
    vaccinationHistory: '',
    pastConsultations: ''
  });

  const [petPhoto, setPetPhoto] = useState(null);
  const [petPhotoPreview, setPetPhotoPreview] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Image cropping states
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  // Load pet data if editing
  useEffect(() => {
    if (petData) {
      setFormData({
        name: petData.name || '',
        breed: petData.breed || '',
        species: petData.species || '',
        age: petData.age || '',
        weight: petData.weight || '',
        gender: petData.gender || 'male',
        color: petData.color || '',
        microchipId: petData.microchipId || '',
        dateOfBirth: petData.dateOfBirth ? petData.dateOfBirth.split('T')[0] : '',
        allergies: petData.allergies || '',
        medications: petData.medications || '',
        specialNeeds: petData.specialNeeds || '',
        vaccinationHistory: petData.vaccinationHistory || '',
        pastConsultations: petData.pastConsultations || ''
      });

      // Set existing photo preview if available
      if (petData.petPhoto) {
        setPetPhotoPreview(`http://localhost:5000/${petData.petPhoto}`);
      }
    }
  }, [petData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle pet photo selection (before cropping)
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Callback when crop is complete
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Create cropped image
  const createCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      setPetPhotoPreview(croppedImage.preview);
      setPetPhoto(croppedImage.file);
      setShowCropModal(false);
      setImageSrc(null);
    } catch (e) {
      console.error('Error cropping image:', e);
    }
  };

  // Cancel cropping
  const handleCancelCrop = () => {
    setShowCropModal(false);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  // Handle document uploads
  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    setDocuments(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Get ownerId from localStorage
      const userData = JSON.parse(localStorage.getItem('healpaws_user'));
      const ownerId = userData?._id || userData?.id;

      if (!ownerId) {
        setError('User not logged in. Please login first.');
        setLoading(false);
        return;
      }

      // Create FormData object
      const formDataToSend = new FormData();

      // Append ownerId
      formDataToSend.append('ownerId', ownerId);

      // Append all required text fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('species', formData.species);
      formDataToSend.append('breed', formData.breed);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('weight', formData.weight);

      // Append optional fields (only if they have values)
      if (formData.dateOfBirth) formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      if (formData.age) formDataToSend.append('age', formData.age);
      if (formData.color) formDataToSend.append('color', formData.color);
      if (formData.microchipId) formDataToSend.append('microchipId', formData.microchipId);
      if (formData.allergies) formDataToSend.append('allergies', formData.allergies);
      if (formData.medications) formDataToSend.append('medications', formData.medications);
      if (formData.specialNeeds) formDataToSend.append('specialNeeds', formData.specialNeeds);
      if (formData.vaccinationHistory) formDataToSend.append('vaccinationHistory', formData.vaccinationHistory);
      if (formData.pastConsultations) formDataToSend.append('pastConsultations', formData.pastConsultations);

      // Append pet photo if uploaded
      if (petPhoto) {
        formDataToSend.append('petPhoto', petPhoto);
      }

      // Append documents if uploaded
      if (documents.length > 0) {
        documents.forEach((doc) => {
          formDataToSend.append('documents', doc);
        });
      }

      // Determine if we're updating or creating
      const url = petData 
        ? `http://localhost:5000/api/pets/${petData._id}` 
        : 'http://localhost:5000/api/pets';
      
      const method = petData ? 'PUT' : 'POST';

      // Make API call to backend
      const response = await fetch(url, {
        method: method,
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(petData ? 'Pet profile updated successfully!' : 'Pet profile saved successfully!');
        
        // Reset form
        setFormData({
          name: '',
          breed: '',
          species: '',
          age: '',
          weight: '',
          gender: 'male',
          color: '',
          microchipId: '',
          dateOfBirth: '',
          allergies: '',
          medications: '',
          specialNeeds: '',
          vaccinationHistory: '',
          pastConsultations: ''
        });
        setPetPhoto(null);
        setPetPhotoPreview(null);
        setDocuments([]);
        
        // Navigate back after a short delay to show success message
        setTimeout(() => {
          if (navigateBack) navigateBack();
        }, 1500);
      } else {
        setError(data.message || 'Failed to save pet profile');
      }
    } catch (error) {
      console.error('Error saving pet:', error);
      setError('Failed to save pet profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="fw-bold mb-0">{petData ? 'Edit Pet Profile' : 'Register New Pet'}</h5>
            <button
              className="btn btn-light"
              type="button"
              onClick={() => navigateBack()}
            >
              <X size={18} />
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <strong>Success!</strong> {success}
              <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <strong>Error!</strong> {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Photo Upload */}
            <div className="text-center mb-4">
              <div className="d-inline-block position-relative">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden"
                  style={{ 
                    width: '120px', 
                    height: '120px', 
                    cursor: 'pointer', 
                    backgroundColor: '#e2f0ecff'
                  }}
                  onClick={() => document.getElementById('petPhotoInput').click()}
                >
                  {petPhotoPreview ? (
                    <img 
                      src={petPhotoPreview} 
                      alt="Pet Preview" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                    />
                  ) : (
                    <Camera size={32} className="text-muted" />
                  )}
                </div>
                <input
                  id="petPhotoInput"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn btn-success btn-sm rounded-circle position-absolute"
                  style={{
                    bottom: '5px',
                    right: '5px',
                    width: '35px',
                    height: '35px',
                    padding: '0'
                  }}
                  onClick={() => document.getElementById('petPhotoInput').click()}
                >
                  <Plus size={18} />
                </button>
              </div>
              <p className="text-muted mt-2 mb-0">
                {petPhoto ? `Selected: ${petPhoto.name}` : petData && petData.petPhoto ? 'Click to change photo' : 'Upload pet photo'}
              </p>
            </div>

            {/* Basic Info */}
            <h6 className="fw-bold mb-3 pb-2 border-bottom h6-color">Basic Information:</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Pet Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Species *</label>
                <input
                  name="species"
                  className="form-control"
                  value={formData.species}
                  onChange={handleInputChange}
                  placeholder='e.g., Dog, Cat, Cow'
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Breed *</label>
                <input
                  type="text"
                  name="breed"
                  className="form-control"
                  value={formData.breed}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Gender *</label>
                <select
                  name="gender"
                  className="form-select"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  className="form-control"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Age (years)</label>
                <input
                  type="number"
                  name="age"
                  className="form-control"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Weight (kg) *</label>
                <input
                  type="number"
                  name="weight"
                  className="form-control"
                  value={formData.weight}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Color</label>
                <input
                  type="text"
                  name="color"
                  className="form-control"
                  value={formData.color}
                  onChange={handleInputChange}
                  placeholder="e.g., Brown, White, Black"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Microchip ID</label>
                <input
                  type="text"
                  name="microchipId"
                  className="form-control"
                  value={formData.microchipId}
                  onChange={handleInputChange}
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Health Info */}
            <h6 className="fw-bold mb-3 pb-2 border-bottom h6-color">Health Details:</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Allergies</label>
                <input
                  type="text"
                  name="allergies"
                  className="form-control"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  placeholder="e.g., Pollen, Dairy"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Medications</label>
                <input
                  type="text"
                  name="medications"
                  className="form-control"
                  value={formData.medications}
                  onChange={handleInputChange}
                  placeholder="Current medications"
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Special Needs</label>
                <textarea
                  name="specialNeeds"
                  className="form-control"
                  rows="2"
                  value={formData.specialNeeds}
                  onChange={handleInputChange}
                  placeholder="Any special care requirements"
                ></textarea>
              </div>
            </div>

            {/* Vaccination History */}
            <h6 className="fw-bold mb-3 pb-2 border-bottom">Vaccination History</h6>
            <div className="mb-4">
              <textarea
                name="vaccinationHistory"
                className="form-control"
                rows="3"
                placeholder="Enter vaccination details (e.g., Rabies - 2024, Parvo - 2025)"
                value={formData.vaccinationHistory}
                onChange={handleInputChange}
              ></textarea>
            </div>

            {/* Past Consultations */}
            <h6 className="fw-bold mb-3 pb-2 border-bottom">Past Consultations</h6>
            <div className="mb-4">
              <textarea
                name="pastConsultations"
                className="form-control"
                rows="3"
                placeholder="Add details of previous vet visits or diagnoses"
                value={formData.pastConsultations}
                onChange={handleInputChange}
              ></textarea>
            </div>

            {/* Upload Documents */}
            <h6 className="fw-bold mb-3 pb-2 border-bottom">Documents (Upload vaccination certificates, prescriptions, or test results)</h6>
            <div className="mb-4 text-center border border-2 border-dashed rounded-3 p-4">
              <Upload size={32} className="text-muted mb-2" />
              <p className="text-muted mb-2">Drag & drop files or click to upload</p>
              <input 
                type="file" 
                multiple 
                className="form-control"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleDocumentUpload}
              />
              {documents.length > 0 && (
                <div className="mt-3">
                  <p className="text-success fw-semibold">{documents.length} file(s) selected:</p>
                  <ul className="list-unstyled text-start">
                    {documents.map((doc, index) => (
                      <li key={index} className="text-muted small">
                        <FileText size={14} className="me-2" />
                        {doc.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="d-flex gap-3 pt-3 border-top">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigateBack()}
                disabled={loading}
              >
                <X size={18} className="me-2" /> Cancel
              </button>
              <button 
                type="submit" 
                className="btn flex-grow-1" 
                style={{background: 'linear-gradient(135deg, #55db79, #33c48f)'}}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {petData ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save size={18} className="me-2" /> {petData ? 'Update Pet Profile' : 'Save Pet Profile'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Crop Modal */}
      {showCropModal && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Crop Pet Photo</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCancelCrop}
                ></button>
              </div>
              <div className="modal-body" style={{ height: '400px', position: 'relative' }}>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="modal-footer">
                <div className="w-100 mb-3">
                  <label className="form-label">Zoom</label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(e.target.value)}
                    className="form-range"
                  />
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCancelCrop}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={createCroppedImage}
                >
                  Save Cropped Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Helper function to create cropped image
const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], 'pet-photo.jpg', { type: 'image/jpeg' });
      const preview = URL.createObjectURL(blob);
      resolve({ file, preview });
    }, 'image/jpeg', 0.9);
  });
};

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

export default AddPetPage;