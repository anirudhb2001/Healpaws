import React, { useState } from "react";
import { X, User, Calendar, Clock, FileText, DollarSign, Video, Stethoscope, AlertCircle } from "lucide-react";

export default function ConsultationViewModal({ visible, onClose, consultation }) {
  const [preview, setPreview] = useState(null);

  if (!visible || !consultation) return null;

  const pet = consultation.petId;
  const owner = consultation.ownerId;

  const correctPath = (file) => `http://localhost:5000/${file}`;

  // Enhanced helper function to safely get AI prediction with better formatting
  const getAIPrediction = (aiPrediction) => {
    if (!aiPrediction) {
      return {
        display: 'Awaiting AI analysis...',
        hasData: false
      };
    }

    // If it's already a string
    if (typeof aiPrediction === 'string') {
      return {
        display: aiPrediction,
        hasData: true
      };
    }

    // If it's an object, try to extract meaningful data
    if (typeof aiPrediction === 'object') {
      // Check for common prediction object structures
      if (aiPrediction.prediction) {
        return {
          display: String(aiPrediction.prediction),
          confidence: aiPrediction.confidence,
          hasData: true
        };
      }

      if (aiPrediction.disease || aiPrediction.diagnosis) {
        return {
          display: String(aiPrediction.disease || aiPrediction.diagnosis),
          confidence: aiPrediction.confidence,
          hasData: true
        };
      }

      // If object has multiple properties, format them nicely
      const entries = Object.entries(aiPrediction);
      if (entries.length > 0) {
        const formatted = entries
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        return {
          display: formatted,
          hasData: true
        };
      }
    }

    // Fallback
    return {
      display: 'Analysis data format not recognized',
      hasData: false
    };
  };

  const aiResult = getAIPrediction(consultation.aiPrediction || consultation.aiResult);

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'scheduled': 'info',
      'confirmed': 'success',
      'in-progress': 'primary',
      'completed': 'secondary',
      'cancelled': 'danger',
      'declined': 'danger'
    };
    return colors[status] || 'secondary';
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      >
        <div
          className="card shadow-lg border-0"
          style={{
            width: "700px",
            maxWidth: "95vw",
            maxHeight: "90vh",
            overflowY: "auto",
            borderRadius: "16px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="card-header border-0 text-white position-relative"
            style={{
              background: "linear-gradient(135deg, #198754 0%, #146c43 100%)",
              padding: "1.5rem",
              borderRadius: "16px 16px 0 0"
            }}
          >
            <h4 className="mb-0 fw-bold">Consultation Details</h4>
            <button
              onClick={onClose}
              className="btn btn-light btn-sm position-absolute"
              style={{
                top: "1.25rem",
                right: "1.25rem",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div className="card-body p-4">
            {/* Pet Information Card */}
            <div className="card border-0 shadow-sm mb-4" style={{ background: "linear-gradient(to right, #f8f9fa, #ffffff)" }}>
              <div className="card-body text-center p-4">
                <div className="position-relative d-inline-block mb-3">
                  <img
                    src={
                      pet?.petPhoto
                        ? correctPath(pet.petPhoto)
                        : "https://cdn-icons-png.flaticon.com/512/194/194279.png"
                    }
                    alt="Pet"
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "4px solid #198754",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                    }}
                  />
                </div>
                <h4 className="fw-bold mb-2">{pet?.name || "Unknown Pet"}</h4>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <span className="badge bg-light text-dark px-3 py-2">
                    {pet?.species || "N/A"}
                  </span>
                  <span className="badge bg-light text-dark px-3 py-2">
                    {pet?.breed || "N/A"}
                  </span>
                  <span className="badge bg-light text-dark px-3 py-2">
                    {pet?.gender || "N/A"}
                  </span>
                </div>
                <div className="mt-2 text-muted">
                  <small>
                    {pet?.age ? `${pet.age} years old` : "Age unknown"} • {pet?.weight ? `${pet.weight}kg` : "Weight unknown"}
                  </small>
                </div>
              </div>
            </div>

            {/* Owner Details */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-3">
                <h6 className="fw-bold text-success mb-3 d-flex align-items-center">
                  <User size={18} className="me-2" />
                  Owner Information
                </h6>
                <div className="row g-2">
                  <div className="col-12">
                    <div className="d-flex align-items-start">
                      <strong className="text-muted" style={{ width: "80px" }}>Name:</strong>
                      <span>{owner?.name || "Unknown"}</span>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex align-items-start">
                      <strong className="text-muted" style={{ width: "80px" }}>Email:</strong>
                      <span className="text-break">{owner?.email || "N/A"}</span>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex align-items-start">
                      <strong className="text-muted" style={{ width: "80px" }}>Phone:</strong>
                      <span>{owner?.mobileno || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-3">
                <h6 className="fw-bold text-success mb-3 d-flex align-items-center">
                  <Calendar size={18} className="me-2" />
                  Appointment Details
                </h6>
                <div className="row g-2">
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center">
                      <Calendar size={16} className="text-muted me-2" />
                      <small className="text-muted me-2">Date:</small>
                      <strong className="small">{consultation.appointmentDate || "Not scheduled"}</strong>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center">
                      <Clock size={16} className="text-muted me-2" />
                      <small className="text-muted me-2">Time:</small>
                      <strong className="small">{consultation.appointmentTime || "Not scheduled"}</strong>
                    </div>
                  </div>
                  <div className="col-12 mt-2">
                    <div className="d-flex align-items-center">
                      <small className="text-muted me-2">Status:</small>
                      <span className={`badge bg-${getStatusColor(consultation.status)} text-uppercase`}>
                        {consultation.status || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Symptoms */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-3">
                <h6 className="fw-bold text-success mb-3 d-flex align-items-center">
                  <FileText size={18} className="me-2" />
                  Reported Symptoms
                </h6>
                <p className="mb-0 text-muted">
                  {consultation.symptoms || "No symptoms reported"}
                </p>
              </div>
            </div>

            {/* AI Pre-Diagnosis */}
            <div className="card border-0 shadow-sm mb-4" style={{
              background: aiResult.hasData
                ? "linear-gradient(135deg, #e7f3ff 0%, #f0f8ff 100%)"
                : "linear-gradient(135deg, #fff3cd 0%, #fff8e1 100%)"
            }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ color: aiResult.hasData ? "#0066cc" : "#856404" }}>
                  <Stethoscope size={18} className="me-2" />
                  AI Pre-Diagnosis
                </h6>
                <div className="d-flex align-items-start">
                  {!aiResult.hasData && <AlertCircle size={20} className="text-warning me-2 mt-1" />}
                  <div className="flex-grow-1">
                    <p className="mb-0" style={{ color: aiResult.hasData ? "#004085" : "#856404" }}>
                      {aiResult.display}
                    </p>
                    {aiResult.confidence && (
                      <small className="text-muted d-block mt-2">
                        Confidence: {aiResult.confidence.toFixed(1)}%
                      </small>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Uploaded Media */}
            {consultation.mediaFiles?.length > 0 && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-3">
                  <h6 className="fw-bold text-success mb-3">Uploaded Media ({consultation.mediaFiles.length})</h6>
                  <div className="d-flex gap-3 flex-wrap">
                    {consultation.mediaFiles.map((file, i) => (
                      <div key={i} className="position-relative">
                        <img
                          src={correctPath(file)}
                          onClick={() => setPreview(correctPath(file))}
                          alt={`Symptom ${i + 1}`}
                          style={{
                            width: "120px",
                            height: "120px",
                            objectFit: "cover",
                            borderRadius: "12px",
                            cursor: "pointer",
                            border: "3px solid #e9ecef",
                            transition: "all 0.3s ease",
                          }}
                          className="shadow-sm"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                            e.currentTarget.style.borderColor = "#198754";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.borderColor = "#e9ecef";
                          }}
                        />
                        <div
                          className="position-absolute bottom-0 end-0 bg-dark text-white px-2 py-1 rounded-top-start"
                          style={{ fontSize: "0.7rem", opacity: 0.8 }}
                        >
                          {i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Meeting Link */}
            {consultation.meetingLink && (
              <div className="card border-0 shadow-sm mb-4" style={{ background: "linear-gradient(135deg, #d1f2eb 0%, #e8f8f5 100%)" }}>
                <div className="card-body p-3">
                  <h6 className="fw-bold text-success mb-3 d-flex align-items-center">
                    <Video size={18} className="me-2" />
                    Meeting Link
                  </h6>
                  <div className="d-flex gap-2 align-items-center">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={consultation.meetingLink}
                      readOnly
                      style={{ fontSize: "0.85rem" }}
                    />
                    <a
                      href={consultation.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-success btn-sm text-nowrap"
                    >
                      <Video size={16} className="me-1" />
                      Join
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Status */}
            {consultation.isPaid !== undefined && (
              <div className="card border-0 shadow-sm">
                <div className="card-body p-3">
                  <h6 className="fw-bold text-success mb-3 d-flex align-items-center">
                    <DollarSign size={18} className="me-2" />
                    Payment Status
                  </h6>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${consultation.isPaid ? 'bg-success' : 'bg-warning text-dark'} px-3 py-2`}>
                      {consultation.isPaid ? '✓ Paid' : '⏳ Pending'}
                    </span>
                    {consultation.isPaid && consultation.paymentAmount && (
                      <span className="fw-bold text-success">₹{consultation.paymentAmount}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card-footer bg-light border-0 text-end p-3" style={{ borderRadius: "0 0 16px 16px" }}>
            <button className="btn btn-secondary px-4" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10000,
            cursor: "zoom-out",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
              }}
              className="btn btn-light"
              style={{
                position: "absolute",
                top: "-50px",
                right: "0",
                borderRadius: "50%",
                width: "45px",
                height: "45px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              <X size={24} />
            </button>
            <img
              src={preview}
              alt="Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "90vh",
                borderRadius: "16px",
                boxShadow: "0 0 40px rgba(255,255,255,0.2)",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}