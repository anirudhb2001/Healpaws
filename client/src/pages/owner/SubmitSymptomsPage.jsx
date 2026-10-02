import React, { useState, useEffect } from "react";
import { redirect, useLocation, useNavigate } from "react-router-dom";
import { Upload, Activity, Send, AlertCircle, CheckCircle, Loader, Info } from "lucide-react";
import AppLayout from "../layouts/AppLayout";

const API_URL = "http://localhost:5000/api";

export default function SubmitSymptomsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Receive pet from navigation state
  const pet = location.state?.pet;

  const [symptoms, setSymptoms] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [aiPrediction, setAiPrediction] = useState(null);
  const [showPrediction, setShowPrediction] = useState(false);

  // Define species that support AI image analysis
  const AI_SUPPORTED_SPECIES = ['dog', 'cat', 'cow'];

  // Check if current pet species supports image upload
  const supportsImageUpload = pet && AI_SUPPORTED_SPECIES.includes(pet.species?.toLowerCase());

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-dismiss error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // If user opened this page manually OR pet missing
  if (!pet) {
    return (
      <AppLayout title="Submit Symptoms" role="owner">
        <div className="text-center py-5">
          <h4 className="text-danger">No pet selected</h4>
          <p className="text-muted">
            Please go back to <strong>My Pets</strong> and select a pet.
          </p>
          <button
            className="btn btn-success mt-3"
            onClick={() => navigate("/app/owner/pets")}
          >
            Go to My Pets
          </button>
        </div>
      </AppLayout>
    );
  }

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  // Helper function to extract diagnosis text from AI prediction
  const getDiagnosisText = (prediction) => {
    if (!prediction) return null;

    // If it's a string, return as is
    if (typeof prediction === 'string') {
      return prediction;
    }

    // If it's an object, extract the diagnosis field
    if (typeof prediction === 'object' && prediction.diagnosis) {
      return prediction.diagnosis;
    }

    return null;
  };

  const getAISeverity = (prediction) => {
    if (!prediction) {
      return null;
    }

    // Get the diagnosis text
    const diagnosisText = getDiagnosisText(prediction);

    if (!diagnosisText || diagnosisText === "Awaiting analysis" || diagnosisText === "Pending veterinary review") {
      return null;
    }

    const pred = diagnosisText.toLowerCase();

    if (pred.includes("emergency") || pred.includes("critical") || pred.includes("severe") || pred.includes("urgent")) {
      return {
        level: "high",
        color: "danger",
        icon: "🚨",
        bgColor: "#fff5f5",
        borderColor: "#dc3545",
        message: "Urgent attention recommended"
      };
    } else if (pred.includes("moderate") || pred.includes("concern") || pred.includes("attention")) {
      return {
        level: "medium",
        color: "warning",
        icon: "⚠️",
        bgColor: "#fff9f0",
        borderColor: "#ffc107",
        message: "Veterinary consultation recommended"
      };
    }
    return {
      level: "low",
      color: "info",
      icon: "ℹ️",
      bgColor: "#f0f9ff",
      borderColor: "#0dcaf0",
      message: "Monitoring recommended"
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    setShowPrediction(false);

    try {
      const stored = JSON.parse(localStorage.getItem("healpaws_user"));
      const ownerId = stored?._id || stored?.id;

      if (!ownerId) throw new Error("User not logged in");

      // Build form data for upload
      const formData = new FormData();
      formData.append("ownerId", ownerId);
      formData.append("petId", pet._id);
      formData.append("petName", pet.name || "");
      formData.append("symptoms", symptoms);

      // Only append files if species supports image upload
      if (supportsImageUpload && files.length > 0) {
        files.forEach((file) => {
          formData.append("media", file);
        });
      }

      const res = await fetch(`${API_URL}/consultations/submit`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit symptoms");
      }

      // Extract AI prediction from response
      const prediction = data.consultation?.aiPrediction || "Analysis complete";
      console.log("AI Prediction received:", JSON.stringify(prediction, null, 2));
      setAiPrediction(prediction);
      setShowPrediction(true);
      setSuccess("Symptoms submitted successfully!");

      // Wait 5 seconds to show prediction before redirecting
      setTimeout(() => {
        navigate("/app/owner/appointments");
      }, 5000);

    } catch (err) {
      console.error("Submit symptoms error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const severity = aiPrediction ? getAISeverity(aiPrediction) : null;
  const diagnosisText = getDiagnosisText(aiPrediction);

  // Helper function to render AI prediction details
  const renderPredictionDetails = () => {
    if (!aiPrediction) return null;

    // If it's just a string, display it
    if (typeof aiPrediction === 'string') {
      return <p className="mb-2" style={{ fontSize: "14px" }}>{aiPrediction}</p>;
    }

    // If it's an object with structured data
    if (typeof aiPrediction === 'object') {
      const diagnosis = aiPrediction.diagnosis || "Analysis complete";
      const confidence = aiPrediction.confidence;
      const recommendations = aiPrediction.recommendations || [];

      return (
        <div>
          <p className="mb-2" style={{ fontSize: "14px" }}>
            {diagnosis}
          </p>

          {confidence !== null && confidence !== undefined && confidence > 0 && (
            <p className="mb-2 text-muted small">
              Confidence: {confidence.toFixed(1)}%
            </p>
          )}

          {recommendations.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 small fw-semibold">Recommendations:</p>
              <ul className="mb-0 small" style={{ fontSize: "13px" }}>
                {recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <AppLayout title="Submit Symptoms" role="owner">
      <div className="row justify-content-center">
        <div className="col-lg-8">

          {/* Success Message */}
          {success && (
            <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
              <strong>Success!</strong> {success}
              <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
              <strong>Error!</strong> {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}

          {/* AI Prediction Card */}
          {showPrediction && aiPrediction && diagnosisText && diagnosisText !== "Pending veterinary review" && (
            <div className="card border-0 shadow-sm mb-4" style={{
              borderLeft: severity ? `4px solid ${severity.borderColor}` : "4px solid #55db79"
            }}>
              <div className="card-body">
                <div className="d-flex align-items-start mb-3">
                  <CheckCircle size={24} className="text-success me-2 flex-shrink-0 mt-1" />
                  <div className="flex-grow-1">
                    <h5 className="mb-1 text-success">Analysis Complete!</h5>
                    <p className="text-muted mb-0 small">
                      Your consultation has been created. Redirecting to appointments...
                    </p>
                  </div>
                </div>

                {severity && (
                  <div
                    className="alert mb-0"
                    style={{
                      backgroundColor: severity.bgColor,
                      borderColor: severity.borderColor,
                      borderWidth: "1px",
                      borderStyle: "solid"
                    }}
                  >
                    <div className="d-flex align-items-start">
                      <span className="me-2" style={{ fontSize: "24px" }}>
                        {severity.icon}
                      </span>
                      <div className="flex-grow-1">
                        <h6 className={`text-${severity.color} mb-2 fw-bold`}>
                          {supportsImageUpload ? 'AI Analysis Result' : 'Symptom Analysis'}
                        </h6>
                        {renderPredictionDetails()}
                        <div
                          className={`badge bg-${severity.color} bg-opacity-25 text-${severity.color}`}
                        >
                          {severity.message}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Show simple success message if diagnosis is Unknown */}
          {showPrediction && aiPrediction && (diagnosisText === "Unknown" || !diagnosisText) && (
            <div className="card border-0 shadow-sm mb-4" style={{
              borderLeft: "4px solid #55db79"
            }}>
              <div className="card-body">
                <div className="d-flex align-items-start">
                  <CheckCircle size={24} className="text-success me-2 flex-shrink-0 mt-1" />
                  <div className="flex-grow-1">
                    <h5 className="mb-1 text-success">Consultation Created!</h5>
                    <p className="text-muted mb-0">
                      Your symptoms have been submitted successfully. A veterinarian will review your case shortly. Redirecting to appointments...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">

              {/* Pet Info */}
              <div className="mb-4">
                <h5 className="fw-bold mb-3">Pet Information</h5>

                <div className="bg-light p-3 rounded-3">
                  <div className="d-flex align-items-center">

                    <div className="me-3">
                      {pet.petPhoto ? (
                        <img
                          src={`http://localhost:5000/${pet.petPhoto}`}
                          alt={pet.name}
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid #55db79"
                          }}
                        />
                      ) : (
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle"
                          style={{
                            width: "80px",
                            height: "80px",
                            backgroundColor: "#e1f5ec",
                            fontSize: "40px"
                          }}
                        >
                          {pet.species === "dog"
                            ? "🐕"
                            : pet.species === "cat"
                              ? "🐈"
                              : pet.species === "bird"
                                ? "🦜"
                                : pet.species === "cow"
                                  ? "🐄"
                                  : "🐾"}
                        </div>
                      )}
                    </div>

                    <div>
                      <h6 className="mb-1">{pet.name}</h6>
                      <small className="text-muted">
                        {pet.breed} • {pet.gender} • {pet.age || "N/A"} years
                      </small>
                      <div className="mt-1">
                        <span className="badge bg-success bg-opacity-25 text-success">
                          {pet.species?.charAt(0).toUpperCase() + pet.species?.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Availability Notice */}
              {!supportsImageUpload && (
                <div className="alert alert-info d-flex align-items-start mb-4">
                  <Info size={20} className="me-2 flex-shrink-0 mt-1" />
                  <div>
                    <strong>Note:</strong> AI image analysis is currently available only for Dogs, Cats, and Cows.
                    Please describe your pet's symptoms in detail below. A veterinarian will review your case.
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="alert alert-info d-flex align-items-center mb-4">
                  <Loader size={20} className="me-2 spinner-border spinner-border-sm" />
                  <div>
                    <strong>Processing your submission...</strong>
                    <br />
                    <small>
                      {supportsImageUpload
                        ? "AI is analyzing the symptoms and images. This may take a moment."
                        : "Submitting symptoms for veterinarian review..."}
                    </small>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>

                {/* Symptoms */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Describe Symptoms <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows="5"
                    placeholder="Please describe your pet's symptoms in detail (e.g., vomiting, lethargy, loss of appetite, unusual behavior, etc.)"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    required
                    disabled={loading || showPrediction}
                  ></textarea>
                  <small className="text-muted">
                    Be as specific as possible to help our {supportsImageUpload ? 'AI and veterinarians' : 'veterinarians'} provide better care.
                  </small>
                </div>

                {/* File Upload - Only show for supported species */}
                {supportsImageUpload && (
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      Upload Images/Videos (Optional)
                    </label>
                    <div className="border border-2 border-dashed rounded-3 p-4 text-center">
                      <Upload size={32} className="text-muted mb-2" />
                      <p className="text-muted mb-2">
                        Upload photos or videos to help AI analyze your pet's condition
                      </p>

                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        className="form-control"
                        onChange={handleFileChange}
                        disabled={loading || showPrediction}
                      />

                      {files.length > 0 && (
                        <div className="mt-3">
                          <small className="text-success fw-semibold">
                            ✓ {files.length} file(s) selected for AI analysis
                          </small>
                          <div className="mt-2">
                            {files.map((file, idx) => (
                              <span key={idx} className="badge bg-light text-dark me-2 mb-2">
                                {file.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <small className="text-muted d-block mt-2">
                      <strong>Tip:</strong> Clear, well-lit images help our AI provide more accurate predictions.
                    </small>
                  </div>
                )}

                {/* Info Box */}
                <div className="alert alert-light border">
                  <Activity size={18} className="me-2" />
                  <strong>What happens next?</strong>
                  <ul className="mb-0 mt-2 small">
                    {supportsImageUpload ? (
                      <>
                        <li>Our AI will analyze your pet's symptoms and images</li>
                        <li>You'll receive an initial assessment</li>
                        <li>You can then schedule an appointment with a veterinarian</li>
                      </>
                    ) : (
                      <>
                        <li>A veterinarian will review your pet's symptoms</li>
                        <li>You'll be able to schedule an appointment</li>
                        <li>The vet will provide professional diagnosis and treatment</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="d-flex gap-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate("/app/owner/pets")}
                    disabled={loading || showPrediction}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-success flex-grow-1"
                    disabled={loading || showPrediction}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {supportsImageUpload ? 'Analyzing with AI...' : 'Submitting...'}
                      </>
                    ) : showPrediction ? (
                      <>
                        <CheckCircle size={18} className="me-2" />
                        Submitted Successfully
                      </>
                    ) : (
                      <>
                        <Send size={18} className="me-2" />
                        {supportsImageUpload ? 'Submit for AI Analysis' : 'Submit Symptoms'}
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}