import React, { useState } from "react";
import { Calendar, CreditCard, Video, FileText, XCircle, ExternalLink, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AppointmentActions({
  status,
  onSchedule,
  onPayment,
  onJoinConsultation,
  onCancel,
  meetingLink,
  isPaid,
  consultationId
}) {
  const navigate = useNavigate();
  const [showCopyModal, setShowCopyModal] = useState(false);

  // Handler for viewing medical records
  const handleViewRecords = () => {
    if (consultationId) {
      navigate(`/app/owner/consultation/${consultationId}`);
    }
  };

  // Handler for copying meeting link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingLink);
    setShowCopyModal(true);
    setTimeout(() => setShowCopyModal(false), 2000);
  };
  
  // PENDING STATUS - Show "Schedule Appointment" button
  if (status === "pending") {
    return (
      <div className="mt-3 d-flex gap-2">
        <button 
          className="btn btn-success flex-grow-1"
          onClick={onSchedule}
        >
          <Calendar size={16} className="me-2" />
          Schedule Appointment
        </button>
      </div>
    );
  }

  // SCHEDULED STATUS - Waiting for vet approval
  if (status === "scheduled") {
    return (
      <div className="mt-3">
        <div className="alert alert-warning small mb-2 py-2">
          ⏳ Waiting for veterinarian to accept your appointment
        </div>
        <button 
          className="btn btn-outline-danger btn-sm w-100"
          onClick={onCancel}
        >
          <XCircle size={16} className="me-2" />
          Cancel Appointment
        </button>
      </div>
    );
  }

  // CONFIRMED STATUS - Show payment or meeting link
  if (status === "confirmed") {
    if (!isPaid) {
      return (
        <div className="mt-3 d-flex gap-2">
          <button 
            className="btn btn-primary flex-grow-1"
            onClick={onPayment}
          >
            <CreditCard size={16} className="me-2" />
            Make Payment
          </button>
          <button 
            className="btn btn-outline-danger"
            onClick={onCancel}
          >
            <XCircle size={16} />
          </button>
        </div>
      );
    }

    if (meetingLink) {
      return (
        <div className="mt-3">
          {/* Meeting Link Display */}
          <div className="alert alert-success border-success mb-2 py-2">
            <div className="d-flex align-items-center mb-2">
              <Video size={16} className="me-2" />
              <small className="fw-semibold mb-0">Meeting Link Ready</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <input 
                type="text" 
                className="form-control form-control-sm" 
                value={meetingLink} 
                readOnly
                style={{ fontSize: "0.75rem" }}
              />
              <button
                className="btn btn-sm btn-outline-success"
                onClick={handleCopyLink}
                title="Copy link"
              >
                <ExternalLink size={14} />
              </button>
            </div>
          </div>

          {/* Join Button */}
          <button 
            className="btn btn-success w-100"
            onClick={onJoinConsultation}
          >
            <Video size={16} className="me-2" />
            Join Consultation
          </button>
          <small className="text-success d-block text-center mt-1">
            ✓ Payment completed - Ready to join
          </small>
        </div>
      );
    }

    return (
      <div className="mt-3">
        <div className="alert alert-info small mb-0 py-2">
          ✓ Payment completed. Waiting for veterinarian to share meeting link.
        </div>
      </div>
    );
  }

  // IN-PROGRESS STATUS
  if (status === "in-progress") {
    return (
      <div className="mt-3">
        {meetingLink && (
          <div className="alert alert-success border-success mb-2 py-2">
            <div className="d-flex align-items-center mb-2">
              <Video size={16} className="me-2" />
              <small className="fw-semibold mb-0">Meeting Link</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <input 
                type="text" 
                className="form-control form-control-sm" 
                value={meetingLink} 
                readOnly
                style={{ fontSize: "0.75rem" }}
              />
              <button
                className="btn btn-sm btn-outline-success"
                onClick={handleCopyLink}
                title="Copy link"
              >
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        )}
        <button 
          className="btn btn-success w-100"
          onClick={onJoinConsultation}
        >
          <Video size={16} className="me-2" />
          Join Ongoing Consultation
        </button>
      </div>
    );
  }

  // COMPLETED STATUS
  if (status === "completed") {
    return (
      <div className="mt-3">
        <button 
          className="btn btn-outline-primary w-100"
          onClick={handleViewRecords}
        >
          <FileText size={16} className="me-2" />
          View Medical Records
        </button>
      </div>
    );
  }

  // DECLINED STATUS - Allow rescheduling
  if (status === "declined") {
    return (
      <div className="mt-3">
        <div className="alert alert-danger small mb-2 py-2">
          ❌ This appointment was declined by the veterinarian
        </div>
        <button 
          className="btn btn-success w-100"
          onClick={onSchedule}
        >
          <Calendar size={16} className="me-2" />
          Reschedule with Another Vet
        </button>
      </div>
    );
  }

  // CANCELLED STATUS
  if (status === "cancelled") {
    return (
      <div className="mt-3">
        <div className="alert alert-secondary small mb-0 py-2">
          This appointment was cancelled
        </div>
      </div>
    );
  }

  // Copy Success Modal
  return (
    <>
      {/* Default fallback */}
      {showCopyModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-body text-center py-4">
                <CheckCircle size={48} className="text-success mb-2" />
                <p className="mb-0">Meeting link copied to clipboard!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}