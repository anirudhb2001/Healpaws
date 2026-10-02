import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Pill, FileText, Activity, Clock, User, PawPrint, CheckCircle, Stethoscope, ClipboardList, Bell, AlertCircle } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'

export default function CaseHistoryView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [consultation, setConsultation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCaseDetails()
  }, [id])

  const fetchCaseDetails = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`http://localhost:5000/api/consultations/${id}`)
      const data = await response.json()

      if (data.success) {
        setConsultation(data.consultation)
      } else {
        setError(data.message || 'Failed to fetch case details')
      }
    } catch (error) {
      console.error('Error fetching case:', error)
      setError('Failed to load case details')
    } finally {
      setLoading(false)
    }
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

  const getFollowUpStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning text-dark'
      case 'completed':
        return 'bg-success'
      case 'cancelled':
        return 'bg-danger'
      default:
        return 'bg-secondary'
    }
  }

  const getAIPredictionText = (aiPrediction) => {
    if (!aiPrediction) return null

    if (typeof aiPrediction === 'string') return aiPrediction

    if (typeof aiPrediction === 'object') {
      return `
Animal Type: ${aiPrediction.animalType || 'N/A'}
Diagnosis: ${aiPrediction.diagnosis || 'N/A'}
Confidence: ${aiPrediction.confidence ? `${Math.round(aiPrediction.confidence)}%` : 'N/A'}

Recommendations:
${Array.isArray(aiPrediction.recommendations)
          ? aiPrediction.recommendations.map(r => `• ${r}`).join('\n')
          : 'N/A'}
      `.trim()
    }

    return String(aiPrediction)
  }


  const formatDateTime = (consultation) => {
    if (consultation.appointmentDate && consultation.appointmentTime) {
      return `${consultation.appointmentDate} at ${consultation.appointmentTime}`
    }
    return new Date(consultation.createdAt).toLocaleString()
  }

  const formatFollowUpDate = (date) => {
    if (!date) return 'N/A'
    const followUpDate = new Date(date)
    return followUpDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <AppLayout title="Case Details" role="vet">
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading case details...</p>
        </div>
      </AppLayout>
    )
  }

  if (error || !consultation) {
    return (
      <AppLayout title="Case Details" role="vet">
        <div className="alert alert-danger">
          <h5 className="alert-heading">Error</h5>
          <p>{error || 'Case not found'}</p>
          <button className="btn btn-outline-danger mt-2" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} className="me-1" /> Go Back
          </button>
        </div>
      </AppLayout>
    )
  }

  const prescription = consultation.prescriptionData
  const aiPredictionText = getAIPredictionText(consultation.aiPrediction)

  return (
    <AppLayout title="Case Details" role="vet">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold mb-1">
            {consultation.petId?.name || consultation.petName || 'Pet'} — Case Details
          </h5>
          <small className="text-muted">
            <Clock size={14} className="me-1" />
            {formatDateTime(consultation)}
          </small>
        </div>
        <div className="d-flex gap-2">
          <span className={`badge ${getStatusBadgeClass(consultation.status)}`}>
            {consultation.status.toUpperCase()}
          </span>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} className="me-1" /> Back
          </button>
        </div>
      </div>

      {/* Completed Consultation Banner */}
      {consultation.status === 'completed' && (
        <div className="alert alert-success mb-4">
          <div className="d-flex align-items-center">
            <CheckCircle size={24} className="me-3" />
            <div>
              <h6 className="mb-1">Consultation Completed</h6>
              <small>
                This consultation was completed on {new Date(consultation.consultationEndTime || consultation.updatedAt).toLocaleString()}
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Pet and Owner Information */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-bold text-success mb-3">
                <PawPrint size={18} className="me-2" />
                Pet Information
              </h6>
              {consultation.petId ? (
                <div className="d-flex align-items-start">
                  {consultation.petId.petPhoto && (
                    <img
                      src={`http://localhost:5000/${consultation.petId.petPhoto}`}
                      alt={consultation.petId.name}
                      className="rounded-circle me-3"
                      style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                    />
                  )}
                  <div>
                    <h6 className="mb-1">{consultation.petId.name}</h6>
                    <p className="mb-1 text-muted small">
                      <strong>Species:</strong> {consultation.petId.species || 'N/A'}
                    </p>
                    <p className="mb-1 text-muted small">
                      <strong>Breed:</strong> {consultation.petId.breed || 'N/A'}
                    </p>
                    <p className="mb-1 text-muted small">
                      <strong>Age:</strong> {consultation.petId.age ? `${consultation.petId.age} years` : 'N/A'}
                    </p>
                    <p className="mb-0 text-muted small">
                      <strong>Gender:</strong> {consultation.petId.gender || 'N/A'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted">Pet information not available</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-bold text-success mb-3">
                <User size={18} className="me-2" />
                Owner Information
              </h6>
              {consultation.ownerId ? (
                <div>
                  <h6 className="mb-1">{consultation.ownerId.name}</h6>
                  <p className="mb-1 text-muted small">
                    <strong>Email:</strong> {consultation.ownerId.email || 'N/A'}
                  </p>
                  <p className="mb-0 text-muted small">
                    <strong>Contact:</strong> {consultation.ownerId.mobileno || 'N/A'}
                  </p>
                </div>
              ) : (
                <p className="text-muted">Owner information not available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Case Details */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          {/* Symptoms */}
          <div className="mb-4">
            <h6 className="fw-bold text-success">
              <FileText className="me-2" size={16} />
              Reported Symptoms
            </h6>
            <p className="mb-0">{consultation.symptoms || 'No symptoms reported'}</p>
          </div>

          {/* AI Prediction */}
          {aiPredictionText && (
            <div className="mb-4 p-3 bg-light rounded">
              <h6 className="fw-bold text-primary mb-2">
                <Activity size={16} className="me-2" />
                AI Preliminary Analysis
              </h6>
              <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                {aiPredictionText}
              </p>
              <small className="text-muted d-block mt-2">
                <em>
                  AI results are assistive only. Please rely on your professional clinical judgment.
                </em>
              </small>
            </div>
          )}

          {/* Veterinarian Diagnosis */}
          {prescription && prescription.diagnosis && (
            <div className="mb-4 p-3 border border-success rounded bg-light">
              <h6 className="fw-bold text-success mb-2">
                <Stethoscope className="me-2" size={16} />
                Diagnosis
              </h6>
              <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{prescription.diagnosis}</p>
            </div>
          )}

          {/* Prescription Details */}
          {prescription && prescription.prescription && (
            <div className="mb-4 p-3 border border-primary rounded">
              <h6 className="fw-bold text-primary mb-2">
                <Pill className="me-2" size={16} />
                Prescribed Treatment
              </h6>
              <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{prescription.prescription}</p>
            </div>
          )}

          {/* Instructions */}
          {prescription && prescription.instructions && (
            <div className="mb-4 p-3 border border-info rounded bg-light">
              <h6 className="fw-bold text-info mb-2">
                <ClipboardList className="me-2" size={16} />
                Care Instructions
              </h6>
              <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{prescription.instructions}</p>
            </div>
          )}

          {/* Follow-up Details */}
          {prescription && prescription.followUpRequired && (
            <div className="mb-4">
              <div className="card border-warning shadow-sm">
                <div className="card-header bg-warning bg-opacity-10 border-warning">
                  <h6 className="fw-bold text-warning mb-0">
                    <Bell className="me-2" size={18} />
                    Follow-up Required
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="d-flex align-items-center mb-2">
                        <Calendar size={16} className="me-2 text-warning" />
                        <strong>Follow-up Date:</strong>
                      </div>
                      <p className="ms-4 mb-0 text-muted">
                        {formatFollowUpDate(prescription.followUpDate)}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex align-items-center mb-2">
                        <AlertCircle size={16} className="me-2 text-warning" />
                        <strong>Status:</strong>
                      </div>
                      <p className="ms-4 mb-0">
                        <span className={`badge ${getFollowUpStatusBadge(prescription.followUpStatus)}`}>
                          {prescription.followUpStatus?.toUpperCase() || 'PENDING'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {prescription.followUpReason && (
                    <div className="mt-3">
                      <div className="d-flex align-items-start mb-2">
                        <FileText size={16} className="me-2 text-warning mt-1" />
                        <strong>Reason for Follow-up:</strong>
                      </div>
                      <p className="ms-4 mb-0 text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                        {prescription.followUpReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* No prescription message */}
          {consultation.status === 'completed' && !prescription && (
            <div className="alert alert-info">
              <p className="mb-0">
                <strong>Note:</strong> Prescription has not been added yet for this consultation.
              </p>
            </div>
          )}

          {/* Media Files */}
          {consultation.mediaFiles && consultation.mediaFiles.length > 0 && (
            <div className="mb-4">
              <h6 className="fw-bold text-success mb-3">
                <FileText className="me-2" size={16} />
                Uploaded Media
              </h6>
              <div className="row g-3">
                {consultation.mediaFiles.map((file, index) => (
                  <div key={index} className="col-md-3">
                    <img
                      src={`http://localhost:5000/${file}`}
                      alt={`Media ${index + 1}`}
                      className="img-fluid rounded shadow-sm"
                      style={{ maxHeight: '200px', objectFit: 'cover', width: '100%' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="p-3 bg-light rounded">
                <strong>Payment Status:</strong>
                <span className={`ms-2 badge ${consultation.isPaid ? 'bg-success' : 'bg-warning'}`}>
                  {consultation.isPaid ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
            {consultation.isPaid && consultation.paymentAmount && (
              <div className="col-md-6">
                <div className="p-3 bg-light rounded">
                  <strong>Amount Paid:</strong> ₹{consultation.paymentAmount}
                </div>
              </div>
            )}
          </div>

          {/* Appointment Schedule */}
          {consultation.appointmentDate && consultation.appointmentTime && (
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="p-3 bg-light rounded">
                  <Calendar size={16} className="me-2" />
                  <strong>Appointment Date:</strong> {consultation.appointmentDate}
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 bg-light rounded">
                  <Clock size={16} className="me-2" />
                  <strong>Appointment Time:</strong> {consultation.appointmentTime}
                </div>
              </div>
            </div>
          )}

          {/* Consultation Duration */}
          {consultation.status === 'completed' && consultation.consultationStartTime && consultation.consultationEndTime && (
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="p-3 bg-light rounded">
                  <Clock size={16} className="me-2" />
                  <strong>Started:</strong> {new Date(consultation.consultationStartTime).toLocaleString()}
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 bg-light rounded">
                  <Clock size={16} className="me-2" />
                  <strong>Ended:</strong> {new Date(consultation.consultationEndTime).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Prescription Timestamp */}
          {prescription && (
            <div className="row g-3 mb-4">
              <div className="col-md-12">
                <div className="p-3 bg-light rounded">
                  <small className="text-muted">
                    <strong>Prescription Issued:</strong> {new Date(prescription.createdAt).toLocaleString()}
                    {prescription.updatedAt && prescription.updatedAt !== prescription.createdAt && (
                      <span> (Updated: {new Date(prescription.updatedAt).toLocaleString()})</span>
                    )}
                  </small>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {consultation.notes && (
            <div className="mt-4 p-3 border rounded">
              <h6 className="fw-bold text-success mb-2">Additional Notes</h6>
              <p className="mb-0">{consultation.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="row g-3 mt-4">
            <div className="col-md-6">
              <small className="text-muted">
                <strong>Created:</strong> {new Date(consultation.createdAt).toLocaleString()}
              </small>
            </div>
            <div className="col-md-6">
              <small className="text-muted">
                <strong>Last Updated:</strong> {new Date(consultation.updatedAt).toLocaleString()}
              </small>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}