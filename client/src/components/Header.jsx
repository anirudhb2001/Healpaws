import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, User, X, Clock, Calendar, AlertTriangle, CheckCircle, XCircle, Stethoscope } from 'lucide-react'

const API_URL = 'http://localhost:5000/api'

export default function Header({ title }) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  const user = JSON.parse(localStorage.getItem('healpaws_user')) || {}
  const role = user.role || 'owner'
  const userId = user.id || user._id
  const userName = user.name || 'User'

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 992)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (userId) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [userId, role])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      let notifs = []

      if (role === 'owner') {
        // Fetch appointment notifications
        const response = await fetch(`${API_URL}/consultations/owner/${userId}`)
        const data = await response.json()
        
        if (data.success && data.appointments) {
          notifs = data.appointments
            .filter(apt => {
              if (apt.status === 'pending') return true
              if (apt.status === 'confirmed' && !apt.isPaid) return true
              if (apt.meetingLink && apt.status === 'confirmed') return true
              if (apt.status === 'declined') return true
              return false
            })
            .map(apt => ({
              id: apt._id,
              type: apt.status === 'declined' ? 'declined' : 
                    apt.status === 'confirmed' && apt.meetingLink ? 'meeting_ready' :
                    apt.status === 'confirmed' ? 'payment_pending' : 'pending',
              message: apt.status === 'declined' 
                ? `Appointment declined by vet. Please reschedule.`
                : apt.status === 'confirmed' && apt.meetingLink
                ? `Meeting link available for ${apt.petId?.name}'s appointment`
                : apt.status === 'confirmed'
                ? `Payment required for ${apt.petId?.name}'s appointment`
                : `Appointment pending - please select a veterinarian`,
              time: apt.updatedAt || apt.createdAt,
              data: apt
            }))
        }

        // Fetch follow-up reminders
        try {
          const followUpResponse = await fetch(`${API_URL}/prescriptions/owner/${userId}/follow-ups`)
          const followUpData = await followUpResponse.json()
          
          if (followUpData.success && followUpData.followUps) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            const twoDaysFromNow = new Date(today)
            twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)

            const upcomingFollowUps = followUpData.followUps
              .filter(prescription => {
                if (!prescription.followUpDate) return false
                
                const followUpDate = new Date(prescription.followUpDate)
                followUpDate.setHours(0, 0, 0, 0)
                
                return followUpDate >= today && followUpDate <= twoDaysFromNow
              })
              .map(prescription => {
                const followUpDate = new Date(prescription.followUpDate)
                followUpDate.setHours(0, 0, 0, 0)
                
                const daysUntil = Math.ceil((followUpDate - today) / (1000 * 60 * 60 * 24))
                
                let timeMessage = ''
                if (daysUntil === 0) {
                  timeMessage = 'today'
                } else if (daysUntil === 1) {
                  timeMessage = 'tomorrow'
                } else {
                  timeMessage = `in ${daysUntil} days`
                }

                return {
                  id: `followup-${prescription._id}`,
                  type: 'follow_up_reminder',
                  message: `Follow-up reminder: ${prescription.consultationId?.petId?.name || 'Your pet'} - ${prescription.followUpReason} (${timeMessage})`,
                  time: prescription.createdAt,
                  priority: daysUntil === 0 ? 3 : daysUntil === 1 ? 2 : 1,
                  data: prescription
                }
              })

            notifs = [...notifs, ...upcomingFollowUps]
          }
        } catch (followUpError) {
          console.error('Error fetching follow-ups:', followUpError)
        }

        // **Fetch ACTIVE disease outbreak alerts for owner's location**
        try {
          const userCity = user.city || user.location || ''
          const userState = user.state || ''
          
          if (userCity || userState) {
            // Fetch active disease alerts
            const alertResponse = await fetch(`${API_URL}/disease-alerts?status=active`)
            const alertData = await alertResponse.json()
            
            if (alertData.success && alertData.alerts) {
              const activeAlerts = alertData.alerts
                .filter(alert => {
                  // Check if alert is relevant to owner's location
                  const alertArea = alert.area.toLowerCase()
                  const ownerCity = userCity.toLowerCase()
                  const ownerState = userState.toLowerCase()
                  
                  return alertArea.includes(ownerCity) || 
                         alertArea.includes(ownerState) ||
                         ownerCity.includes(alertArea) ||
                         ownerState.includes(alertArea)
                })
                .map(alert => ({
                  id: `disease-alert-${alert._id}`,
                  type: 'disease_outbreak_owner',
                  message: `⚠️ Disease Alert: ${alert.cases} cases of ${alert.disease} reported in ${alert.area}. ${alert.severity === 'high' ? 'Take immediate precautions!' : 'Please be cautious.'}`,
                  time: alert.createdAt,
                  priority: alert.severity === 'high' ? 5 : alert.severity === 'medium' ? 3 : 2,
                  data: alert
                }))
              
              notifs = [...notifs, ...activeAlerts]
            }
          }
        } catch (alertError) {
          console.error('Error fetching active disease alerts:', alertError)
        }

        // **NEW: Fetch RESOLVED disease alerts (last 7 days) for owner's location**
        try {
          const userCity = user.city || user.location || ''
          const userState = user.state || ''
          
          if (userCity || userState) {
            // Fetch resolved disease alerts from last 7 days
            const resolvedAlertResponse = await fetch(`${API_URL}/disease-alerts?status=resolved`)
            const resolvedAlertData = await resolvedAlertResponse.json()
            
            if (resolvedAlertData.success && resolvedAlertData.alerts) {
              const sevenDaysAgo = new Date()
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
              
              const recentResolvedAlerts = resolvedAlertData.alerts
                .filter(alert => {
                  // Check if resolved recently (last 7 days)
                  const resolvedDate = new Date(alert.resolvedAt || alert.updatedAt)
                  if (resolvedDate < sevenDaysAgo) return false
                  
                  // Check if alert is relevant to owner's location
                  const alertArea = alert.area.toLowerCase()
                  const ownerCity = userCity.toLowerCase()
                  const ownerState = userState.toLowerCase()
                  
                  return alertArea.includes(ownerCity) || 
                         alertArea.includes(ownerState) ||
                         ownerCity.includes(alertArea) ||
                         ownerState.includes(alertArea)
                })
                .map(alert => ({
                  id: `disease-resolved-${alert._id}`,
                  type: 'disease_resolved_owner',
                  message: `✅ Good News! The ${alert.disease} outbreak in ${alert.area} has been resolved. Your pets are now safe.`,
                  time: alert.resolvedAt || alert.updatedAt,
                  priority: 2,
                  data: alert
                }))
              
              notifs = [...notifs, ...recentResolvedAlerts]
            }
          }
        } catch (resolvedAlertError) {
          console.error('Error fetching resolved disease alerts:', resolvedAlertError)
        }

        // **NEW: Fetch MONITORING disease alerts for owner's location**
        try {
          const userCity = user.city || user.location || ''
          const userState = user.state || ''
          
          if (userCity || userState) {
            // Fetch monitoring disease alerts
            const monitoringAlertResponse = await fetch(`${API_URL}/disease-alerts?status=monitoring`)
            const monitoringAlertData = await monitoringAlertResponse.json()
            
            if (monitoringAlertData.success && monitoringAlertData.alerts) {
              const monitoringAlerts = monitoringAlertData.alerts
                .filter(alert => {
                  // Check if alert is relevant to owner's location
                  const alertArea = alert.area.toLowerCase()
                  const ownerCity = userCity.toLowerCase()
                  const ownerState = userState.toLowerCase()
                  
                  return alertArea.includes(ownerCity) || 
                         alertArea.includes(ownerState) ||
                         ownerCity.includes(alertArea) ||
                         ownerState.includes(alertArea)
                })
                .map(alert => ({
                  id: `disease-monitoring-${alert._id}`,
                  type: 'disease_monitoring_owner',
                  message: `📊 Update: ${alert.disease} outbreak in ${alert.area} is being monitored. Current cases: ${alert.cases}. Stay vigilant.`,
                  time: alert.updatedAt,
                  priority: 2,
                  data: alert
                }))
              
              notifs = [...notifs, ...monitoringAlerts]
            }
          }
        } catch (monitoringAlertError) {
          console.error('Error fetching monitoring disease alerts:', monitoringAlertError)
        }

      } else if (role === 'vet') {
        const response = await fetch(`${API_URL}/consultations/vet/appointments/${userId}`)
        const data = await response.json()
        
        if (data.success && data.appointments) {
          const scheduledAppointments = data.appointments.filter(apt => apt.status === 'scheduled')
          const confirmedPaidAppointments = data.appointments.filter(apt => 
            apt.status === 'confirmed' && apt.isPaid
          )
          const cancelledAppointments = data.appointments.filter(apt => apt.status === 'cancelled')
          
          const scheduledNotifs = scheduledAppointments.map(apt => ({
            id: apt._id,
            type: 'new_appointment',
            message: `New appointment request for ${apt.petId?.name} from ${apt.ownerId?.name}`,
            time: apt.updatedAt || apt.createdAt,
            data: apt
          }))

          const readyForMeetingNotifs = confirmedPaidAppointments
            .filter(apt => !apt.meetingLink)
            .map(apt => ({
              id: apt._id,
              type: 'meeting_link_required',
              message: `Payment completed for ${apt.petId?.name}'s appointment. Send meeting link.`,
              time: apt.paymentDate || apt.updatedAt,
              data: apt
            }))

          const cancelledNotifs = cancelledAppointments
            .filter(apt => {
              const cancelTime = new Date(apt.cancelledAt || apt.updatedAt)
              const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
              return cancelTime >= dayAgo
            })
            .map(apt => ({
              id: apt._id,
              type: 'appointment_cancelled',
              message: `Appointment cancelled by ${apt.ownerId?.name} for ${apt.petId?.name}`,
              time: apt.cancelledAt || apt.updatedAt,
              data: apt
            }))

          notifs = [...scheduledNotifs, ...readyForMeetingNotifs, ...cancelledNotifs]
        }
      } else if (role === 'admin') {
        // Fetch pending vet approvals
        const usersResponse = await fetch(`${API_URL}/users`)
        const usersData = await usersResponse.json()
        
        let userNotifs = []
        if (Array.isArray(usersData)) {
          userNotifs = usersData
            .filter(u => u.role === 'vet' && !u.isApproved)
            .map(u => ({
              id: u._id,
              type: 'vet_approval',
              message: `New veterinarian registration: ${u.name}`,
              time: u.createdAt,
              data: u
            }))
        } else if (usersData.users && Array.isArray(usersData.users)) {
          userNotifs = usersData.users
            .filter(u => u.role === 'vet' && !u.isApproved)
            .map(u => ({
              id: u._id,
              type: 'vet_approval',
              message: `New veterinarian registration: ${u.name}`,
              time: u.createdAt,
              data: u
            }))
        }

        // Fetch AI-detected disease outbreak alerts
        const consultsResponse = await fetch(`${API_URL}/consultations`)
        const consultsData = await consultsResponse.json()
        
        let diseaseNotifs = []
        if (consultsData.success && consultsData.appointments) {
          // Group by location and disease
          const locationDiseaseMap = {}
          
          consultsData.appointments.forEach(apt => {
            if (apt.aiPrediction && apt.createdAt && apt.ownerId) {
              const disease = apt.aiPrediction.toLowerCase()
              const location = apt.ownerId.city || apt.ownerId.state || 'Unknown'
              const date = new Date(apt.createdAt)
              const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              
              if (date >= weekAgo && location !== 'Unknown') {
                const key = `${location}-${disease}`
                
                if (!locationDiseaseMap[key]) {
                  locationDiseaseMap[key] = {
                    location,
                    disease,
                    count: 0
                  }
                }
                locationDiseaseMap[key].count++
              }
            }
          })

          // Create notifications for locations with 3+ cases
          Object.entries(locationDiseaseMap).forEach(([key, data]) => {
            if (data.count >= 3) {
              diseaseNotifs.push({
                id: `outbreak-${key}`,
                type: 'disease_outbreak',
                message: `⚠️ Potential outbreak in ${data.location}: ${data.count} cases of ${data.disease} in past week. Consider creating an alert.`,
                time: new Date().toISOString(),
                priority: data.count >= 5 ? 5 : 3,
                data: { location: data.location, disease: data.disease, count: data.count }
              })
            }
          })
        }

        notifs = [...userNotifs, ...diseaseNotifs]
      }

      // Sort notifications by priority and time
      notifs.sort((a, b) => {
        if (a.priority && b.priority) {
          return b.priority - a.priority
        }
        if (a.priority) return -1
        if (b.priority) return 1
        return new Date(b.time) - new Date(a.time)
      })
      
      setNotifications(notifs)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'new_appointment':
        return <Calendar size={16} className="text-primary" />
      case 'meeting_link_required':
        return <CheckCircle size={16} className="text-success" />
      case 'appointment_cancelled':
        return <XCircle size={16} className="text-danger" />
      case 'payment_pending':
        return <AlertTriangle size={16} className="text-warning" />
      case 'meeting_ready':
        return <CheckCircle size={16} className="text-success" />
      case 'declined':
        return <XCircle size={16} className="text-danger" />
      case 'vet_approval':
        return <User size={16} className="text-info" />
      case 'disease_outbreak':
        return <AlertTriangle size={16} className="text-danger" />
      case 'disease_outbreak_owner':
        return <AlertTriangle size={16} className="text-warning" />
      case 'disease_resolved_owner':
        return <CheckCircle size={16} className="text-success" />
      case 'disease_monitoring_owner':
        return <AlertTriangle size={16} className="text-info" />
      case 'follow_up_reminder':
        return <Stethoscope size={16} className="text-warning" />
      default:
        return <Clock size={16} className="text-muted" />
    }
  }

  const formatTime = (timeString) => {
    if (!timeString) return ''
    const date = new Date(timeString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const handleNotificationClick = (notification) => {
    if (role === 'owner') {
      if (notification.type === 'pending' || notification.type === 'declined') {
        navigate('/app/owner/dashboard')
      } else if (notification.type === 'payment_pending') {
        navigate('/app/owner/dashboard')
      } else if (notification.type === 'meeting_ready') {
        navigate('/app/owner/dashboard')
      } else if (notification.type === 'follow_up_reminder') {
        navigate('/app/owner/dashboard')
      } else if (notification.type === 'disease_outbreak_owner' || 
                 notification.type === 'disease_resolved_owner' ||
                 notification.type === 'disease_monitoring_owner') {
        navigate('/app/owner/dashboard')
      }
    } else if (role === 'vet') {
      if (notification.type === 'new_appointment') {
        navigate('/app/vet/pending')
      } else if (notification.type === 'meeting_link_required') {
        navigate('/app/vet/pending')
      } else if (notification.type === 'appointment_cancelled') {
        navigate('/app/vet/dashboard')
      }
    } else if (role === 'admin') {
      if (notification.type === 'vet_approval') {
        navigate('/app/admin/users')
      } else if (notification.type === 'disease_outbreak') {
        navigate('/app/admin/disease-alerts')
      }
    }
    setShowNotifications(false)
  }

  const getRoleName = () => {
    switch(role) {
      case 'vet': return 'Veterinarian'
      case 'admin': return 'Administrator'
      case 'owner': return 'Pet Owner'
      default: return 'User'
    }
  }

  const unreadCount = notifications.length

  return (
    <>
      <div 
        className="bg-white border-bottom shadow-sm" 
        style={{ 
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          left: isMobile ? 0 : 'auto',
          right: isMobile ? 0 : 'auto',
          width: isMobile ? '100%' : 'auto',
          zIndex: 999 
        }}
      >
        <div className="container-fluid" style={{ padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem' }}>
          <div className="d-flex justify-content-between align-items-center">
            <h4 
              className="mb-0 fw-bold" 
              style={{ 
                color: '#1e3a5f',
                fontSize: isMobile ? '1rem' : '1.5rem',
                paddingLeft: isMobile ? '50px' : '0',
                flex: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </h4>
            
            <div className="d-flex align-items-center gap-2">
              <button 
                className="btn btn-light position-relative"
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ 
                  padding: isMobile ? '0.375rem 0.5rem' : '0.375rem 0.75rem',
                  minWidth: isMobile ? '38px' : 'auto'
                }}
              >
                <Bell size={isMobile ? 18 : 20} />
                {unreadCount > 0 && (
                  <span 
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: '0.65rem' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              <div className="d-flex align-items-center">
                {user.profilePicture ? (
                  <img 
                    src={`${API_URL.replace('/api', '')}/${user.profilePicture}`}
                    alt={userName}
                    className="rounded-circle"
                    style={{ 
                      width: isMobile ? '32px' : '40px', 
                      height: isMobile ? '32px' : '40px', 
                      objectFit: 'cover' 
                    }}
                  />
                ) : (
                  <div 
                    className="rounded-circle bg-success d-flex align-items-center justify-content-center" 
                    style={{ 
                      width: isMobile ? '32px' : '40px', 
                      height: isMobile ? '32px' : '40px',
                      flexShrink: 0
                    }}
                  >
                    <User size={isMobile ? 16 : 20} className="text-white" />
                  </div>
                )}
                
                {!isMobile && (
                  <div className="ms-2">
                    <small className="d-block fw-semibold">{userName}</small>
                    <small className="text-muted">{getRoleName()}</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNotifications && (
        <>
          <div 
            className="position-fixed top-0 start-0 w-100 h-100" 
            style={{ zIndex: 1040 }}
            onClick={() => setShowNotifications(false)}
          />
          <div 
            className="position-fixed bg-white border rounded shadow-lg"
            style={{ 
              top: isMobile ? '65px' : '75px', 
              right: isMobile ? '10px' : '20px',
              left: isMobile ? '10px' : 'auto',
              width: isMobile ? 'auto' : '400px',
              maxWidth: isMobile ? 'calc(100vw - 20px)' : '400px',
              maxHeight: isMobile ? 'calc(100vh - 85px)' : '500px',
              zIndex: 1050,
              overflow: 'hidden'
            }}
          >
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
              <h6 className="mb-0 fw-bold" style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>
                Notifications
              </h6>
              <button 
                className="btn btn-sm btn-light"
                onClick={() => setShowNotifications(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div 
              style={{ 
                maxHeight: isMobile ? 'calc(100vh - 185px)' : '400px',
                overflowY: 'auto' 
              }}
            >
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <Bell size={isMobile ? 36 : 48} className="mb-3 opacity-25" />
                  <p className="mb-0" style={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>
                    No new notifications
                  </p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      className={`list-group-item list-group-item-action border-0 py-3 ${
                        (notif.type === 'follow_up_reminder' && notif.priority === 3) ||
                        (notif.type === 'disease_outbreak_owner' && notif.priority >= 4)
                          ? 'bg-warning bg-opacity-10' 
                          : notif.type === 'disease_outbreak'
                          ? 'bg-danger bg-opacity-10'
                          : notif.type === 'disease_resolved_owner'
                          ? 'bg-success bg-opacity-10'
                          : notif.type === 'disease_monitoring_owner'
                          ? 'bg-info bg-opacity-10'
                          : ''
                      }`}
                      onClick={() => handleNotificationClick(notif)}
                      style={{ padding: isMobile ? '0.75rem' : '1rem' }}
                    >
                      <div className="d-flex align-items-start">
                        <div className="me-2 me-md-3 mt-1">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-grow-1">
                          <p 
                            className="mb-1 small" 
                            style={{ 
                              fontSize: isMobile ? '0.8rem' : '0.875rem',
                              lineHeight: '1.4'
                            }}
                          >
                            {notif.message}
                          </p>
                          <small 
                            className="text-muted"
                            style={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                          >
                            {formatTime(notif.time)}
                          </small>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-2 border-top bg-light text-center">
                <button 
                  className="btn btn-sm btn-link text-decoration-none"
                  style={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
                  onClick={() => {
                    fetchNotifications()
                  }}
                >
                  Refresh Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}