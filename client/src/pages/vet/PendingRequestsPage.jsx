import React, { useEffect, useState } from "react";
import { Clock, CheckCircle, Eye, XCircle, Calendar, User, Brain, AlertCircle, CheckCircle2 } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import ConsultationViewModal from "../../components/appointment/ConsultationViewModal.jsx";
import { useNavigate } from "react-router-dom";

export default function PendingRequestsPage() {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Modal states for success/error messages
  const [messageModal, setMessageModal] = useState({
    show: false,
    type: 'success', // 'success' or 'error'
    title: '',
    message: ''
  });

  // Confirm modal for decline action
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    appointmentId: null
  });

  const navigate = useNavigate();

  // Get user data from localStorage
  const getUserId = () => {
    const userData = localStorage.getItem("healpaws_user");
    if (!userData) return null;
    try {
      const user = JSON.parse(userData);
      return user._id || user.id;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  };

  const vetId = getUserId();

  // Show message modal
  const showMessage = (type, title, message) => {
    setMessageModal({
      show: true,
      type,
      title,
      message
    });
  };

  // Close message modal
  const closeMessageModal = () => {
    setMessageModal({
      show: false,
      type: 'success',
      title: '',
      message: ''
    });
  };

  useEffect(() => {
    if (!vetId) {
      showMessage('error', 'Authentication Required', 'Please login as veterinarian');
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      return;
    }
    fetchAppointments();
  }, [vetId, navigate]);

  // Fetch Vet's Scheduled Appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:5000/api/consultations/vet/appointments/${vetId}`
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to fetch appointments" }));
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Fetched appointments:", data);

      const appointmentsList = data.appointments || data.data || [];

      setAppointments(appointmentsList);
      setFiltered(appointmentsList);
    } catch (error) {
      console.error("Fetch error:", error);
      showMessage('error', 'Loading Error', `Failed to load appointments: ${error.message}`);
      setAppointments([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  // SEARCH & FILTER LOGIC
  useEffect(() => {
    const s = search.toLowerCase();
    let results = appointments;

    if (filterStatus !== "all") {
      results = results.filter(apt => apt.status === filterStatus);
    }

    results = results.filter((apt) => {
      return (
        apt.petId?.name?.toLowerCase().includes(s) ||
        apt.ownerId?.name?.toLowerCase().includes(s) ||
        apt.symptoms?.toLowerCase().includes(s)
      );
    });

    setFiltered(results);
  }, [search, filterStatus, appointments]);

  // Accept/Confirm scheduled appointment
  const handleAccept = async (id) => {
    try {
      if (!vetId) {
        showMessage('error', 'Authentication Error', 'Vet not logged in');
        return;
      }

      const res = await fetch(`http://localhost:5000/api/consultations/accept/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vetId })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to accept appointment" }));
        throw new Error(errorData.message || "Failed to accept appointment");
      }

      const data = await res.json();
      console.log("Accept response:", data);

      showMessage('success', 'Appointment Confirmed', 'Appointment confirmed successfully! Owner will be notified to proceed with payment.');
      fetchAppointments();
    } catch (error) {
      console.error("Accept error:", error);
      showMessage('error', 'Accept Failed', error.message || 'Could not accept appointment');
    }
  };

  // Show decline confirmation modal
  const showDeclineConfirmation = (id) => {
    setConfirmModal({
      show: true,
      appointmentId: id
    });
  };

  // Close decline confirmation modal
  const closeConfirmModal = () => {
    setConfirmModal({
      show: false,
      appointmentId: null
    });
  };

  // Decline scheduled appointment
  const handleDecline = async () => {
    const id = confirmModal.appointmentId;
    closeConfirmModal();

    try {
      const res = await fetch(`http://localhost:5000/api/consultations/decline/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vetId })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to decline" }));
        throw new Error(errorData.message || "Failed to decline");
      }

      const data = await res.json();
      console.log("Decline response:", data);

      showMessage('success', 'Appointment Declined', 'Appointment declined successfully');
      fetchAppointments();
    } catch (error) {
      console.error("Decline error:", error);
      showMessage('error', 'Decline Failed', error.message || 'Failed to decline appointment');
    }
  };

  // Navigate to Virtual Consultation Setup page
  const handleStartConsultation = (consultationId) => {
    navigate(`/app/vet/virtual-setup?consultationId=${consultationId}`);
  };

  // Get status badge (checks both status and payment status)
  const getStatusBadge = (status, paymentStatus) => {
    if (status === "scheduled") {
      return <span className="badge bg-warning text-dark">⏳ Needs Your Confirmation</span>;
    }
    if (status === "confirmed") {
      if (paymentStatus === "completed") {
        return <span className="badge bg-success">✅ Payment Completed - Ready to Start</span>;
      } else {
        return <span className="badge bg-info">✅ Confirmed - Waiting for Payment</span>;
      }
    }
    if (status === "in-progress") {
      return <span className="badge bg-primary">🏥 In Progress</span>;
    }
    return <span className="badge bg-secondary">{status}</span>;
  };

  // Helper function to safely get AI prediction as string
  const getAIPredictionString = (aiPrediction) => {
    if (!aiPrediction) return '';
    if (typeof aiPrediction === 'string') return aiPrediction.toLowerCase();
    if (typeof aiPrediction === 'object' && (aiPrediction.diagnosis || aiPrediction.prediction)) {
      return String(aiPrediction.diagnosis || aiPrediction.prediction).toLowerCase();
    }
    return String(aiPrediction).toLowerCase();
  };

  // AI Severity badge
  const getAISeverityBadge = (prediction) => {
    if (!prediction) return null;

    const pred = getAIPredictionString(prediction);

    if (!pred || pred === "awaiting analysis") return null;

    if (pred.includes("emergency") || pred.includes("critical") || pred.includes("severe")) {
      return { text: "High Priority", color: "danger", icon: "🚨" };
    } else if (pred.includes("moderate") || pred.includes("concern")) {
      return { text: "Medium Priority", color: "warning", icon: "⚠️" };
    } else {
      return { text: "Low Priority", color: "info", icon: "ℹ️" };
    }
  };

  if (loading) {
    return (
      <AppLayout title="Appointment Requests" role="vet">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading appointments...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Appointment Requests" role="vet">

      {/* Message Modal */}
      {messageModal.show && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className={`modal-header border-0 ${messageModal.type === 'success' ? 'bg-success' : 'bg-danger'} bg-opacity-10`}>
                <h5 className={`modal-title ${messageModal.type === 'success' ? 'text-success' : 'text-danger'}`}>
                  {messageModal.type === 'success' ? (
                    <CheckCircle2 className="me-2" size={24} />
                  ) : (
                    <AlertCircle className="me-2" size={24} />
                  )}
                  {messageModal.title}
                </h5>
                <button type="button" className="btn-close" onClick={closeMessageModal}></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">{messageModal.message}</p>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className={`btn ${messageModal.type === 'success' ? 'btn-success' : 'btn-danger'}`}
                  onClick={closeMessageModal}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decline Confirmation Modal */}
      {confirmModal.show && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Decline</h5>
                <button type="button" className="btn-close" onClick={closeConfirmModal}></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">Are you sure you want to decline this appointment? The owner will be able to reschedule with another vet.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeConfirmModal}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDecline}>
                  Yes, Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Search by pet name, owner name or symptoms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Appointments</option>
                <option value="scheduled">Scheduled (Need Action)</option>
                <option value="confirmed">Confirmed (Ready to Start)</option>
                <option value="in-progress">In Progress</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-warning bg-opacity-10">
            <div className="card-body">
              <h6 className="text-muted mb-2">Needs Confirmation</h6>
              <h3 className="mb-0 text-warning">{appointments.filter(a => a.status === "scheduled").length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-success bg-opacity-10">
            <div className="card-body">
              <h6 className="text-muted mb-2">Confirmed</h6>
              <h3 className="mb-0 text-success">{appointments.filter(a => a.status === "confirmed").length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-primary bg-opacity-10">
            <div className="card-body">
              <h6 className="text-muted mb-2">In Progress</h6>
              <h3 className="mb-0 text-primary">{appointments.filter(a => a.status === "in-progress").length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-5">
          <Calendar size={64} className="text-muted mb-3" />
          <h5 className="text-muted">
            {search || filterStatus !== "all"
              ? "No appointments found matching your criteria"
              : "No appointments scheduled with you yet"}
          </h5>
          <p className="text-muted">Appointments will appear here when pet owners schedule consultations with you.</p>
        </div>
      )}

      {/* Appointments List */}
      <div className="row g-4">
        {filtered.map((apt) => {
          const aiSeverity = getAISeverityBadge(apt.aiPrediction);
          const isPaymentCompleted = apt.paymentStatus === "completed";
          const aiPredictionStr = getAIPredictionString(apt.aiPrediction);

          return (
            <div key={apt._id} className="col-12">
              <div className={`card border-0 shadow-sm ${apt.status === 'scheduled' ? 'border-start border-warning border-4' : ''}`}>
                <div className="card-body">
                  <div className="row">

                    {/* LEFT - Pet & Owner Details */}
                    <div className="col-md-8">
                      <div className="d-flex">
                        <img
                          src={
                            apt.petId?.petPhoto
                              ? `http://localhost:5000/${apt.petId.petPhoto}`
                              : "https://cdn-icons-png.flaticon.com/512/194/194279.png"
                          }
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            marginRight: "20px",
                          }}
                          alt="pet"
                        />

                        <div className="flex-grow-1">
                          {/* Pet Name & Status */}
                          <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                            <h5 className="fw-bold mb-0">{apt.petId?.name || "Unknown Pet"}</h5>
                            {getStatusBadge(apt.status, apt.paymentStatus)}
                            {aiSeverity && (
                              <span className={`badge bg-${aiSeverity.color}`}>
                                {aiSeverity.icon} {aiSeverity.text}
                              </span>
                            )}
                          </div>

                          {/* Pet Details */}
                          <p className="text-muted mb-2">
                            {apt.petId?.breed || "N/A"} • {apt.petId?.gender || "N/A"} •{" "}
                            {apt.petId?.age || "N/A"} yrs • {apt.petId?.weight || "N/A"}kg
                          </p>

                          {/* Owner Info */}
                          <div className="mb-2">
                            <User size={16} className="me-2" />
                            <strong>Owner:</strong> {apt.ownerId?.name || "Unknown"}
                            {apt.ownerId?.mobileno && (
                              <span className="text-muted"> • {apt.ownerId.mobileno}</span>
                            )}
                          </div>

                          {/* Scheduled Date & Time */}
                          {apt.appointmentDate && apt.appointmentTime && (
                            <div className="alert alert-info mb-3 py-2 w-50">
                              <Calendar size={16} className="me-2" />
                              <strong>Scheduled:</strong> {apt.appointmentDate} at {apt.appointmentTime}
                            </div>
                          )}

                          {/* Symptoms */}
                          <div className="mb-3">
                            <strong>Reported Symptoms:</strong>
                            <p className="mb-0 mt-1">{apt.symptoms || "No symptoms provided"}</p>
                          </div>

                          {/* AI PREDICTION */}
                          {apt.aiPrediction && aiPredictionStr && aiPredictionStr !== "awaiting analysis" && (() => {
                            const ai = apt.aiPrediction;
                            const raw = ai.rawResponse?.batchResults?.[0] || {};
                            const topPreds = raw.top_predictions || [];
                            const primaryDiagnosis = ai.diagnosis || raw.disease_name || raw.prediction || "Unknown";
                            const primaryConfidence = ai.confidence ?? raw.confidence ?? 0;
                            const animalType = ai.animalType || raw.animal_type || "";
                            const symptoms = raw.symptoms || [];
                            const treatment = raw.treatment || [];
                            const homeCare = raw.home_care || "";
                            const urgency = raw.urgency || "";
                            const description = raw.disease_description || raw.recommendation || "";

                            return (
                              <div className="card border-0 bg-light mb-3">
                                <div className="card-body py-3">
                                  {/* Header */}
                                  <div className="d-flex align-items-center mb-3">
                                    <Brain size={22} className="me-2 text-primary flex-shrink-0" />
                                    <strong className="text-primary">AI-Assisted Preliminary Assessment</strong>
                                  </div>

                                  {/* Primary Diagnosis */}
                                  <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div>
                                      <span className="text-muted small">Primary Diagnosis</span>
                                      <h6 className="fw-bold mb-0">{primaryDiagnosis}</h6>
                                    </div>
                                    <div className="text-end">
                                      <span className="badge bg-primary fs-6">{primaryConfidence.toFixed(1)}%</span>
                                    </div>
                                  </div>

                                  {/* Confidence bar */}
                                  <div className="progress mb-3" style={{ height: "6px" }}>
                                    <div
                                      className="progress-bar bg-primary"
                                      style={{ width: `${Math.min(primaryConfidence, 100)}%` }}
                                    />
                                  </div>

                                  {/* Description */}
                                  {description && (
                                    <p className="text-muted small mb-3">{description}</p>
                                  )}

                                  {/* Top Differential Diagnoses */}
                                  {topPreds.length > 1 && (
                                    <div className="mb-3">
                                      <span className="fw-semibold small text-muted d-block mb-2">Differential Diagnoses</span>
                                      {topPreds.map((tp, idx) => (
                                        <div key={idx} className="d-flex align-items-center justify-content-between py-1 border-bottom" style={{ fontSize: "0.85rem" }}>
                                          <span>
                                            <span className={`badge bg-${idx === 0 ? 'primary' : 'secondary'} bg-opacity-${idx === 0 ? '100' : '75'} me-2`}>
                                              {idx + 1}
                                            </span>
                                            {tp.disease_name || tp.class}
                                          </span>
                                          <span className="text-muted fw-semibold">{tp.probability?.toFixed(1)}%</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="row g-3">
                                    {/* Symptoms */}
                                    {symptoms.length > 0 && (
                                      <div className="col-md-6">
                                        <span className="fw-semibold small text-muted">Key Symptoms</span>
                                        <ul className="list-unstyled mt-1 mb-0" style={{ fontSize: "0.85rem" }}>
                                          {symptoms.slice(0, 5).map((s, i) => (
                                            <li key={i} className="mb-1">• {s}</li>
                                          ))}
                                          {symptoms.length > 5 && (
                                            <li className="text-muted fst-italic">+{symptoms.length - 5} more</li>
                                          )}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Treatment */}
                                    {treatment.length > 0 && (
                                      <div className="col-md-6">
                                        <span className="fw-semibold small text-muted">Recommended Treatment</span>
                                        <ul className="list-unstyled mt-1 mb-0" style={{ fontSize: "0.85rem" }}>
                                          {treatment.slice(0, 4).map((t, i) => (
                                            <li key={i} className="mb-1">• {t}</li>
                                          ))}
                                          {treatment.length > 4 && (
                                            <li className="text-muted fst-italic">+{treatment.length - 4} more</li>
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                  </div>

                                  {/* Urgency & Home Care */}
                                  {(urgency || homeCare) && (
                                    <div className="mt-3 pt-2 border-top d-flex flex-wrap gap-3" style={{ fontSize: "0.85rem" }}>
                                      {urgency && (
                                        <span>
                                          <strong>Urgency:</strong>{" "}
                                          <span className={`badge bg-${urgency === 'high' ? 'danger' : urgency === 'medium' ? 'warning text-dark' : 'success'}`}>
                                            {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                                          </span>
                                        </span>
                                      )}
                                      {homeCare && (
                                        <span className="text-muted">
                                          <strong>Home Care:</strong> {homeCare}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Disclaimer */}
                                  <small className="text-muted d-block mt-3 fst-italic" style={{ fontSize: "0.78rem" }}>
                                    This AI assessment is provided to assist your professional diagnosis.
                                    Please conduct your own thorough examination and use your clinical judgment.
                                  </small>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Media Files */}
                          {apt.mediaFiles && apt.mediaFiles.length > 0 && (
                            <div className="mt-2">
                              <small className="text-muted">
                                {apt.mediaFiles.length} file(s) attached (images/videos of symptoms)
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT - Action Buttons */}
                    <div className="col-md-4 text-end">
                      <small className="text-muted d-block mb-3">
                        <Clock size={14} className="me-1" />
                        Requested: {new Date(apt.createdAt).toLocaleString()}
                      </small>

                      <div className="d-grid gap-2">

                        {/* SCHEDULED - Need to accept/decline */}
                        {apt.status === "scheduled" && (
                          <>
                            <button
                              className="btn btn-success"
                              onClick={() => handleAccept(apt._id)}
                            >
                              <CheckCircle size={18} className="me-2" />
                              Accept Appointment
                            </button>

                            <button
                              className="btn btn-outline-primary"
                              onClick={() => {
                                setSelectedConsultation(apt);
                                setShowModal(true);
                              }}
                            >
                              <Eye size={18} className="me-2" />
                              View Full Details
                            </button>

                            <button
                              className="btn btn-outline-danger"
                              onClick={() => showDeclineConfirmation(apt._id)}
                            >
                              <XCircle size={18} className="me-2" />
                              Decline
                            </button>
                          </>
                        )}

                        {/* CONFIRMED - Payment pending or completed */}
                        {apt.status === "confirmed" && (
                          <>
                            {/* Payment Status Alert */}
                            <div className={`alert ${isPaymentCompleted ? 'alert-success' : 'alert-warning'} mb-2 py-2`}>
                              <small>
                                {isPaymentCompleted
                                  ? "Payment Completed - Ready to Start"
                                  : "Waiting for owner payment..."}
                              </small>
                            </div>

                            <button
                              className={`btn ${isPaymentCompleted ? 'btn-success' : 'btn-secondary'}`}
                              onClick={() => handleStartConsultation(apt._id)}
                              disabled={!isPaymentCompleted}
                            >
                              <CheckCircle size={18} className="me-2" />
                              {isPaymentCompleted ? 'Setup Virtual Consultation' : 'Waiting for Payment'}
                            </button>

                            <button
                              className="btn btn-outline-primary"
                              onClick={() => {
                                setSelectedConsultation(apt);
                                setShowModal(true);
                              }}
                            >
                              <Eye size={18} className="me-2" />
                              View Full Details
                            </button>
                          </>
                        )}

                        {/* IN-PROGRESS */}
                        {apt.status === "in-progress" && (
                          <>
                            <button
                              className="btn btn-primary"
                              onClick={() => navigate(`/app/vet/diagnosis?consultationId=${apt._id}`)}
                            >
                              Continue Consultation
                            </button>

                            <button
                              className="btn btn-outline-primary"
                              onClick={() => {
                                setSelectedConsultation(apt);
                                setShowModal(true);
                              }}
                            >
                              <Eye size={18} className="me-2" />
                              View Full Details
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      <ConsultationViewModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        consultation={selectedConsultation}
      />
    </AppLayout>
  );
}