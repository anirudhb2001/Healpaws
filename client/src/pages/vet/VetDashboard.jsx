import React, { useEffect, useState } from 'react'
import { Clock, CheckCircle, Calendar, Video, Heart, Shield, Activity, Bell, AlertCircle } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import { useNavigate } from 'react-router-dom';

export default function VetDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    today: 0,
    virtual: 0
  });
  const [errorModal, setErrorModal] = useState({
    show: false,
    title: '',
    message: ''
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

  // Show error modal
  const showError = (title, message) => {
    setErrorModal({
      show: true,
      title,
      message
    });
  };

  // Close error modal
  const closeErrorModal = () => {
    setErrorModal({
      show: false,
      title: '',
      message: ''
    });
  };

  useEffect(() => {
    if (!vetId) {
      showError('Authentication Required', 'Please login as veterinarian');
      setTimeout(() => {
        navigate("/");
      }, 2000);
      return;
    }
    fetchAppointments();
  }, [vetId]);

  // Fetch Vet's Scheduled Appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Fetch all appointments for this vet (including completed)
      const res = await fetch(
        `http://localhost:5000/api/consultations/vet/appointments/${vetId}`
      );
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to fetch appointments" }));
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Fetched appointments:", data);
      
      // Handle both possible response formats
      let appointmentsList = data.appointments || data.data || [];
      
      // The API only returns scheduled, confirmed, in-progress
      // We need to also fetch completed appointments for stats
      const completedRes = await fetch(
        `http://localhost:5000/api/consultations/history/vet/${vetId}`
      );
      
      if (completedRes.ok) {
        const completedData = await completedRes.json();
        const completedList = completedData.history || [];
        console.log("Fetched completed consultations:", completedList);
        
        // Combine both lists
        appointmentsList = [...appointmentsList, ...completedList];
      }
      
      setAppointments(appointmentsList);
      
      // Calculate stats
      calculateStats(appointmentsList);
      
      // Generate notifications (only for active appointments)
      const activeAppointments = appointmentsList.filter(a => 
        ['scheduled', 'confirmed', 'in-progress'].includes(a.status)
      );
      generateNotifications(activeAppointments);
    } catch (error) {
      console.error("Fetch error:", error);
      showError('Loading Error', `Failed to load appointments: ${error.message}`);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (appointmentsList) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Pending = scheduled status (waiting for vet to accept)
    const pending = appointmentsList.filter(a => a.status === "scheduled").length;
    
    // Completed = completed status
    const completed = appointmentsList.filter(a => a.status === "completed").length;
    
    // Today's appointments (any status)
    const todayCount = appointmentsList.filter(a => {
      if (!a.appointmentDate) return false;
      // Handle different date formats
      const aptDate = new Date(a.appointmentDate).toISOString().split('T')[0];
      return aptDate === today;
    }).length;
    
    // Virtual consultations (check consultationType or type field)
    const virtual = appointmentsList.filter(a => 
      a.consultationType === "virtual" || 
      a.type === "virtual" ||
      (a.meetingLink && a.meetingLink.includes("meet.google.com"))
    ).length;

    console.log("Stats calculated:", { pending, completed, today: todayCount, virtual });

    setStats({
      pending,
      completed,
      today: todayCount,
      virtual
    });
  };

  // Generate notifications from appointments
  const generateNotifications = (appointmentsList) => {
    const notifs = [];

    // New scheduled appointments (need approval)
    const scheduledAppointments = appointmentsList.filter(apt => apt.status === 'scheduled');
    if (scheduledAppointments.length > 0) {
      notifs.push({
        id: 'scheduled',
        type: 'new_appointment',
        icon: Calendar,
        color: 'primary',
        title: 'New Appointment Requests',
        message: `${scheduledAppointments.length} new appointment${scheduledAppointments.length > 1 ? 's' : ''} need${scheduledAppointments.length === 1 ? 's' : ''} your approval`,
        count: scheduledAppointments.length,
        action: () => navigate('/app/vet/pending')
      });
    }

    // Confirmed & paid appointments (need meeting link)
    const needMeetingLink = appointmentsList.filter(apt => 
      apt.status === 'confirmed' && apt.isPaid && !apt.meetingLink
    );
    if (needMeetingLink.length > 0) {
      notifs.push({
        id: 'meeting_link',
        type: 'meeting_link_required',
        icon: Video,
        color: 'success',
        title: 'Send Meeting Links',
        message: `${needMeetingLink.length} paid appointment${needMeetingLink.length > 1 ? 's' : ''} waiting for meeting link`,
        count: needMeetingLink.length,
        action: () => navigate('/app/vet/pending')
      });
    }

    // Cancelled appointments (last 24 hours)
    const cancelledRecently = appointmentsList.filter(apt => {
      if (apt.status !== 'cancelled') return false;
      const cancelTime = new Date(apt.cancelledAt || apt.updatedAt);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return cancelTime >= dayAgo;
    });
    if (cancelledRecently.length > 0) {
      notifs.push({
        id: 'cancelled',
        type: 'appointment_cancelled',
        icon: AlertCircle,
        color: 'danger',
        title: 'Recent Cancellations',
        message: `${cancelledRecently.length} appointment${cancelledRecently.length > 1 ? 's' : ''} cancelled in the last 24 hours`,
        count: cancelledRecently.length,
        action: () => navigate('/app/vet-dashboard')
      });
    }

    setNotifications(notifs);
  };

  // Navigate to pending requests page
  const handleViewAllRequests = () => {
    navigate('/app/vet/pending');
  };

  // Helper function to safely check AI prediction string
  const getAIPredictionString = (aiPrediction) => {
    if (!aiPrediction) return '';
    if (typeof aiPrediction === 'string') return aiPrediction.toLowerCase();
    if (typeof aiPrediction === 'object' && aiPrediction.prediction) {
      return String(aiPrediction.prediction).toLowerCase();
    }
    return String(aiPrediction).toLowerCase();
  };

  // Get only scheduled appointments for consultation requests section
  const scheduledRequests = appointments.filter(apt => apt.status === "scheduled").slice(0, 5);

  if (loading) {
    return (
      <AppLayout title="Veterinarian Dashboard" role="vet">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading dashboard...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Veterinarian Dashboard" role="vet">
      {/* Error Modal */}
      {errorModal.show && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title text-danger">
                  <AlertCircle className="me-2" size={24} />
                  {errorModal.title}
                </h5>
                <button type="button" className="btn-close" onClick={closeErrorModal}></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">{errorModal.message}</p>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-primary" onClick={closeErrorModal}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards - Responsive Grid */}
      <div className="row g-3 g-md-4 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-danger bg-opacity-10 p-2 p-md-3 me-2 me-md-3">
                  <Clock size={window.innerWidth < 768 ? 18 : 24} />
                </div>
                <div>
                  <h6 className="text-muted mb-0 small fs-6">Pending</h6>
                  <h3 className="mb-0 fs-4 fs-md-3">{stats.pending}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-success bg-opacity-10 p-2 p-md-3 me-2 me-md-3">
                  <CheckCircle size={window.innerWidth < 768 ? 18 : 24} />
                </div>
                <div>
                  <h6 className="text-muted mb-0 small fs-6">Completed</h6>
                  <h3 className="mb-0 fs-4 fs-md-3">{stats.completed}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-primary bg-opacity-10 p-2 p-md-3 me-2 me-md-3">
                  <Calendar size={window.innerWidth < 768 ? 18 : 24} />
                </div>
                <div>
                  <h6 className="text-muted mb-0 small fs-6">Today</h6>
                  <h3 className="mb-0 fs-4 fs-md-3">{stats.today}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-info bg-opacity-10 p-2 p-md-3 me-2 me-md-3">
                  <Video size={window.innerWidth < 768 ? 18 : 24} />
                </div>
                <div>
                  <h6 className="text-muted mb-0 small fs-6">Virtual</h6>
                  <h3 className="mb-0 fs-4 fs-md-3">{stats.virtual}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Consultation Requests Section - Responsive */}
      <div className="row g-3 g-md-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold fs-7 fs-md-5">Consultation Requests</h5>
              {scheduledRequests.length > 0 && (
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={handleViewAllRequests}
                >
                  <span className="d-none d-sm-inline">View All</span>
                  <span className="d-sm-none">All</span>
                </button>
              )}
            </div>
            <div className="card-body p-2 p-md-3">
              {scheduledRequests.length === 0 ? (
                <div className="text-center py-4">
                  <Calendar size={48} className="text-muted mb-3" />
                  <p className="text-muted mb-0">No pending consultation requests</p>
                </div>
              ) : (
                <>
                  {/* Desktop View */}
                  <div className="d-none d-md-block">
                    {scheduledRequests.map(req => (
                      <div 
                        key={req._id} 
                        className="border rounded-3 p-3 mb-3"
                        onClick={handleViewAllRequests}
                        style={{ 
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <div className="row align-items-center">
                          <div className="col-md-6">
                            <div className="d-flex align-items-center mb-2">
                              <img
                                src={
                                  req.petId?.petPhoto
                                    ? `http://localhost:5000/${req.petId.petPhoto}`
                                    : "https://cdn-icons-png.flaticon.com/512/194/194279.png"
                                }
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                  marginRight: "12px",
                                }}
                                alt="pet"
                              />
                              <div>
                                <h6 className="mb-0">{req.petId?.name || "Unknown Pet"} ({req.petId?.breed || "N/A"})</h6>
                                <small className="text-muted">Owner: {req.ownerId?.name || "Unknown"}</small>
                              </div>
                            </div>
                            <p className="mb-0 mt-2">
                              <strong>Symptoms:</strong> {req.symptoms || "No symptoms provided"}
                            </p>
                            {req.appointmentDate && req.appointmentTime && (
                              <small className="text-primary d-block mt-1">
                                <Calendar size={14} className="me-1" />
                                {req.appointmentDate} at {req.appointmentTime}
                              </small>
                            )}
                          </div>
                          <div className="col-md-3">
                            <small className="text-muted d-flex align-items-center">
                              <Clock size={14} className="me-1" />
                              {new Date(req.createdAt).toLocaleString()}
                            </small>
                            <span className="badge bg-warning text-dark mt-2">Needs Action</span>
                          </div>
                          <div className="col-md-3 text-end">
                            <button 
                              className="btn btn-outline-primary btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewAllRequests();
                              }}
                            >
                              View Details →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile/Tablet View */}
                  <div className="d-md-none">
                    {scheduledRequests.map(req => (
                      <div 
                        key={req._id} 
                        className="card mb-3 border"
                        onClick={handleViewAllRequests}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="card-body p-3">
                          <div className="d-flex align-items-start mb-3">
                            <img
                              src={
                                req.petId?.petPhoto
                                  ? `http://localhost:5000/${req.petId.petPhoto}`
                                  : "https://cdn-icons-png.flaticon.com/512/194/194279.png"
                              }
                              style={{
                                width: "50px",
                                height: "50px",
                                borderRadius: "50%",
                                objectFit: "cover",
                                marginRight: "12px",
                                flexShrink: 0
                              }}
                              alt="pet"
                            />
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{req.petId?.name || "Unknown Pet"}</h6>
                              <small className="text-muted d-block">{req.petId?.breed || "N/A"}</small>
                              <small className="text-muted d-block">Owner: {req.ownerId?.name || "Unknown"}</small>
                            </div>
                            <span className="badge bg-warning text-dark">Action</span>
                          </div>
                          
                          <div className="mb-2">
                            <small className="text-muted d-block mb-1"><strong>Symptoms:</strong></small>
                            <small className="d-block">
                              {(req.symptoms || "No symptoms provided").length > 100 
                                ? `${req.symptoms.substring(0, 100)}...` 
                                : (req.symptoms || "No symptoms provided")
                              }
                            </small>
                          </div>
                          
                          {req.appointmentDate && req.appointmentTime && (
                            <div className="mb-2">
                              <small className="text-primary d-flex align-items-center">
                                <Calendar size={14} className="me-1" />
                                {req.appointmentDate} at {req.appointmentTime}
                              </small>
                            </div>
                          )}
                          
                          <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                            <small className="text-muted d-flex align-items-center">
                              <Clock size={12} className="me-1" />
                              {new Date(req.createdAt).toLocaleDateString()}
                            </small>
                            <button 
                              className="btn btn-outline-primary btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewAllRequests();
                              }}
                            >
                              View →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule and Quick Stats - Responsive */}
      <div className="row g-3 g-md-4 mt-2">
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold fs-7 fs-md-5">Today's Schedule</h5>
            </div>
            <div className="card-body p-2 p-md-3">
              {appointments.filter(apt => {
                if (!apt.appointmentDate) return false;
                const today = new Date().toISOString().split('T')[0];
                const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
                return aptDate === today;
              }).slice(0, 5).map(apt => (
                <div 
                  key={apt._id} 
                  className="d-flex align-items-center justify-content-between p-2 p-md-3 mb-2 bg-light rounded-3"
                  style={{ cursor: 'pointer' }}
                  onClick={handleViewAllRequests}
                >
                  <div className="flex-grow-1 pe-2">
                    <h6 className="mb-1 small">{apt.petId?.name || "Unknown Pet"}</h6>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {apt.appointmentTime || "Time not set"}
                    </small>
                  </div>
                  <span className={`badge ${
                    apt.status === 'scheduled' ? 'bg-warning text-dark' :
                    apt.status === 'confirmed' ? 'bg-success' :
                    apt.status === 'in-progress' ? 'bg-primary' : 'bg-secondary'
                  }`} style={{ fontSize: '0.7rem' }}>
                    {apt.status}
                  </span>
                </div>
              ))}
              {appointments.filter(apt => {
                if (!apt.appointmentDate) return false;
                const today = new Date().toISOString().split('T')[0];
                const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
                return aptDate === today;
              }).length === 0 && (
                <div className="text-center py-4">
                  <Calendar size={window.innerWidth < 768 ? 36 : 48} className="text-muted mb-3" />
                  <p className="text-muted mb-0 small">No appointments for today</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold fs-7 fs-md-5">Quick Stats</h5>
            </div>
            <div className="card-body p-2 p-md-3">
              <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                <div className="d-flex align-items-center">
                  <Heart className="text-danger me-2" size={window.innerWidth < 768 ? 18 : 20} />
                  <span className="small">Emergency Cases</span>
                </div>
                <span className="badge bg-danger">
                  {appointments.filter(a => {
                    const predictionStr = getAIPredictionString(a.aiPrediction);
                    return predictionStr && (
                      predictionStr.includes('emergency') || 
                      predictionStr.includes('critical') ||
                      predictionStr.includes('severe')
                    );
                  }).length}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                <div className="d-flex align-items-center">
                  <Shield className="text-success me-2" size={window.innerWidth < 768 ? 18 : 20} />
                  <span className="small">Follow-up Required</span>
                </div>
                <span className="badge bg-success">
                  {appointments.filter(a => a.status === "completed" && a.followUpRequired).length}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <Activity className="text-info me-2" size={window.innerWidth < 768 ? 18 : 20} />
                  <span className="small">AI Assisted Cases</span>
                </div>
                <span className="badge bg-info">
                  {appointments.filter(a => {
                    const predictionStr = getAIPredictionString(a.aiPrediction);
                    return predictionStr && predictionStr !== "awaiting analysis" && predictionStr.trim() !== "";
                  }).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}