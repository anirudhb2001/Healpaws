import React, { useEffect, useState } from "react";
import { Brain, AlertTriangle, Stethoscope, Image, ArrowLeftCircle, Info } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import { useLocation, useNavigate } from "react-router-dom";
import AIPrediction from "../../components/appointment/AIPrediction.jsx";

export default function AIDiagnosisReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Consultation ID coming from ?consultationId=...
  const consultationId = new URLSearchParams(location.search).get("consultationId");

  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!consultationId) return;

    fetchConsultation();
  }, [consultationId]);

  const fetchConsultation = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/consultations/${consultationId}`);
      const data = await res.json();

      setConsultation(data.consultation);
    } catch (err) {
      console.error("Fetch consultation failed:", err);
    }
    setLoading(false);
  };

  // Helper function to determine severity styling based on AI severity
  const getSeverityData = (severity) => {
    const severityLower = (severity || "").toLowerCase();
    
    if (severityLower.includes("high") || severityLower.includes("critical") || severityLower.includes("severe")) {
      return {
        level: "high",
        color: "danger",
        icon: "🚨",
        message: "High Severity - Immediate Attention Recommended"
      };
    } else if (severityLower.includes("medium") || severityLower.includes("moderate")) {
      return {
        level: "medium",
        color: "warning",
        icon: "⚠️",
        message: "Medium Severity - Prompt Attention Advised"
      };
    } else {
      return {
        level: "low",
        color: "info",
        icon: "ℹ️",
        message: "Low Severity - Monitor Condition"
      };
    }
  };

  if (loading) {
    return (
      <AppLayout title="AI Diagnosis" role="vet">
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
        </div>
      </AppLayout>
    );
  }

  if (!consultation) {
    return (
      <AppLayout title="AI Diagnosis" role="vet">
        <div className="alert alert-danger mt-4 text-center">
          Consultation not found.
        </div>
      </AppLayout>
    );
  }

  const pet = consultation.petId;
  const owner = consultation.ownerId;
  const severityData = getSeverityData(consultation.aiSeverity);

  return (
    <AppLayout title="AI-Assisted Diagnosis Review" role="vet">
      <div className="row">

        {/* LEFT SIDE — Pet & Symptoms */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">

              {/* Pet Info */}
              <div className="d-flex">
                <img
                  src={
                    pet?.petPhoto
                      ? `http://localhost:5000/${pet.petPhoto}`
                      : "https://cdn-icons-png.flaticon.com/512/194/194279.png"
                  }
                  alt="pet"
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginRight: "20px",
                  }}
                />

                <div>
                  <h4 className="fw-bold">{pet?.name}</h4>
                  <p className="text-muted mb-1">
                    {pet?.breed} • {pet?.gender} • {pet?.age} yrs • {pet?.weight}kg  
                  </p>
                  <p className="text-muted mb-0">Owner: {owner?.name}</p>
                </div>
              </div>

              <hr />

              {/* Symptoms */}
              <h5 className="fw-bold">Reported Symptoms</h5>
              <p className="text-muted">{consultation.symptoms || "No symptoms reported"}</p>

              {/* Uploaded Media */}
              {consultation.media?.length > 0 && (
                <>
                  <h6 className="fw-bold mt-3">
                    <Image size={18} className="me-2" />
                    Uploaded Images / Videos
                  </h6>
                  <div className="d-flex flex-wrap gap-3 mt-2">
                    {consultation.media.map((m, i) => (
                      <img
                        key={i}
                        src={`http://localhost:5000/${m}`}
                        alt="upload"
                        style={{
                          width: "120px",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius: "10px",
                          border: "2px solid #e3e3e3",
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE — AI DIAGNOSIS */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">
                <Brain className="me-2" size={20} /> AI Preliminary Analysis
              </h5>
              <p className="text-muted small mb-3">
                Initial machine learning–based analysis. Please verify manually before making final diagnosis.
              </p>

              {/* Use the AIPrediction component */}
              {consultation.aiDiagnosis && (
                <AIPrediction 
                  aiSeverity={severityData}
                  prediction={consultation.aiDiagnosis}
                />
              )}

              {/* Additional AI Information */}
              {consultation.aiTests && (
                <div className="alert alert-light border mt-3">
                  <div className="d-flex align-items-start">
                    <Stethoscope size={18} className="me-2 mt-1 text-primary" />
                    <div>
                      <strong className="d-block mb-1">Recommended Tests:</strong>
                      <span className="text-muted small">{consultation.aiTests}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="alert alert-warning border-warning mt-3 mb-0" style={{ backgroundColor: "#fff9f0" }}>
                <div className="d-flex align-items-start">
                  <Info size={18} className="me-2 mt-1 text-warning" />
                  <small className="text-muted">
                    <strong>Note:</strong> AI analysis is a supporting tool. Final diagnosis must be confirmed by licensed veterinarian.
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="d-grid gap-3">
            <button
              className="btn btn-success btn-lg"
              onClick={() => navigate(`/app/vet/virtual-setup?consultationId=${consultationId}`)}
            >
              <Brain size={18} className="me-2" />
              Start Virtual Consultation
            </button>

            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate("/app/vet/requests")}
            >
              <ArrowLeftCircle size={18} className="me-2" />
              Back to Requests
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}