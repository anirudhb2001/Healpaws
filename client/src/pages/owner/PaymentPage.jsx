import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  CreditCard, 
  Shield, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle,
  ArrowLeft,
  XCircle,
  AlertCircle
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";

const API_URL = "http://localhost:5000/api";

export default function PaymentPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/consultations/${appointmentId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      // Check if already paid
      if (data.consultation.isPaid) {
        setModalMessage("This appointment has already been paid for.");
        setShowErrorModal(true);
        setTimeout(() => {
          navigate("/app/owner/appointments");
        }, 2000);
        return;
      }

      // Check if appointment is confirmed
      if (data.consultation.status !== "confirmed") {
        setModalMessage("Payment can only be made for confirmed appointments.");
        setShowErrorModal(true);
        setTimeout(() => {
          navigate("/app/owner/appointments");
        }, 2000);
        return;
      }

      setAppointment(data.consultation);
    } catch (err) {
      setError(err.message || "Failed to load appointment details");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    setShowModal(true);
  };

  const handlePaymentSuccess = async () => {
    try {
      setShowModal(false);
      setProcessing(true);

      const res = await fetch(`${API_URL}/consultations/${appointment._id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: appointment.consultationFee || 500,
          paymentMethod: "dummy",
          status: "success"
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setModalMessage("Payment successful! The veterinarian has been notified.");
      setShowSuccessModal(true);
      setTimeout(() => {
        navigate("/app/owner/appointments");
      }, 2000);
    } catch (err) {
      console.error("Payment error:", err);
      setModalMessage(err.message || "Payment failed. Please try again.");
      setShowErrorModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentFailure = () => {
    setShowModal(false);
    setModalMessage("Payment cancelled. Please try again when ready.");
    setShowErrorModal(true);
  };

  if (loading) {
    return (
      <AppLayout title="Payment" role="owner">
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p className="mt-3">Loading payment details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Payment" role="owner">
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError('')}
            aria-label="Close"
          ></button>
        </div>
      </AppLayout>
    );
  }

  const petName = appointment?.petId?.name || "Unknown Pet";
  const vetName = appointment?.vetId?.name || "Unknown Vet";
  const consultationFee = appointment?.consultationFee || 500;
  const totalAmount = consultationFee;

  return (
    <AppLayout title="Payment" role="owner">
      <div className="row">
        
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center mb-4">
                <h4 className="mb-0">Payment</h4>
              </div>

              <div className="alert alert-info">
                <small>
                  <strong>Note:</strong> This is a dummy payment simulation for testing purposes. Click "Pay Now" to simulate the payment process.
                </small>
              </div>

              <div className="d-flex align-items-center text-muted mt-4">
                <Shield size={20} className="me-2" />
                <small>Your payment information is encrypted and secure</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm sticky-top" style={{ top: "20px" }}>
            <div className="card-body">
              <h5 className="mb-4">Order Summary</h5>

              <div className="mb-3 pb-3 border-bottom">
                <div className="d-flex align-items-center mb-2">
                  <User size={16} className="me-2 text-muted" />
                  <small className="text-muted">Pet:</small>
                  <strong className="ms-auto">{petName}</strong>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <User size={16} className="me-2 text-muted" />
                  <small className="text-muted">Veterinarian:</small>
                  <strong className="ms-auto">Dr. {vetName}</strong>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <Calendar size={16} className="me-2 text-muted" />
                  <small className="text-muted">Date:</small>
                  <strong className="ms-auto">
                    {appointment?.appointmentDate || "N/A"}
                  </strong>
                </div>
                <div className="d-flex align-items-center">
                  <Clock size={16} className="me-2 text-muted" />
                  <small className="text-muted">Time:</small>
                  <strong className="ms-auto">{appointment?.appointmentTime || "N/A"}</strong>
                </div>
              </div>

              <div className="mb-3 pb-3 border-bottom">
                <div className="d-flex justify-content-between mb-2">
                  <span>Consultation Fee</span>
                  <span>₹{consultationFee}</span>
                </div>
              </div>

              <div className="d-flex justify-content-between mb-4">
                <h5 className="mb-0">Total Amount</h5>
                <h5 className="mb-0 text-success">₹{totalAmount}</h5>
              </div>

              <button
                className="btn btn-success w-100 py-2"
                onClick={handlePayment}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} className="me-2" />
                    Pay Now
                  </>
                )}
              </button>

              <small className="text-muted d-block text-center mt-3">
                By proceeding, you agree to our Terms & Conditions
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Simulation Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">Simulate Payment</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body text-center py-4">
                <div className="mb-4">
                  <CreditCard size={64} className="text-primary mb-3" />
                  <h6 className="mb-2">Payment Amount: ₹{totalAmount}</h6>
                  <p className="text-muted mb-0">Choose payment outcome for testing</p>
                </div>
                
                <div className="d-grid gap-3">
                  <button
                    className="btn btn-success btn-lg"
                    onClick={handlePaymentSuccess}
                    disabled={processing}
                  >
                    <CheckCircle size={20} className="me-2" />
                    Payment Success
                  </button>
                  
                  <button
                    className="btn btn-danger btn-lg"
                    onClick={handlePaymentFailure}
                    disabled={processing}
                  >
                    <XCircle size={20} className="me-2" />
                    Payment Failure
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    navigate("/app/owner/appointments");
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
                <p className="text-muted mb-0">{modalMessage}</p>
              </div>
              <div className="modal-footer border-0 justify-content-center">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowErrorModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}