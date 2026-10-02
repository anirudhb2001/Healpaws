import React, { useState, useEffect } from 'react'
import { Calendar, PawPrint, FileText, Bell, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import AddPetPage from './AddPetPage'
import AppLayout from '../layouts/AppLayout'
import { useNavigate, Link } from 'react-router-dom'

export default function OwnerDashboard() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [pets, setPets] = useState([])
  const [appointments, setAppointments] = useState([])
  const [healthRecords, setHealthRecords] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [appointmentsLoading, setAppointmentsLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = localStorage.getItem('healpaws_user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        console.log('Parsed user:', parsedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        navigate('/')
      }
    } else {
      navigate('/')
    }
  }, [navigate])

  const fetchPets = async () => {
    try {
      setLoading(true)
      setError('')

      const userData = JSON.parse(localStorage.getItem('healpaws_user'))
      let ownerId = userData?._id || userData?.id

      if (!ownerId) {
        setError('User not logged in')
        setLoading(false)
        return
      }

      const response = await fetch(`http://localhost:5000/api/pets/owner/${ownerId}`)
      const data = await response.json()

      if (data.success) {
        setPets(data.pets)
      } else {
        setError(data.message || 'Failed to fetch pets')
      }
    } catch (error) {
      console.error('Error fetching pets:', error)
      setError('Failed to load pets')
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (date) => {
    if (!date) return 'Just now'
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return new Date(date).toLocaleDateString()
  }

  // Helper function to safely convert AI prediction to string
  const getAIPredictionString = (aiPrediction) => {
    if (!aiPrediction) return 'N/A'
    
    // If it's already a string, return it
    if (typeof aiPrediction === 'string') return aiPrediction
    
    // If it's an object, extract the diagnosis field
    if (typeof aiPrediction === 'object') {
      if (aiPrediction.diagnosis) return aiPrediction.diagnosis
      if (aiPrediction.prediction) return aiPrediction.prediction
      // If object has multiple fields, create a summary
      return JSON.stringify(aiPrediction)
    }
    
    return 'N/A'
  }

  const fetchAppointments = async () => {
    try {
      setAppointmentsLoading(true)

      const userData = JSON.parse(localStorage.getItem('healpaws_user'))
      let ownerId = userData?._id || userData?.id

      if (!ownerId) {
        setAppointmentsLoading(false)
        return
      }

      const response = await fetch(`http://localhost:5000/api/consultations/owner/${ownerId}`)
      
      if (!response.ok) {
        console.error('Failed to fetch appointments:', response.status)
        setAppointments([])
        setHealthRecords([])
        setNotifications([])
        setAppointmentsLoading(false)
        return
      }

      const data = await response.json()
      console.log('Appointments data:', data)

      // Handle both 'appointments' and 'consultations' keys
      const consultationsList = data.appointments || data.consultations || []

      if (data.success && Array.isArray(consultationsList)) {
        // Sort all appointments by date (most recent first)
        const sortedAppointments = consultationsList.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )

        // Filter for upcoming/active appointments
        const upcoming = sortedAppointments
          .filter(c => ['scheduled', 'confirmed', 'in-progress'].includes(c.status))
          .slice(0, 5)

        setAppointments(upcoming)

        // Create health records from completed consultations
        const completed = sortedAppointments
          .filter(c => c.status === 'completed')
          .map(c => ({
            id: c._id,
            date: new Date(c.createdAt).toLocaleDateString(),
            pet: c.petId?.name || c.petName || 'Unknown Pet',
            diagnosis: getAIPredictionString(c.aiPrediction),
            vet: c.vetId?.name || 'Not assigned',
            consultationId: c._id,
            status: c.status
          }))

        setHealthRecords(completed)

        // Generate notifications based on appointment status
        const notificationsList = []

        // Priority 1: In-progress consultations with meeting links
        const inProgressAppts = sortedAppointments.filter(c => 
          c.status === 'in-progress' && c.meetingLink
        )
        inProgressAppts.forEach(apt => {
          notificationsList.push({
            id: `in-progress-${apt._id}`,
            type: 'info',
            icon: <Clock size={20} />,
            title: 'Consultation In Progress',
            message: `Your consultation with Dr. ${apt.vetId?.name || 'Veterinarian'} for ${apt.petId?.name || apt.petName || 'your pet'} is currently ongoing.`,
            time: formatTimeAgo(apt.consultationStartTime || apt.updatedAt),
            consultationId: apt._id,
            action: 'Join Meeting',
            meetingLink: apt.meetingLink
          })
        })

        // Priority 2: Confirmed appointments with meeting links ready
        const meetingLinkReady = sortedAppointments.filter(c => 
          c.status === 'confirmed' && c.meetingStatus === 'sent' && c.meetingLink
        )
        meetingLinkReady.forEach(apt => {
          notificationsList.push({
            id: `meeting-ready-${apt._id}`,
            type: 'primary',
            icon: <Calendar size={20} />,
            title: 'Meeting Link Ready',
            message: `Dr. ${apt.vetId?.name || 'Veterinarian'} has sent the meeting link for ${apt.petId?.name || apt.petName || 'your pet'}'s consultation. You can join now!`,
            time: formatTimeAgo(apt.updatedAt),
            consultationId: apt._id,
            action: 'Join Meeting',
            meetingLink: apt.meetingLink
          })
        })

        // Priority 3: Payment required for confirmed appointments
        const paymentRequired = sortedAppointments.filter(c => 
          c.status === 'confirmed' && !c.isPaid && (!c.meetingLink || c.meetingStatus !== 'sent')
        )
        paymentRequired.forEach(apt => {
          notificationsList.push({
            id: `payment-${apt._id}`,
            type: 'warning',
            icon: <AlertCircle size={20} />,
            title: 'Payment Required',
            message: `Please complete payment for your appointment with Dr. ${apt.vetId?.name || 'Veterinarian'} for ${apt.petId?.name || apt.petName || 'your pet'}.`,
            time: formatTimeAgo(apt.updatedAt),
            consultationId: apt._id,
            action: 'Make Payment'
          })
        })

        // Priority 4: Confirmed appointments (vet accepted)
        const confirmedAppts = sortedAppointments.filter(c => 
          c.status === 'confirmed' && !c.meetingLink
        )
        confirmedAppts.forEach(apt => {
          notificationsList.push({
            id: `confirmed-${apt._id}`,
            type: 'success',
            icon: <CheckCircle size={20} />,
            title: 'Appointment Confirmed',
            message: `Your appointment with Dr. ${apt.vetId?.name || 'Veterinarian'} for ${apt.petId?.name || apt.petName || 'your pet'} has been confirmed. Waiting for meeting link.`,
            time: formatTimeAgo(apt.updatedAt || apt.createdAt),
            consultationId: apt._id,
            action: 'View Details'
          })
        })

        // Priority 5: Pending appointments (waiting for vet acceptance)
        const pendingAppts = sortedAppointments.filter(c => c.status === 'scheduled')
        pendingAppts.forEach(apt => {
          notificationsList.push({
            id: `pending-${apt._id}`,
            type: 'warning',
            icon: <AlertCircle size={20} />,
            title: 'Waiting for Vet Confirmation',
            message: `Your appointment request for ${apt.petId?.name || apt.petName || 'your pet'} is pending confirmation from Dr. ${apt.vetId?.name || 'the veterinarian'}.`,
            time: formatTimeAgo(apt.updatedAt || apt.createdAt),
            consultationId: apt._id,
            action: 'View Status'
          })
        })

        // Priority 6: Declined appointments
        const declinedAppts = sortedAppointments.filter(c => c.status === 'declined')
        declinedAppts.forEach(apt => {
          notificationsList.push({
            id: `declined-${apt._id}`,
            type: 'danger',
            icon: <XCircle size={20} />,
            title: 'Appointment Declined',
            message: `Your appointment request for ${apt.petId?.name || apt.petName || 'your pet'} was declined. Please reschedule with another vet.`,
            time: formatTimeAgo(apt.updatedAt || apt.createdAt),
            consultationId: apt._id,
            action: 'Reschedule'
          })
        })

        // Take top 10 notifications
        setNotifications(notificationsList.slice(0, 10))
      } else {
        setAppointments([])
        setHealthRecords([])
        setNotifications([])
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      setAppointments([])
      setHealthRecords([])
      setNotifications([])
    } finally {
      setAppointmentsLoading(false)
    }
  }

  // Auto-refresh every 30 seconds to show real-time updates
  useEffect(() => {
    if (user) {
      fetchPets()
      fetchAppointments()
      
      const interval = setInterval(() => {
        fetchAppointments()
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [user])

  const handlePetAdded = () => {
    setCurrentView('dashboard')
    fetchPets()
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success'
      case 'scheduled':
        return 'bg-primary'
      case 'in-progress':
        return 'bg-info'
      case 'pending':
        return 'bg-warning'
      case 'declined':
        return 'bg-danger'
      case 'completed':
        return 'bg-secondary'
      case 'cancelled':
        return 'bg-dark'
      default:
        return 'bg-secondary'
    }
  }

  const getNotificationBadgeClass = (type) => {
    switch (type) {
      case 'success':
        return 'border-success bg-success'
      case 'danger':
        return 'border-danger bg-danger'
      case 'warning':
        return 'border-warning bg-warning'
      case 'info':
        return 'border-info bg-info'
      case 'primary':
        return 'border-primary bg-primary'
      default:
        return 'border-secondary bg-secondary'
    }
  }

  const formatAppointmentDateTime = (apt) => {
    if (apt.appointmentDate && apt.appointmentTime) {
      return `${apt.appointmentDate} at ${apt.appointmentTime}`
    }
    return new Date(apt.createdAt).toLocaleDateString()
  }

  const handleNotificationAction = (notification) => {
    console.log('Notification action clicked:', notification)
    
    if ((notification.action === 'Join Meeting' || notification.action === 'View Link') && notification.meetingLink) {
      console.log('Opening meeting link:', notification.meetingLink)
      // Ensure the meeting link is properly formatted
      let meetingUrl = notification.meetingLink
      if (!meetingUrl.startsWith('http://') && !meetingUrl.startsWith('https://')) {
        meetingUrl = 'https://' + meetingUrl
      }
      window.open(meetingUrl, '_blank', 'noopener,noreferrer')
    } else if (notification.action === 'Reschedule') {
      navigate('/app/owner/appointments')
    } else if (notification.action === 'Make Payment') {
      navigate(`/app/owner/consultation/${notification.consultationId}`)
    } else {
      navigate(`/app/owner/consultation/${notification.consultationId}`)
    }
  }

  return (
    <AppLayout
      title={currentView === 'addPet' ? 'Add New Pet' : 'Pet Owner Dashboard'}
      role="owner"
      userName={user?.name}
    >
      {currentView === 'dashboard' && (
        <>
          {/* Stats Row */}
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center">
                  <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                    <PawPrint className="text-success" size={24} />
                  </div>
                  <div>
                    <h6 className="text-muted mb-0">Total Pets</h6>
                    <h3 className="mb-0">{loading ? '...' : pets.length}</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                    <Calendar className="text-primary" size={24} />
                  </div>
                  <div>
                    <h6 className="text-muted mb-0">Appointments</h6>
                    <h3 className="mb-0">{appointmentsLoading ? '...' : appointments.length}</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center">
                  <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                    <FileText className="text-info" size={24} />
                  </div>
                  <div>
                    <h6 className="text-muted mb-0">Health Records</h6>
                    <h3 className="mb-0">{appointmentsLoading ? '...' : healthRecords.length}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          {notifications.length > 0 && (
            <div className="row g-4 mt-3">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0 py-3">
                    <h5 className="mb-0 fw-bold d-flex align-items-center">
                      <Bell size={20} className="me-2" />
                      Recent Updates
                    </h5>
                  </div>
                  <div className="card-body">
                    <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`border-start border-4 ${getNotificationBadgeClass(notif.type)} bg-opacity-10 p-3 mb-3 rounded`}
                        >
                          <div className="d-flex align-items-start">
                            <div className={`me-3 text-${notif.type}`}>
                              {notif.icon}
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{notif.title}</h6>
                              <p className="mb-2 text-muted small">{notif.message}</p>
                              <div className="d-flex justify-content-between align-items-center">
                                <small className="text-muted">{notif.time}</small>
                                <button
                                  className={`btn btn-sm btn-${notif.type}`}
                                  onClick={() => handleNotificationAction(notif)}
                                >
                                  {notif.action}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* My Pets + Appointments */}
          <div className="row g-4 mt-3">
            {/* My Pets */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 py-3">
                  <h5 className="mb-0 fw-bold">My Pets</h5>
                </div>
                <div className="card-body">
                  {error && (
                    <div className="alert alert-danger alert-dismissible fade show">
                      {error}
                      <button type="button" className="btn-close" onClick={() => setError('')}></button>
                    </div>
                  )}

                  {loading && (
                    <div className="text-center py-4">
                      <div className="spinner-border text-success"></div>
                      <p className="text-muted mt-2">Loading pets...</p>
                    </div>
                  )}

                  {!loading && !error && pets.length > 0 && (
                    <div
                      style={{
                        maxHeight: pets.length > 2 ? '180px' : 'auto',
                        overflowY: pets.length > 2 ? 'auto' : 'visible',
                        paddingRight: "5px"
                      }}
                    >
                      {pets.map((pet) => (
                        <div
                          key={pet._id}
                          className="d-flex align-items-center p-3 mb-3 bg-light rounded-3"
                        >
                          {pet.petPhoto ? (
                            <img
                              src={`http://localhost:5000/${pet.petPhoto}`}
                              alt={pet.name}
                              style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '50%',
                                marginRight: '15px'
                              }}
                            />
                          ) : (
                            <div className="fs-1 me-3">
                              {pet.species === 'dog'
                                ? '🐕'
                                : pet.species === 'cat'
                                ? '🐈'
                                : pet.species === 'bird'
                                ? '🐦'
                                : '🐰'}
                            </div>
                          )}

                          <div className="flex-grow-1">
                            <h6 className="mb-1">{pet.name}</h6>
                            <small className="text-muted">
                              {pet.breed} • {pet.age ? `${pet.age} years` : 'Age not specified'}
                            </small>
                          </div>

                          <Link
                            to="/app/owner/submit"
                            state={{ pet }}
                            className="btn btn-sm btn-outline-success"
                          >
                            Submit Symptoms
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}

                  {!loading && !error && pets.length === 0 && (
                    <div className="text-center py-4">
                      <PawPrint size={48} className="text-muted mb-2" />
                      <p className="text-muted">No pets registered yet</p>
                    </div>
                  )}

                  <button
                    className="btn btn-success w-100 mt-2"
                    onClick={() => setCurrentView('addPet')}
                  >
                    <PawPrint size={18} className="me-2" /> Add New Pet
                  </button>
                </div>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 py-3">
                  <h5 className="mb-0 fw-bold">Upcoming Appointments</h5>
                </div>
                <div className="card-body">
                  {appointmentsLoading && (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary"></div>
                      <p className="text-muted mt-2">Loading appointments...</p>
                    </div>
                  )}

                  {!appointmentsLoading && appointments.length > 0 && (
                    <div
                      style={{
                        maxHeight: appointments.length > 2 ? '180px' : 'auto',
                        overflowY: appointments.length > 2 ? 'auto' : 'visible',
                        paddingRight: "5px"
                      }}
                    >
                      {appointments.map((apt) => (
                        <div
                          key={apt._id}
                          className="border-start border-4 border-success ps-3 mb-3 pb-3"
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">
                                {apt.petId?.name || apt.petName || 'Pet'} - {apt.vetId?.name || 'Vet not assigned'}
                              </h6>
                              <small className="text-muted d-flex align-items-center mb-2">
                                <Calendar size={14} className="me-1" /> {formatAppointmentDateTime(apt)}
                              </small>
                              {apt.meetingLink && (apt.status === 'confirmed' || apt.status === 'in-progress') && (
                                <button
                                  onClick={() => {
                                    let meetingUrl = apt.meetingLink
                                    if (!meetingUrl.startsWith('http://') && !meetingUrl.startsWith('https://')) {
                                      meetingUrl = 'https://' + meetingUrl
                                    }
                                    window.open(meetingUrl, '_blank', 'noopener,noreferrer')
                                  }}
                                  className="btn btn-sm btn-primary"
                                >
                                  Join Meeting
                                </button>
                              )}
                            </div>
                            <span className={`badge ${getStatusBadgeClass(apt.status)}`}>
                              {apt.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!appointmentsLoading && appointments.length === 0 && (
                    <div className="text-center py-4">
                      <Calendar size={48} className="text-muted mb-2" />
                      <p className="text-muted">No upcoming appointments</p>
                    </div>
                  )}

                  <Link to="/app/owner/appointments" className="btn btn-outline-success w-100 mt-2">
                    <Calendar size={18} className="me-2" /> Schedule New Appointment
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Health Records */}
          <div className="row g-4 mt-3">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 py-3">
                  <h5 className="mb-0 fw-bold">Recent Health Records</h5>
                </div>
                <div className="card-body">
                  {appointmentsLoading && (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary"></div>
                      <p className="text-muted mt-2">Loading health records...</p>
                    </div>
                  )}

                  {!appointmentsLoading && healthRecords.length > 0 && (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Pet</th>
                            <th>Diagnosis/AI Analysis</th>
                            <th>Veterinarian</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {healthRecords.map((rec) => (
                            <tr key={rec.id}>
                              <td>{rec.date}</td>
                              <td>{rec.pet}</td>
                              <td>
                                <small className="text-muted">
                                  {rec.diagnosis.length > 60 
                                    ? `${rec.diagnosis.substring(0, 60)}...` 
                                    : rec.diagnosis}
                                </small>
                              </td>
                              <td>{rec.vet}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() =>
                                    navigate(`/app/owner/consultation/${rec.consultationId}`)
                                  }
                                >
                                  <FileText size={14} className="me-1" /> View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!appointmentsLoading && healthRecords.length === 0 && (
                    <div className="text-center py-4">
                      <FileText size={48} className="text-muted mb-2" />
                      <p className="text-muted">No health records available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {currentView === 'addPet' && (
        <div className="fade-in">
          <AddPetPage navigateBack={handlePetAdded} />
        </div>
      )}
    </AppLayout>
  )
}