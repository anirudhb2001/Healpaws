import React, { useState } from "react";
import { X, Calendar, Clock, User, CheckCircle, XCircle } from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function BookingModal({
  show,
  onClose,
  onBook,
  consultationId,
  pets,
  vets
}) {
  const [selectedVet, setSelectedVet] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      if (!selectedVet || !selectedDate || !selectedTime) {
        throw new Error("Please fill all fields");
      }

      // Send date and time as separate fields (matching your backend)
      const res = await fetch(`${API_URL}/consultations/${consultationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vetId: selectedVet,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to schedule appointment");
      }

      // Update parent component
      onBook(data.appointment);
      
      setSuccess(true);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.message || "Failed to schedule appointment");
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 1040 }}
      ></div>

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 1050 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            
            {/* Header */}
            <div className="modal-header">
              <h5 className="modal-title">Schedule Appointment</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                disabled={loading}
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body">
              {/* Success Message */}
              {success && (
                <div className="alert alert-success d-flex align-items-center" role="alert">
                  <CheckCircle size={20} className="me-2" />
                  <div>Appointment scheduled successfully!</div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <XCircle size={20} className="me-2" />
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} id="bookingForm">
                
                {/* Select Veterinarian */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    <User size={18} className="me-2" />
                    Select Veterinarian
                  </label>
                  <select
                    className="form-select"
                    value={selectedVet}
                    onChange={(e) => setSelectedVet(e.target.value)}
                    required
                    disabled={loading || success}
                  >
                    <option value="">-- Choose a veterinarian --</option>
                    {vets.map((vet) => (
                      <option key={vet._id} value={vet._id}>
                        Dr. {vet.name} {vet.specialization && `(${vet.specialization})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Date */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    <Calendar size={18} className="me-2" />
                    Select Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={today}
                    required
                    disabled={loading || success}
                  />
                </div>

                {/* Select Time */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    <Clock size={18} className="me-2" />
                    Select Time
                  </label>
                  <input
                    type="time"
                    className="form-control"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                    disabled={loading || success}
                  />
                </div>

                {!success && (
                  <div className="alert alert-info">
                    <small>
                      <strong>Note:</strong> The appointment will be scheduled and the veterinarian will be notified.
                    </small>
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="bookingForm"
                className="btn btn-success"
                disabled={loading || success}
              >
                {loading ? "Scheduling..." : "Schedule Appointment"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}