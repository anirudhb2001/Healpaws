import React, { useState, useEffect, useCallback } from "react";
import { IoPaw, IoCloseCircleSharp, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { Country, State, City } from "country-state-city";
import Cropper from "react-easy-crop";
import "./RegisterPopup.css";

const API_URL = "http://localhost:5000/api";

// Helper function to create image from crop
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

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
      resolve(blob);
    }, "image/jpeg");
  });
};

export default function RegisterPopup({ show, onClose }) {
  const [userRole, setUserRole] = useState("owner");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobileno: "",
    country: "",
    countryCode: "",
    state: "",
    stateCode: "",
    city: "",
    profilePicture: null,
    licenseNumber: "",
    specialization: "",
    experience: "",
    clinicName: "",
    idProof: null,
    degreeCertificate: null,
  });

  // Image cropping states
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  // Auto-close alert after 5 seconds
  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert({ show: false, type: '', message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  const handleCountryChange = (e) => {
    const selectedIsoCode = e.target.value;
    const selectedCountry = countries.find((c) => c.isoCode === selectedIsoCode);

    setFormData({
      ...formData,
      country: selectedCountry.name,
      countryCode: selectedCountry.isoCode,
      state: "",
      stateCode: "",
      city: "",
    });

    const fetchedStates = State.getStatesOfCountry(selectedIsoCode);
    setStates(fetchedStates);
    setCities([]);
  };

  const handleStateChange = (e) => {
    const selectedIsoCode = e.target.value;
    const selectedState = states.find((s) => s.isoCode === selectedIsoCode);

    setFormData({
      ...formData,
      state: selectedState.name,
      stateCode: selectedState.isoCode,
      city: "",
    });

    const fetchedCities = City.getCitiesOfState(
      formData.countryCode,
      selectedIsoCode
    );
    setCities(fetchedCities);
  };

  const handleCityChange = (e) => {
    setFormData({ ...formData, city: e.target.value });
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      if (name === "profilePicture") {
        const file = files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setImageSrc(reader.result);
            setShowCropModal(true);
          };
          reader.readAsDataURL(file);
        }
      } else {
        setFormData({ ...formData, [name]: files[0] });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], "profile.jpg", {
        type: "image/jpeg",
      });
      setFormData({ ...formData, profilePicture: croppedFile });
      setPreviewUrl(URL.createObjectURL(croppedBlob));
      setShowCropModal(false);
      setImageSrc(null);
    } catch (e) {
      console.error("Error cropping image:", e);
      setAlert({
        show: true,
        type: 'danger',
        message: 'Error cropping image. Please try again.'
      });
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const closeAlert = () => {
    setAlert({ show: false, type: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ show: false, type: '', message: '' });

    if (formData.password !== formData.confirmPassword) {
      setAlert({
        show: true,
        type: 'danger',
        message: 'Passwords do not match!'
      });
      return;
    }
    if (formData.password.length < 6) {
      setAlert({
        show: true,
        type: 'danger',
        message: 'Password must be at least 6 characters long!'
      });
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append("role", userRole);
      submitData.append("name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("password", formData.password);
      submitData.append("mobileno", formData.mobileno);
      submitData.append("country", formData.country);
      submitData.append("state", formData.state);
      submitData.append("city", formData.city);

      if (formData.profilePicture)
        submitData.append("profilePicture", formData.profilePicture);

      if (userRole === "vet") {
        submitData.append("licenseNumber", formData.licenseNumber);
        submitData.append("specialization", formData.specialization);
        submitData.append("experience", formData.experience);
        submitData.append("clinicName", formData.clinicName);

        if (formData.idProof) submitData.append("idProof", formData.idProof);
        if (formData.degreeCertificate)
          submitData.append("degreeCertificate", formData.degreeCertificate);
      }

      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        body: submitData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAlert({
          show: true,
          type: 'success',
          message: data.message
        });
        
        // Reset form after success
        setTimeout(() => {
          setFormData({
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            mobileno: "",
            country: "",
            countryCode: "",
            state: "",
            stateCode: "",
            city: "",
            profilePicture: null,
            licenseNumber: "",
            specialization: "",
            experience: "",
            clinicName: "",
            idProof: null,
            degreeCertificate: null,
          });
          setPreviewUrl(null);
          setImageSrc(null);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setCroppedAreaPixels(null);
          setShowCropModal(false);
          setStates([]);
          setCities([]);
          onClose();
        }, 2000);
      } else {
        setAlert({
          show: true,
          type: 'danger',
          message: data.message || "Registration failed. Please try again."
        });
      }
    } catch (error) {
      console.error("Network error:", error);
      setAlert({
        show: true,
        type: 'danger',
        message: "Network error. Please check your internet connection and try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    setUserRole(role);
    if (role === "owner") {
      setFormData({
        ...formData,
        licenseNumber: "",
        specialization: "",
        experience: "",
        clinicName: "",
        idProof: null,
        degreeCertificate: null,
      });
    }
  };

  if (!show) return null;

  return (
    <div className="register-overlay">
      <div className="register-popup shadow-lg">
        <button className="close-btn" onClick={onClose} disabled={loading} type="button">
          <IoCloseCircleSharp />
        </button>

        <div className="text-center mb-3">
          <h4 className="fw-bold d-flex align-items-center justify-content-center gap-2">
            <IoPaw /> HealPaws
          </h4>
          <h5 className="fw-bold mt-3">Create Your Account</h5>
          <p className="text-muted small">Join our caring pet community</p>
        </div>

        {/* Bootstrap Alert */}
        {alert.show && (
          <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
            <button 
              type="button" 
              className="btn-close" 
              onClick={closeAlert}
              aria-label="Close"
            ></button>
            {alert.message}
          </div>
        )}

        <div className="tab-buttons mb-4">
          <button
            type="button"
            className={`btn tab-btn ${userRole === "owner" ? "active-tab" : ""}`}
            onClick={() => handleRoleChange("owner")}
            disabled={loading}
          >
            Pet Owner
          </button>
          <button
            type="button"
            className={`btn tab-btn ${userRole === "vet" ? "active-tab" : ""}`}
            onClick={() => handleRoleChange("vet")}
            disabled={loading}
          >
            Veterinarian
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3 text-center">
            <label className="small fw-bold">Profile Picture</label>
            {previewUrl && (
              <div className="mb-2">
                <img
                  src={previewUrl}
                  alt="Profile Preview"
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid #55db79",
                  }}
                />
              </div>
            )}
            <div className="d-flex align-items-center justify-content-center gap-2">
              <input
                type="file"
                accept="image/*"
                name="profilePicture"
                onChange={handleChange}
                className="form-control"
                disabled={loading}
                style={{ maxWidth: "300px" }}
                required
              />
              {formData.profilePicture && (
                <small className="text-success">✓ {formData.profilePicture.name}</small>
              )}
            </div>
          </div>

          <div className="form-container">
            <div className="form-cont1">
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-3 position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Password (min 6 characters)"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  disabled={loading}
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute top-50 end-0 translate-middle-y"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#6c757d",
                    padding: "0 12px",
                    zIndex: 10
                  }}
                >
                  {showPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
                </button>
              </div>

              <div className="mb-3 position-relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Confirm Password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute top-50 end-0 translate-middle-y"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#6c757d",
                    padding: "0 12px",
                    zIndex: 10
                  }}
                >
                  {showConfirmPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
                </button>
              </div>
            </div>

            <div className="form-cont2">
              <div className="mb-3">
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Mobile No."
                  name="mobileno"
                  value={formData.mobileno}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  pattern="[0-9]{10}"
                  title="Please enter a valid 10-digit mobile number"
                />
              </div>

              {/* COUNTRY */}
              <div className="mb-3">
                <select
                  className="form-control"
                  name="country"
                  value={formData.countryCode}
                  onChange={handleCountryChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Country</option>
                  {countries.map((c) => (
                    <option key={c.isoCode} value={c.isoCode}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* STATE */}
              <div className="mb-3">
                <select
                  className="form-control"
                  name="state"
                  value={formData.stateCode}
                  onChange={handleStateChange}
                  disabled={!states.length || loading}
                  required
                >
                  <option value="">Select State</option>
                  {states.map((s) => (
                    <option key={s.isoCode} value={s.isoCode}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* CITY */}
              <div className="mb-3">
                <select
                  className="form-control"
                  name="city"
                  value={formData.city}
                  onChange={handleCityChange}
                  disabled={!cities.length || loading}
                  required
                >
                  <option value="">Select City</option>
                  {cities.map((city, i) => (
                    <option key={i} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Vet Section */}
          {userRole === "vet" && (
            <div className="vet-section mt-4 p-3 rounded border bg-light">
              <h6 className="fw-bold mb-2 text-success">
                Veterinarian Verification
              </h6>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="License Number"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Years of Experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    required
                    min="0"
                    disabled={loading}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Clinic/Hospital Name"
                    name="clinicName"
                    value={formData.clinicName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="small">Upload ID Proof (Image/PDF, max 5MB)</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    name="idProof"
                    onChange={handleChange}
                    required
                    className="form-control"
                    disabled={loading}
                  />
                  {formData.idProof && (
                    <small className="text-success">✓ {formData.idProof.name}</small>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <label className="small">
                    Upload Degree Certificate (Image/PDF, max 5MB)
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    name="degreeCertificate"
                    onChange={handleChange}
                    required
                    className="form-control"
                    disabled={loading}
                  />
                  {formData.degreeCertificate && (
                    <small className="text-success">
                      ✓ {formData.degreeCertificate.name}
                    </small>
                  )}
                </div>
              </div>
              <p className="text-muted small mt-2">
                🕒 Your profile will be reviewed and approved by admin within 48 hours.
              </p>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-success w-100 mt-3"
            style={{
              backgroundColor: loading ? "#ccc" : "#55db79",
              color: "#0b1d4d",
              fontWeight: "600",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Processing...
              </>
            ) : userRole === "vet" ? (
              "Submit for Verification"
            ) : (
              "Register Now"
            )}
          </button>
        </form>
      </div>

      {/* Image Crop Modal */}
      {showCropModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              position: "relative",
              background: "#fff",
              padding: "20px",
              borderRadius: "10px",
              maxWidth: "90%",
              maxHeight: "90%",
            }}
          >
            <h5 className="text-center mb-3">Crop Your Profile Picture</h5>
            <div style={{ position: "relative", width: "300px", height: "300px" }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="d-flex justify-content-center gap-2 mt-3">
              <button
                className="btn btn-success"
                onClick={handleCropConfirm}
                disabled={loading}
              >
                Confirm
              </button>
              <button className="btn btn-secondary" onClick={handleCropCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}