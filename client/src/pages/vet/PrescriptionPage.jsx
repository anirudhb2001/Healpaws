import React, { useEffect, useState } from 'react';
import { FileText, Save, ArrowLeft, Calendar, User, Stethoscope, AlertCircle, Clock } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import { useNavigate } from 'react-router-dom';

export default function PrescriptionPage() {
  // Get consultationId from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const consultationId = urlParams.get('consultationId');
  
  const [consultation, setConsultation] = useState(null);
  const [existingPrescription, setExistingPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    diagnosis: '',
    prescription: '',
    instructions: '',
    followUpRequired: false,
    followUpDate: '',
    followUpReason: ''
  });

  // Modal states
  const [modal, setModal] = useState({
    show: false,
    type: '', // 'success' or 'error'
    title: '',
    message: '',
    onClose: null
  });

  const navigate = useNavigate();

  const API_URL = 'http://localhost:5000/api';
  const vetId = localStorage.getItem('vetId');

  useEffect(() => {
    if (consultationId) {
      fetchConsultationAndPrescription();
    }
  }, [consultationId]);

  const showModal = (type, title, message, onClose = null) => {
    setModal({
      show: true,
      type,
      title,
      message,
      onClose
    });
  };

  const closeModal = () => {
    if (modal.onClose) {
      modal.onClose();
    }
    setModal({
      show: false,
      type: '',
      title: '',
      message: '',
      onClose: null
    });
  };

  const fetchConsultationAndPrescription = async () => {
    try {
      // Fetch consultation details
      const consultationResponse = await fetch(`${API_URL}/consultations/${consultationId}`);
      const consultationData = await consultationResponse.json();
      
      if (consultationData.success) {
        setConsultation(consultationData.consultation);
        
        // Check if consultation is completed
        if (consultationData.consultation.status !== 'completed') {
          showModal(
            'error',
            'Invalid Consultation',
            'Prescription can only be written for completed consultations',
            () => navigate('/app/vet/dashboard')
          );
          return;
        }

        // Check if prescription already exists
        try {
          const prescriptionResponse = await fetch(`${API_URL}/prescriptions/${consultationId}`);
          const prescriptionData = await prescriptionResponse.json();
          
          if (prescriptionData.success && prescriptionData.prescription) {
            setExistingPrescription(prescriptionData.prescription);
            // Pre-populate form with existing prescription data
            setFormData({
              diagnosis: prescriptionData.prescription.diagnosis || '',
              prescription: prescriptionData.prescription.prescription || '',
              instructions: prescriptionData.prescription.instructions || '',
              followUpRequired: prescriptionData.prescription.followUpRequired || false,
              followUpDate: prescriptionData.prescription.followUpDate 
                ? new Date(prescriptionData.prescription.followUpDate).toISOString().split('T')[0] 
                : '',
              followUpReason: prescriptionData.prescription.followUpReason || ''
            });
          }
        } catch (prescriptionError) {
          // Prescription doesn't exist yet, which is fine
          console.log('No existing prescription found');
        }
      } else {
        showModal(
          'error',
          'Error',
          'Failed to load consultation details',
          () => navigate('/app/vet/dashboard')
        );
      }
    } catch (error) {
      console.error('Error fetching consultation:', error);
      showModal(
        'error',
        'Error',
        'Error loading consultation',
        () => navigate('/app/vet/dashboard')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.diagnosis.trim()) {
      showModal('error', 'Validation Error', 'Please enter a diagnosis');
      return;
    }
    
    if (!formData.prescription.trim()) {
      showModal('error', 'Validation Error', 'Please enter prescription details');
      return;
    }

    // Validate follow-up fields if required
    if (formData.followUpRequired) {
      if (!formData.followUpDate) {
        showModal('error', 'Validation Error', 'Please select a follow-up date');
        return;
      }
      if (!formData.followUpReason.trim()) {
        showModal('error', 'Validation Error', 'Please enter a reason for follow-up');
        return;
      }

      // Check if follow-up date is in the future
      const selectedDate = new Date(formData.followUpDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        showModal('error', 'Validation Error', 'Follow-up date must be today or in the future');
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/prescriptions/${consultationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          vetId // Include vetId for verification
        })
      });

      const data = await response.json();

      if (data.success) {
        showModal(
          'success',
          'Success',
          existingPrescription 
            ? 'Prescription updated successfully!' 
            : 'Prescription saved successfully!',
          () => navigate('/app/vet/dashboard')
        );
      } else {
        showModal('error', 'Error', data.message || 'Failed to save prescription');
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      showModal('error', 'Error', 'Error saving prescription. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Write Prescription" role="vet">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!consultation) {
    return (
      <AppLayout title="Write Prescription" role="vet">
        <div className="alert alert-danger">
          <AlertCircle className="me-2" size={20} />
          Consultation not found
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Write Prescription" role="vet">
      {/* Bootstrap Modal */}
      {modal.show && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className={`modal-header ${modal.type === 'success' ? 'bg-success' : 'bg-danger'} text-white`}>
                  <h5 className="modal-title">{modal.title}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                </div>
                <div className="modal-body">
                  <p className="mb-0">{modal.message}</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className={`btn ${modal.type === 'success' ? 'btn-success' : 'btn-danger'}`} onClick={closeModal}>
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}

      {/* Header Section */}
      <div className="mb-4">
        <button 
          className="btn btn-outline-secondary mb-3"
          onClick={() => navigate('/app/vet/dashboard')}
        >
          <ArrowLeft size={18} className="me-2" />
          Back to Dashboard
        </button>
        
        <div className="d-flex align-items-center gap-3">
          <div className=" bg-success text-white rounded-circle d-flex align-items-center justify-content-center" 
               style={{ width: '50px', height: '50px' }}>
            <FileText size={24} />
          </div>
          <div>
            <h4 className="mb-0">
              {existingPrescription ? 'Edit Prescription' : 'Write Prescription'}
            </h4>
            <p className="text-muted mb-0">
              {existingPrescription ? 'Update' : 'Complete'} medical prescription for {consultation.petId?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Existing Prescription Warning */}
      {existingPrescription && (
        <div className="alert alert-warning d-flex align-items-center mb-4">
          <AlertCircle className="me-2" size={20} />
          <div>
            <strong>Note:</strong> A prescription already exists for this consultation. 
            Any changes you make will update the existing prescription.
          </div>
        </div>
      )}

      {/* Consultation Info Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Consultation Details</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="d-flex align-items-start gap-2">
                <User size={18} className="text-success mt-1" />
                <div>
                  <small className="text-muted d-block">Pet Owner</small>
                  <strong>{consultation.ownerId?.name || 'N/A'}</strong>
                  <p className="mb-0 small text-muted">{consultation.ownerId?.email}</p>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="d-flex align-items-start gap-2">
                <Stethoscope size={18} className="text-success mt-1" />
                <div>
                  <small className="text-muted d-block">Pet Details</small>
                  <strong>{consultation.petId?.name}</strong>
                  <p className="mb-0 small text-muted">
                    {consultation.petId?.species} • {consultation.petId?.breed} • {consultation.petId?.age} years
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex align-items-start gap-2">
                <Calendar size={18} className="text-success mt-1" />
                <div>
                  <small className="text-muted d-block">Consultation Date</small>
                  <strong>{new Date(consultation.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</strong>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex align-items-start gap-2">
                <FileText size={18} className="text-success mt-1" />
                <div>
                  <small className="text-muted d-block">Reported Symptoms</small>
                  <p className="mb-0">{consultation.symptoms || 'No symptoms recorded'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Form */}
      <form onSubmit={handleSubmit}>
        <div className="card shadow-sm">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">Medical Prescription Form</h5>
          </div>
          <div className="card-body">
            {/* Diagnosis */}
            <div className="mb-4">
              <label className="form-label fw-bold">
                Diagnosis <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                name="diagnosis"
                rows="4"
                placeholder="Enter detailed diagnosis based on examination and symptoms..."
                value={formData.diagnosis}
                onChange={handleInputChange}
                required
              />
              <small className="text-muted">Provide a clear and comprehensive diagnosis</small>
            </div>

            {/* Prescription */}
            <div className="mb-4">
              <label className="form-label fw-bold">
                Prescription / Treatment Plan <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                name="prescription"
                rows="6"
                placeholder="Enter medications, dosages, and treatment plan...
Example:
- Amoxicillin 250mg: 1 tablet twice daily for 7 days
- Anti-inflammatory cream: Apply to affected area twice daily"
                value={formData.prescription}
                onChange={handleInputChange}
                required
              />
              <small className="text-muted">Include medication names, dosages, frequency, and duration</small>
            </div>

            {/* Instructions */}
            <div className="mb-4">
              <label className="form-label fw-bold">
                Additional Instructions / Precautions
              </label>
              <textarea
                className="form-control"
                name="instructions"
                rows="4"
                placeholder="Enter any special care instructions, dietary recommendations, activity restrictions..."
                value={formData.instructions}
                onChange={handleInputChange}
              />
              <small className="text-muted">Optional: Add any special care instructions or warnings</small>
            </div>

            {/* Follow-up Section */}
            <div className="border-top pt-4 mt-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Clock size={20} className="text-success" />
                <h6 className="mb-0">Follow-up Schedule</h6>
              </div>

              {/* Follow-up Required Checkbox */}
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="followUpRequired"
                  name="followUpRequired"
                  checked={formData.followUpRequired}
                  onChange={handleInputChange}
                />
                <label className="form-check-label fw-bold" htmlFor="followUpRequired">
                  Follow-up visit required
                </label>
              </div>

              {/* Follow-up Details (shown only if checkbox is checked) */}
              {formData.followUpRequired && (
                <div className="ms-4 p-3 bg-light rounded">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        Follow-up Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        name="followUpDate"
                        value={formData.followUpDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        required={formData.followUpRequired}
                      />
                      <small className="text-muted">Select when the pet should return</small>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold">
                        Reason for Follow-up <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        name="followUpReason"
                        rows="3"
                        placeholder="Enter reason for follow-up visit (e.g., Wound check, Progress evaluation, Test results review)"
                        value={formData.followUpReason}
                        onChange={handleInputChange}
                        required={formData.followUpRequired}
                      />
                      <small className="text-muted">Specify what needs to be checked during follow-up</small>
                    </div>
                  </div>

                  <div className="alert alert-info mb-0 mt-3">
                    <small>
                      <strong>Note:</strong> The pet owner will receive a notification reminder about this follow-up visit.
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="card-footer bg-light">
            <div className="d-flex justify-content-end gap-2">
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={() => navigate('/app/vet/dashboard')}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-success"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} className="me-2" />
                    {existingPrescription ? 'Update Prescription' : 'Save Prescription'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Info Alert */}
      <div className="alert alert-info mt-4">
        <strong>Note:</strong> This prescription will be permanently saved to the pet's medical record and can be viewed by the pet owner.
        {formData.followUpRequired && ' The owner will also receive a notification reminder for the scheduled follow-up.'}
      </div>
    </AppLayout>
  );
}