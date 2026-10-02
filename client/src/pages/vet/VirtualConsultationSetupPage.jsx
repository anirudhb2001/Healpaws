import React, { useEffect, useState } from "react";
import { Calendar, Video, Link as LinkIcon, Loader2, CheckCircle, AlertCircle, Send, FileText, XCircle } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import { useLocation, useNavigate } from "react-router-dom";

export default function VirtualConsultationSetupPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const consultationId = new URLSearchParams(search).get("consultationId");

  // ✅ FIX: Get vetId from healpaws_user in localStorage
  const storedUser = JSON.parse(localStorage.getItem("healpaws_user") || "{}");
  const vetId = storedUser._id;

  const [consultation, setConsultation] = useState(null);
  const [meetLink, setMeetLink] = useState("");
  const [loadingLink, setLoadingLink] = useState(false);
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    console.log("=== VET ID DEBUG ===");
    console.log("Stored User:", storedUser);
    console.log("Vet ID:", vetId);
    console.log("Consultation ID:", consultationId);
    console.log("====================");

    if (!vetId) {
      setModalMessage("Error: Vet ID not found. Please log in again.");
      setShowErrorModal(true);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    if (!consultationId) {
      setModalMessage("Error: Consultation ID not found.");
      setShowErrorModal(true);
      setTimeout(() => navigate("/app/vet/pending"), 2000);
      return;
    }

    fetchConsultation();
  }, []);

  const fetchConsultation = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/consultations/${consultationId}`
      );
      const data = await res.json();

      if (data.success) {
        setConsultation(data.consultation);

        // Debug: Check payment status
        console.log("Consultation Data:", data.consultation);
        console.log("isPaid:", data.consultation.isPaid);
        console.log("paymentStatus:", data.consultation.paymentStatus);
        console.log("Assigned Vet ID:", data.consultation.vetId?._id || data.consultation.vetId);
        console.log("Current Vet ID:", vetId);

        // Pre-fill if link already exists
        if (data.consultation.meetingLink) {
          setMeetLink(data.consultation.meetingLink);
          setLinkSent(data.consultation.meetingStatus === "sent");
        }
      }
    } catch (err) {
      console.error("Fetch consultation error:", err);
      setModalMessage("Failed to load consultation details.");
      setShowErrorModal(true);
    }
  };

  // Helper function to safely render AI prediction
  const renderAIPrediction = (aiPrediction) => {
    if (!aiPrediction) {
      return "No AI analysis available";
    }

    if (typeof aiPrediction === 'string') {
      return aiPrediction;
    }

    if (typeof aiPrediction === 'object') {
      // Extract the most relevant information
      const { animalType, diagnosis, confidence, recommendations } = aiPrediction;

      return (
        <div>
          {animalType && <p className="mb-1"><strong>Animal Type:</strong> {animalType}</p>}
          {diagnosis && <p className="mb-1"><strong>Diagnosis:</strong> {diagnosis}</p>}
          {confidence && <p className="mb-1"><strong>Confidence:</strong> {confidence.toFixed(1)}%</p>}
          {recommendations && (
            <div className="mb-1">
              <strong>Recommendations:</strong>
              <ul className="mb-0 mt-1">
                {Array.isArray(recommendations)
                  ? recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)
                  : <li>{recommendations}</li>
                }
              </ul>
            </div>
          )}
        </div>
      );
    }

    return "Analysis data format not recognized";
  };

  /** Generate Google Meet Link */
  const generateMeetLink = () => {
    setLoadingLink(true);
    setTimeout(() => {
      const link = `https://meet.google.com/${Math.random()
        .toString(36)
        .substring(2, 7)}-${Math.random()
          .toString(36)
          .substring(2, 5)}-${Math.random()
            .toString(36)
            .substring(2, 5)}`;
      setMeetLink(link);
      setLoadingLink(false);
    }, 1200);
  };

  /** Send Link to Owner */
  const sendLinkToOwner = async () => {
    if (!meetLink.trim()) {
      setModalMessage("Please generate or enter a meeting link first!");
      setShowErrorModal(true);
      return;
    }

    if (!meetLink.includes("meet.google.com")) {
      setModalMessage("Please enter a valid Google Meet link");
      setShowErrorModal(true);
      return;
    }

    if (!vetId) {
      setModalMessage("Error: Vet ID not found. Please log in again.");
      setShowErrorModal(true);
      return;
    }

    setSending(true);

    console.log("=== SEND LINK DEBUG ===");
    console.log("Consultation ID:", consultationId);
    console.log("Vet ID:", vetId);
    console.log("Meeting Link:", meetLink);
    console.log("======================");

    try {
      const res = await fetch(
        `http://localhost:5000/api/consultations/send-link/${consultationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vetId: vetId,
            meetingLink: meetLink
          }),
        }
      );

      const data = await res.json();

      console.log("Response:", data);

      if (data.success) {
        setModalMessage("Meeting link sent to pet owner successfully!");
        setShowSuccessModal(true);
        setLinkSent(true);
        fetchConsultation();
      } else {
        console.error("Send link failed:", data);
        setModalMessage(data.message || "Failed to send link");
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error("Send link error:", err);
      setModalMessage("Error sending link. Please try again.");
      setShowErrorModal(true);
    } finally {
      setSending(false);
    }
  };

  /** Start Consultation */
  const startConsultation = async () => {
    if (!linkSent) {
      setModalMessage("Please send the meeting link first!");
      setShowErrorModal(true);
      return;
    }

    if (!vetId) {
      setModalMessage("Error: Vet ID not found. Please log in again.");
      setShowErrorModal(true);
      return;
    }

    setStarting(true);

    try {
      const res = await fetch(
        `http://localhost:5000/api/consultations/start/${consultationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vetId }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setModalMessage("Consultation started! Opening meeting...");
        setShowSuccessModal(true);
        window.open(meetLink, "_blank");
        // Refresh consultation data to show "in-progress" status
        fetchConsultation();
      } else {
        setModalMessage(data.message || "Failed to start consultation");
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error("Start consultation error:", err);
      setModalMessage("Error starting consultation. Please try again.");
      setShowErrorModal(true);
    } finally {
      setStarting(false);
    }
  };

  /** Complete Consultation - Show confirmation modal */
  const handleCompleteClick = () => {
    setShowConfirmModal(true);
  };

  /** Complete Consultation - After confirmation */
  const completeConsultation = async () => {
    setShowConfirmModal(false);

    if (!vetId) {
      setModalMessage("Error: Vet ID not found. Please log in again.");
      setShowErrorModal(true);
      return;
    }

    setCompleting(true);

    try {
      const res = await fetch(
        `http://localhost:5000/api/consultations/complete/${consultationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vetId }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setModalMessage("Consultation completed successfully!");
        setShowSuccessModal(true);
        // Redirect to prescription page after short delay
        setTimeout(() => {
          navigate(`/app/vet/prescription?consultationId=${consultationId}`);
        }, 1500);
      } else {
        setModalMessage(data.message || "Failed to complete consultation");
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error("Complete consultation error:", err);
      setModalMessage("Error completing consultation. Please try again.");
      setShowErrorModal(true);
    } finally {
      setCompleting(false);
    }
  };

  if (!consultation) {
    return (
      <AppLayout title="Virtual Setup" role="vet">
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p className="mt-3">Loading consultation...</p>
        </div>
      </AppLayout>
    );
  }

  const pet = consultation.petId;
  const owner = consultation.ownerId;

  // SIMPLIFIED: If status is "confirmed", payment is done
  const paymentCompleted = consultation.status === "confirmed" || consultation.status === "in-progress";
  const isInProgress = consultation.status === "in-progress";

  console.log("=== PAYMENT DEBUG ===");
  console.log("Status:", consultation.status);
  console.log("Payment Completed:", paymentCompleted);
  console.log("In Progress:", isInProgress);
  console.log("====================");

  return (
    <AppLayout title="Virtual Consultation Setup" role="vet">
      <div className="row g-4">

        {/* LEFT SECTION: Details */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">

              {/* Pet Info */}
              <h5 className="fw-bold mb-3">Pet Information</h5>
              <div className="d-flex align-items-center mb-3">
                <img
                  src={
                    pet?.petPhoto
                      ? `http://localhost:5000/${pet.petPhoto}`
                      : "https://cdn-icons-png.flaticon.com/512/194/194279.png"
                  }
                  alt="pet"
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                <div className="ms-3">
                  <h6 className="fw-bold">{pet?.name}</h6>
                  <p className="text-muted m-0">
                    {pet?.breed} • {pet?.age} yrs • {pet?.weight}kg
                  </p>
                </div>
              </div>

              <hr />

              {/* Owner Info */}
              <h6 className="fw-bold mb-2">Pet Owner</h6>
              <div className="d-flex align-items-center mb-3">
                <img
                  src={
                    owner?.profilePhoto
                      ? `http://localhost:5000/${owner.profilePhoto}`
                      : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                  }
                  alt="owner"
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                <div className="ms-3">
                  <p className="mb-0 fw-semibold">{owner?.name}</p>
                  <p className="text-muted small mb-0">{owner?.email}</p>
                </div>
              </div>

              <hr />

              {/* Symptoms */}
              <h6 className="fw-bold">Reported Symptoms</h6>
              <p className="text-muted">{consultation.symptoms}</p>

              {/* Files */}
              {consultation.mediaFiles?.length > 0 && (
                <>
                  <h6 className="fw-bold mt-3">Uploaded Files</h6>
                  <div className="d-flex gap-3 flex-wrap">
                    {consultation.mediaFiles.map((file, idx) => (
                      <img
                        key={idx}
                        src={`http://localhost:5000/${file}`}
                        alt="uploaded media"
                        style={{
                          width: "120px",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "2px solid #e3e3e3",
                        }}
                      />
                    ))}
                  </div>
                </>
              )}

              <hr />

              {/* AI Prediction - FIXED */}
              <h6 className="fw-bold text-primary">AI Predicted Conditions</h6>
              <div className="alert alert-info mb-0">
                {renderAIPrediction(consultation.aiPrediction)}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Meeting Setup */}
        <div className="col-lg-4">

          {/* Payment Status Alert */}
          {paymentCompleted ? (
            <div className="alert alert-success border-success d-flex align-items-center mb-3">
              <CheckCircle size={18} className="me-2" />
              <span className="small fw-semibold">✓ Payment Confirmed - Ready to Setup</span>
            </div>
          ) : (
            <div className="alert alert-warning border-warning d-flex align-items-center mb-3">
              <AlertCircle size={18} className="me-2" />
              <span className="small">⚠ Waiting for Payment from Owner</span>
            </div>
          )}

          {/* In Progress Alert */}
          {isInProgress && (
            <div className="alert alert-info border-info d-flex align-items-center mb-3">
              <Video size={18} className="me-2" />
              <span className="small fw-semibold">🔴 Consultation In Progress</span>
            </div>
          )}

          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">

              <h5 className="fw-bold mb-3">Virtual Session Setup</h5>

              {/* Meeting Date/Time */}
              <div className="d-flex align-items-center mb-3 text-muted small">
                <Calendar size={16} className="me-2 text-primary" />
                <span>
                  {consultation.appointmentDate} at {consultation.appointmentTime}
                </span>
              </div>

              {/* Only show if payment is done */}
              {paymentCompleted ? (
                <>
                  {/* Generate Meet Link */}
                  <button
                    className="btn btn-outline-primary w-100 mb-2"
                    onClick={generateMeetLink}
                    disabled={loadingLink || linkSent || isInProgress}
                  >
                    {loadingLink ? (
                      <>
                        <Loader2 size={18} className="me-2" style={{ animation: "spin 1s linear infinite" }} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Video size={18} className="me-2" />
                        Generate Google Meet Link
                      </>
                    )}
                  </button>

                  {/* Manual Link Input */}
                  <div className="mb-3">
                    <label className="form-label small text-muted mb-1">
                      Or paste your meeting link:
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <LinkIcon size={16} />
                      </span>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://meet.google.com/xxx-yyy-zzz"
                        value={meetLink}
                        onChange={(e) => setMeetLink(e.target.value)}
                        disabled={linkSent || isInProgress}
                      />
                    </div>
                  </div>

                  {/* Link Preview */}
                  {meetLink && !linkSent && (
                    <div className="alert alert-light border mb-3 py-2">
                      <small className="text-muted d-block mb-1 fw-semibold">Meeting Link Preview:</small>
                      <small className="text-break text-primary">{meetLink}</small>
                    </div>
                  )}

                  {/* Send Link Button or Success Message */}
                  {linkSent ? (
                    <div className="alert alert-success border-success mb-0">
                      <div className="d-flex align-items-center">
                        <CheckCircle size={18} className="me-2" />
                        <div>
                          <strong className="d-block small">Link Sent Successfully!</strong>
                          <small className="text-muted">Owner can now join the meeting</small>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn btn-success w-100"
                      onClick={sendLinkToOwner}
                      disabled={sending || !meetLink || isInProgress}
                    >
                      {sending ? (
                        <>
                          <Loader2 size={18} className="me-2" style={{ animation: "spin 1s linear infinite" }} />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={18} className="me-2" />
                          Send Link to Owner
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="alert alert-light border text-center py-4">
                  <AlertCircle size={32} className="text-muted mb-2" />
                  <p className="text-muted mb-0 small">
                    Waiting for payment confirmation from pet owner before setting up the meeting.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Start Consultation Button */}
          {paymentCompleted && !isInProgress && (
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body">
                <h6 className="fw-bold mb-2">Ready to Start?</h6>
                <p className="text-muted small mb-3">
                  Click below to start the consultation and join the meeting.
                </p>

                <button
                  className="btn btn-primary btn-lg w-100"
                  onClick={startConsultation}
                  disabled={!linkSent || starting}
                >
                  {starting ? (
                    <>
                      <Loader2 size={20} className="me-2" style={{ animation: "spin 1s linear infinite" }} />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Video size={20} className="me-2" />
                      Start Consultation & Join
                    </>
                  )}
                </button>

                {!linkSent && paymentCompleted && (
                  <p className="text-muted small text-center mt-2 mb-0">
                    Send meeting link first to enable
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Complete Consultation Button - Show when in progress */}
          {isInProgress && (
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body">
                <h6 className="fw-bold mb-2">Consultation Active</h6>
                <p className="text-muted small mb-3">
                  Once you've finished the meeting, click below to complete the consultation and write the prescription.
                </p>

                <button
                  className="btn btn-warning w-100 mb-2"
                  onClick={() => window.open(meetLink, "_blank")}
                >
                  <Video size={18} className="me-2" />
                  Rejoin Meeting
                </button>

                <button
                  className="btn btn-success btn-lg w-100"
                  onClick={handleCompleteClick}
                  disabled={completing}
                >
                  {completing ? (
                    <>
                      <Loader2 size={20} className="me-2" style={{ animation: "spin 1s linear infinite" }} />
                      Completing...
                    </>
                  ) : (
                    <>
                      <FileText size={20} className="me-2" />
                      Complete & Write Prescription
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="text-center">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => navigate("/app/vet/pending")}
            >
              ← Back to Requests
            </button>
          </div>

        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center py-5">
                <CheckCircle size={64} className="text-success mb-3" />
                <h5 className="mb-3">Success!</h5>
                <p className="text-muted mb-0">{modalMessage}</p>
              </div>
              <div className="modal-footer border-0 justify-content-center">
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => {
                    setShowSuccessModal(false);
                    setModalMessage("");
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center py-5">
                <XCircle size={64} className="text-danger mb-3" />
                <h5 className="mb-3">Error</h5>
                <p className="text-muted mb-0">{modalMessage}</p>
              </div>
              <div className="modal-footer border-0 justify-content-center">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowErrorModal(false);
                    setModalMessage("");
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">Complete Consultation</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfirmModal(false)}
                ></button>
              </div>
              <div className="modal-body py-4">
                <p className="mb-0">
                  Have you finished the consultation? This will end the meeting and allow you to write the prescription.
                </p>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Not Yet
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={completeConsultation}
                  disabled={completing}
                >
                  {completing ? (
                    <>
                      <Loader2 size={18} className="me-2" style={{ animation: "spin 1s linear infinite" }} />
                      Completing...
                    </>
                  ) : (
                    "Yes, Complete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppLayout>
  );
}