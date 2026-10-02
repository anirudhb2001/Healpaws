import React, { useState, useEffect } from "react";
import { Calendar, CheckCircle, AlertCircle } from "lucide-react";
import AppointmentCard from "../../components/appointment/AppointmentCard";
import BookingModal from "../../components/appointment/BookingModal";
import AppLayout from "../layouts/AppLayout";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);
  const [vets, setVets] = useState([]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCancelAppointment, setPendingCancelAppointment] = useState(null);

  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("healpaws_user"));
  const ownerId = storedUser?._id;

  useEffect(() => {
    if (!ownerId) {
      setError("User not logged in");
      setShowErrorModal(true);
      setLoading(false);
      return;
    }

    fetchAppointments();
    fetchPets();
    fetchVets();
  }, [ownerId]);

  const fetchPets = async () => {
    try {
      const res = await fetch(`${API_URL}/pets/owner/${ownerId}`);
      const data = await res.json();
      if (res.ok) setPets(data.pets || []);
    } catch (err) {
      console.error("Failed to fetch pets:", err);
    }
  };

  const fetchVets = async () => {
    try {
      const res = await fetch(`${API_URL}/consultations/vets`);
      const data = await res.json();
      if (res.ok) setVets(data.vets || []);
    } catch (err) {
      console.error("Failed to fetch vets:", err);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/consultations/owner/${ownerId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setAppointments(data.appointments || []);
    } catch (err) {
      setError(err.message || "Failed to load appointments");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const openBookingModal = (consultation) => {
    setSelectedConsultation(consultation);
    setShowBookingModal(true);
  };

  const handleOnBook = (updatedApt) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt._id === updatedApt._id ? updatedApt : apt))
    );
  };

  const handlePayment = (appointment) => {
    if (!appointment._id) {
      setError("Error: Appointment ID is missing!");
      setShowErrorModal(true);
      return;
    }
    navigate(`/app/owner/payment/${appointment._id}`);
  };

  const handleJoinConsultation = (appointment) => {
    if (appointment.meetingLink) {
      window.open(appointment.meetingLink, "_blank");
    } else {
      setError("Meeting link not available yet. Please wait for the vet to share it.");
      setShowErrorModal(true);
    }
  };

  const handleViewRecords = (appointment) => {
    console.log("View records for:", appointment._id);
    setSuccess("View records feature coming soon!");
    setShowSuccessModal(true);
  };

  // Show confirmation modal before cancelling
  const handleCancel = (appointment) => {
    console.log("════════════════════════════════════");
    console.log("CANCEL APPOINTMENT - DEBUG INFO");
    console.log("════════════════════════════════════");
    console.log("1. Appointment object:", appointment);
    console.log("2. Appointment ID:", appointment?._id);
    console.log("3. Appointment status:", appointment?.status);
    console.log("════════════════════════════════════");

    if (!appointment) {
      console.error("Appointment is undefined or null");
      setError("Error: Appointment data is missing");
      setShowErrorModal(true);
      return;
    }

    if (!appointment._id) {
      console.error("Appointment ID is missing");
      setError("Error: Appointment ID is missing");
      setShowErrorModal(true);
      return;
    }

    const cancellableStatuses = ['pending', 'scheduled', 'confirmed'];
    if (!cancellableStatuses.includes(appointment.status)) {
      console.warn(`Cannot cancel appointment with status: ${appointment.status}`);
      setError(`Cannot cancel appointment with status: ${appointment.status}`);
      setShowErrorModal(true);
      return;
    }

    setPendingCancelAppointment(appointment);
    setShowConfirmModal(true);
  };

  // Actual cancellation after confirmation
  const confirmCancellation = async () => {
    const appointment = pendingCancelAppointment;
    setShowConfirmModal(false);

    try {
      const url = `${API_URL}/consultations/${appointment._id}/cancel`;
      console.log("Sending PATCH request to:", url);
      
      const requestBody = {
        reason: "Cancelled by pet owner"
      };
      console.log("Request body:", requestBody);

      const res = await fetch(url, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(requestBody)
      });

      console.log("Response status:", res.status);
      console.log("Response ok:", res.ok);

      let data;
      try {
        data = await res.json();
        console.log("Response data:", data);
      } catch (parseError) {
        console.error("Failed to parse response JSON:", parseError);
        throw new Error("Server returned invalid response");
      }

      if (res.ok && data.success) {
        console.log("Appointment cancelled successfully");
        setSuccess("Appointment cancelled successfully");
        setShowSuccessModal(true);
        await fetchAppointments();
      } else {
        console.error("Server returned error:", data.message);
        throw new Error(data.message || "Failed to cancel appointment");
      }
    } catch (err) {
      console.error("════════════════════════════════════");
      console.error("CANCEL ERROR");
      console.error("════════════════════════════════════");
      console.error("Error object:", err);
      console.error("Error message:", err.message);
      console.error("════════════════════════════════════");
      
      setError(err.message || "Failed to cancel appointment. Please check the console for details.");
      setShowErrorModal(true);
    } finally {
      setPendingCancelAppointment(null);
    }
  };

  return (
    <AppLayout title="My Appointments" role="owner">
      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-success"></div>
        </div>
      )}

      <div className="row g-4">
        {appointments.map((apt) => (
          <div key={apt._id} className="col-md-6">
            <AppointmentCard
              appointment={apt}
              onSchedule={openBookingModal}
              onPayment={handlePayment}
              onJoinConsultation={handleJoinConsultation}
              onViewRecords={handleViewRecords}
              onCancel={handleCancel}
            />
          </div>
        ))}

        {!loading && appointments.length === 0 && (
          <div className="col-12 text-center text-muted">No appointments yet.</div>
        )}
      </div>

      {showBookingModal && selectedConsultation && (
        <BookingModal
          show={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onBook={handleOnBook}
          consultationId={selectedConsultation._id}
          pets={pets}
          vets={vets}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center py-5">
                <CheckCircle size={64} className="text-success mb-3" />
                <h5 className="mb-3">Success!</h5>
                <p className="text-muted mb-0">{success}</p>
              </div>
              <div className="modal-footer border-0 justify-content-center">
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={() => {
                    setShowSuccessModal(false);
                    setSuccess("");
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
                <AlertCircle size={64} className="text-danger mb-3" />
                <h5 className="mb-3">Error</h5>
                <p className="text-muted mb-0">{error}</p>
              </div>
              <div className="modal-footer border-0 justify-content-center">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowErrorModal(false);
                    setError("");
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
      {showConfirmModal && pendingCancelAppointment && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">Confirm Cancellation</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingCancelAppointment(null);
                  }}
                ></button>
              </div>
              <div className="modal-body py-4">
                <p className="mb-0">
                  {pendingCancelAppointment.isPaid 
                    ? "This appointment has been paid for. Are you sure you want to cancel?"
                    : "Are you sure you want to cancel this appointment?"}
                </p>
              </div>
              <div className="modal-footer border-0">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingCancelAppointment(null);
                  }}
                >
                  No, Keep It
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={confirmCancellation}
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}