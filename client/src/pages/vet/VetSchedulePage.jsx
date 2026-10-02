import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, CheckCircle, FileText, XCircle, User, AlertCircle } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import { useNavigate } from 'react-router-dom';
import ConsultationViewModal from '../../components/appointment/ConsultationViewModal.jsx';

export default function VetSchedulePage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    virtualToday: 0,
    completed: 0
  });
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [loadingConsultation, setLoadingConsultation] = useState(false);

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

  useEffect(() => {
    if (!vetId) {
      alert("Please login as veterinarian");
      navigate("/login");
      return;
    }
    fetchAppointments();
  }, [vetId, navigate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Fetch active appointments (scheduled, confirmed, in-progress)
      const res = await fetch(`http://localhost:5000/api/consultations/vet/appointments/${vetId}`);

      if (!res.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await res.json();
      let appointmentsList = data.appointments || [];

      // Also fetch completed appointments for stats
      const completedRes = await fetch(`http://localhost:5000/api/consultations/history/vet/${vetId}`);
      
      if (completedRes.ok) {
        const completedData = await completedRes.json();
        const completedList = completedData.history || [];
        
        // Combine both lists for complete stats
        appointmentsList = [...appointmentsList, ...completedList];
      }

      console.log("Total appointments fetched:", appointmentsList.length);

      setAppointments(appointmentsList);
      calculateStats(appointmentsList);
    } catch (error) {
      console.error("Fetch error:", error);
      alert(`Failed to load appointments: ${error.message}`);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (appointmentsList) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's appointments (all statuses)
    const todayAppointments = appointmentsList.filter(apt => {
      if (!apt.appointmentDate) return false;
      const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
      return aptDate === today;
    });

    console.log("Today's appointments:", todayAppointments.length);

    // Calculate week range (Sunday to Saturday)
    const now = new Date();
    const firstDayOfWeek = new Date(now);
    firstDayOfWeek.setDate(now.getDate() - now.getDay());
    firstDayOfWeek.setHours(0, 0, 0, 0);

    const lastDayOfWeek = new Date(now);
    lastDayOfWeek.setDate(now.getDate() - now.getDay() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);

    const weekAppointments = appointmentsList.filter(apt => {
      if (!apt.appointmentDate) return false;
      const aptDate = new Date(apt.appointmentDate);
      return aptDate >= firstDayOfWeek && aptDate <= lastDayOfWeek;
    });

    console.log("This week's appointments:", weekAppointments.length);

    // Ready today = confirmed appointments with payment completed for today
    const virtualTodayCount = todayAppointments.filter(apt =>
      (apt.status === 'confirmed' || apt.status === 'in-progress') && 
      apt.isPaid === true
    ).length;

    console.log("Ready today (paid & confirmed):", virtualTodayCount);

    // Completed appointments (all time)
    const completedCount = appointmentsList.filter(apt =>
      apt.status === 'completed'
    ).length;

    console.log("Completed appointments:", completedCount);

    setStats({
      today: todayAppointments.length,
      thisWeek: weekAppointments.length,
      virtualToday: virtualTodayCount,
      completed: completedCount
    });
  };

  // Filter appointments by selected date
  const filteredAppointments = appointments.filter(apt => {
    if (!apt.appointmentDate) return false;
    const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
    return aptDate === selectedDate;
  });

  // Sort appointments by time
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (!a.appointmentTime || !b.appointmentTime) return 0;
    return a.appointmentTime.localeCompare(b.appointmentTime);
  });

  const handleStartConsultation = (appointment) => {
    if (!appointment.isPaid) {
      alert("Cannot start consultation. Payment is pending.");
      return;
    }
    if (!appointment.meetingLink) {
      alert("Please send the meeting link to the pet owner first.");
      return;
    }
    navigate(`/app/vet/diagnosis?consultationId=${appointment._id}`);
  };

  const handleViewDetails = async (appointmentId) => {
    try {
      setLoadingConsultation(true);
      
      // Fetch full consultation details
      const res = await fetch(`http://localhost:5000/api/consultations/${appointmentId}`);
      
      if (!res.ok) {
        throw new Error("Failed to fetch consultation details");
      }
      
      const data = await res.json();
      
      if (data.success && data.consultation) {
        setSelectedConsultation(data.consultation);
        setShowModal(true);
      } else {
        alert("Failed to load consultation details");
      }
    } catch (error) {
      console.error("Error fetching consultation:", error);
      alert("Failed to load consultation details");
    } finally {
      setLoadingConsultation(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedConsultation(null);
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/consultations/decline/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vetId })
      });

      if (!res.ok) {
        throw new Error("Failed to cancel appointment");
      }

      alert("Appointment cancelled successfully");
      fetchAppointments();
    } catch (error) {
      console.error("Cancel error:", error);
      alert(error.message || "Failed to cancel appointment");
    }
  };

  const getStatusBadge = (status, isPaid) => {
    if (status === 'scheduled') {
      return <span className="badge bg-warning text-dark">Pending Confirmation</span>;
    }
    if (status === 'confirmed') {
      if (isPaid) {
        return <span className="badge bg-success">Ready to Start</span>;
      }
      return <span className="badge bg-info">Payment Pending</span>;
    }
    if (status === 'in-progress') {
      return <span className="badge bg-primary">In Progress</span>;
    }
    if (status === 'completed') {
      return <span className="badge bg-secondary">Completed</span>;
    }
    return <span className="badge bg-secondary">{status}</span>;
  };

  if (loading) {
    return (
      <AppLayout title="My Schedule" role="vet">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading schedule...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="My Schedule" role="vet">
      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <Calendar className="text-primary mb-2" size={32} />
              <h3 className="fw-bold mb-0">{stats.today}</h3>
              <small className="text-muted">Today</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <Clock className="text-warning mb-2" size={32} />
              <h3 className="fw-bold mb-0">{stats.thisWeek}</h3>
              <small className="text-muted">This Week</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <Video className="text-success mb-2" size={32} />
              <h3 className="fw-bold mb-0">{stats.virtualToday}</h3>
              <small className="text-muted">Ready Today</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <CheckCircle className="text-info mb-2" size={32} />
              <h3 className="fw-bold mb-0">{stats.completed}</h3>
              <small className="text-muted">Completed</small>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">
              {selectedDate === new Date().toISOString().split('T')[0]
                ? "Today's Appointments"
                : "Appointments"}
            </h5>
            <input
              type="date"
              className="form-control"
              style={{ width: '200px' }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
        <div className="card-body">
          {sortedAppointments.length === 0 ? (
            <div className="text-center py-5">
              <Calendar size={64} className="text-muted mb-3" />
              <h5 className="text-muted">No appointments scheduled for this date</h5>
              <p className="text-muted">Select another date to view appointments</p>
            </div>
          ) : (
            sortedAppointments.map((appointment) => {
              const pet = appointment.petId;
              const owner = appointment.ownerId;
              const isPaymentCompleted = appointment.isPaid === true;
              const canStart = appointment.status === 'confirmed' && isPaymentCompleted && appointment.meetingLink;

              return (
                <div
                  key={appointment._id}
                  className={`border-start border-4 ${appointment.status === 'in-progress' ? 'border-primary' :
                      canStart ? 'border-success' :
                        appointment.status === 'confirmed' ? 'border-info' :
                          'border-warning'
                    } ps-3 mb-4 pb-3`}
                >
                  <div className="row align-items-center">
                    {/* Time */}
                    <div className="col-md-2">
                      <h5 className="fw-bold text-primary mb-0">
                        {appointment.appointmentTime || "Not set"}
                      </h5>
                      <small className="text-muted">{appointment.appointmentDate}</small>
                    </div>

                    {/* Pet & Owner Info */}
                    <div className="col-md-5">
                      <div className="d-flex align-items-center mb-2">
                        <img
                          src={
                            pet?.petPhoto
                              ? `http://localhost:5000/${pet.petPhoto}`
                              : "https://cdn-icons-png.flaticon.com/512/194/194279.png"
                          }
                          alt="pet"
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            marginRight: "12px"
                          }}
                        />
                        <div>
                          <h6 className="mb-0 fw-bold">
                            {pet?.name || "Unknown Pet"} ({pet?.breed || "N/A"})
                          </h6>
                          <small className="text-muted">
                            <User size={14} className="me-1" />
                            Owner: {owner?.name || "Unknown"} • {appointment.symptoms?.substring(0, 40)}...
                          </small>
                        </div>
                      </div>
                      {getStatusBadge(appointment.status, appointment.isPaid)}
                    </div>

                    {/* Action Buttons */}
                    <div className="col-md-5 text-end">
                      {appointment.status === 'scheduled' && (
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleViewDetails(appointment._id)}
                            disabled={loadingConsultation}
                          >
                            <FileText size={14} className="me-1" />
                            {loadingConsultation ? 'Loading...' : 'View Details'}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleCancelAppointment(appointment._id)}
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      )}

                      {appointment.status === 'confirmed' && (
                        <div className="d-flex gap-2 justify-content-end">
                          {!isPaymentCompleted && (
                            <small className="text-warning d-flex align-items-center me-2">
                              <AlertCircle size={14} className="me-1" />
                              Waiting for payment
                            </small>
                          )}
                          {isPaymentCompleted && !appointment.meetingLink && (
                            <small className="text-info d-flex align-items-center me-2">
                              <AlertCircle size={14} className="me-1" />
                              Send meeting link
                            </small>
                          )}
                          <button
                            className={`btn btn-sm ${canStart ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleStartConsultation(appointment)}
                            disabled={!canStart}
                          >
                            <Video size={14} className="me-1" />
                            {canStart ? 'Start Consultation' : 
                             !isPaymentCompleted ? 'Payment Pending' : 
                             'Meeting Link Required'}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleViewDetails(appointment._id)}
                            disabled={loadingConsultation}
                          >
                            <FileText size={14} className="me-1" />
                            {loadingConsultation ? 'Loading...' : 'View'}
                          </button>
                        </div>
                      )}

                      {appointment.status === 'in-progress' && (
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => navigate(`/app/vet/diagnosis?consultationId=${appointment._id}`)}
                          >
                            <Video size={14} className="me-1" />
                            Continue Consultation
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleViewDetails(appointment._id)}
                            disabled={loadingConsultation}
                          >
                            <FileText size={14} className="me-1" />
                            {loadingConsultation ? 'Loading...' : 'View'}
                          </button>
                        </div>
                      )}

                      {appointment.status === 'completed' && (
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleViewDetails(appointment._id)}
                            disabled={loadingConsultation}
                          >
                            <FileText size={14} className="me-1" />
                            {loadingConsultation ? 'Loading...' : 'View Details'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Consultation View Modal */}
      <ConsultationViewModal
        visible={showModal}
        onClose={handleCloseModal}
        consultation={selectedConsultation}
      />
    </AppLayout>
  );
}