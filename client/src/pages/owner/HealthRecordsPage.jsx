import React, { useState, useEffect } from 'react'
import { Eye, Download, CheckCircle, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import jsPDF from 'jspdf'

const API_URL = 'http://localhost:5000/api'

export default function HealthRecordsPage() {
  const navigate = useNavigate()
  const [healthRecords, setHealthRecords] = useState([])
  const [pets, setPets] = useState([])
  const [selectedPet, setSelectedPet] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')

  useEffect(() => {
    fetchHealthRecords()
  }, [])

  const fetchHealthRecords = async () => {
    try {
      setLoading(true)

      const userData = JSON.parse(localStorage.getItem('healpaws_user'))
      const ownerId = userData?._id || userData?.id

      if (!ownerId) {
        setModalMessage('User not logged in')
        setShowErrorModal(true)
        setLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/consultations/owner/${ownerId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Health records data:', data)

      const consultationsList = data.appointments || data.consultations || []

      if (data.success && Array.isArray(consultationsList)) {
        const completedRecords = consultationsList.filter(r => r.status === 'completed')
        
        const sortedRecords = completedRecords.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )
        
        // Fetch prescription data for each completed record
        const recordsWithPrescriptions = await Promise.all(
          sortedRecords.map(async (record) => {
            try {
              const prescResponse = await fetch(`${API_URL}/prescriptions/${record._id}`)
              if (prescResponse.ok) {
                const prescData = await prescResponse.json()
                if (prescData.success && prescData.prescription) {
                  return { ...record, prescriptionData: prescData.prescription }
                }
              }
            } catch (prescError) {
              console.error(`Error fetching prescription for ${record._id}:`, prescError)
            }
            return record
          })
        )
        
        setHealthRecords(recordsWithPrescriptions)
        
        const uniquePetsMap = new Map()
        sortedRecords.forEach(record => {
          if (record.petId && record.petId._id) {
            const petName = record.petId.name || record.petName || 'Unknown Pet'
            uniquePetsMap.set(record.petId._id, {
              id: record.petId._id,
              name: petName
            })
          }
        })
        
        setPets(Array.from(uniquePetsMap.values()))
      } else {
        setHealthRecords([])
        setPets([])
      }
    } catch (err) {
      console.error('Error fetching health records:', err)
      setModalMessage('Failed to load health records. Please try again.')
      setShowErrorModal(true)
      setHealthRecords([])
      setPets([])
    } finally {
      setLoading(false)
    }
  }

  const renderAIPrediction = (aiPrediction) => {
    if (!aiPrediction) return 'Not specified'
    
    if (typeof aiPrediction === 'object') {
      const parts = []
      if (aiPrediction.animalType) parts.push(`Animal: ${aiPrediction.animalType}`)
      if (aiPrediction.diagnosis) parts.push(`Diagnosis: ${aiPrediction.diagnosis}`)
      if (aiPrediction.confidence) parts.push(`Confidence: ${aiPrediction.confidence}`)
      return parts.join(', ') || 'AI analysis available'
    }
    
    return aiPrediction
  }

  const filteredRecords = healthRecords.filter(record => {
    const petName = record.petId?.name || record.petName || ''
    const matchesPet = selectedPet === 'all' || petName === selectedPet
    
    const diagnosis = renderAIPrediction(record.aiPrediction) || record.diagnosis || ''
    const vetName = record.vetId?.name || ''
    const matchesSearch =
      diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vetName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const recordDate = record.createdAt || record.date || ''
    const matchesDate = !dateFilter || recordDate.includes(dateFilter)
    
    return matchesPet && matchesSearch && matchesDate
  })

  const formatPrescription = (record) => {
    if (!record.prescriptionData) {
      return 'Not issued yet'
    }
    
    if (typeof record.prescriptionData === 'string') {
      return record.prescriptionData
    }
    
    if (typeof record.prescriptionData === 'object') {
      const { prescription, diagnosis } = record.prescriptionData
      
      // Return prescription text if available
      if (prescription && prescription.trim()) {
        return prescription
      }
      
      // Fallback to diagnosis if prescription text is empty
      if (diagnosis && diagnosis.trim()) {
        return `Diagnosis: ${diagnosis}`
      }
      
      return 'Prescription available'
    }
    
    return 'Not issued yet'
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

  const handleDownloadRecord = async (record) => {
    try {
      console.log('Starting PDF generation for consultation:', record._id)
      
      // Fetch prescription data
      let prescriptionData = null
      
      try {
        console.log('Fetching prescription for consultation:', record._id)
        const prescriptionResponse = await fetch(`${API_URL}/prescriptions/${record._id}`)
        
        console.log('Prescription response status:', prescriptionResponse.status)
        
        if (prescriptionResponse.ok) {
          const prescriptionResult = await prescriptionResponse.json()
          console.log('Prescription result:', prescriptionResult)
          
          if (prescriptionResult.success && prescriptionResult.prescription) {
            prescriptionData = prescriptionResult.prescription
            console.log('Prescription data fetched successfully:', prescriptionData)
          } else {
            console.log('No prescription in response')
          }
        } else {
          console.log('Prescription fetch failed with status:', prescriptionResponse.status)
        }
      } catch (prescError) {
        console.error('Error fetching prescription:', prescError)
      }

      const doc = new jsPDF()
      const green = [25, 135, 84]
      const warning = [255, 193, 7]
      const blue = [13, 110, 253]
      let y = 20

      // Header
      doc.setFillColor(...green)
      doc.rect(0, 0, 210, 25, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(255, 255, 255)
      doc.text('Veterinary Health Record', 14, 17)

      // Subheader
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80)
      y += 20
      doc.text('Electronic Medical Record', 14, y)
      y += 10

      // Patient Information Section
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(...green)
      doc.text('Patient Information', 14, y)
      y += 5
      doc.setDrawColor(...green)
      doc.line(14, y, 196, y)
      y += 10

      // Record details
      const petName = record.petId?.name || record.petName || 'Unknown'
      const visitDate = record.createdAt 
        ? new Date(record.createdAt).toLocaleDateString() 
        : 'N/A'
      const aiDiagnosis = renderAIPrediction(record.aiPrediction)
      const vetName = record.vetId?.name || 'Not assigned'
      const appointmentDate = record.appointmentDate 
        ? `${record.appointmentDate} at ${record.appointmentTime || ''}`
        : visitDate

      const info = [
        ['Pet Name', petName],
        ['Date of Visit', appointmentDate],
        ['AI Initial Assessment', aiDiagnosis],
        ['Veterinarian', vetName],
        ['Status', record.status || 'completed']
      ]

      doc.setFontSize(11)
      doc.setTextColor(33)
      const lineHeight = 7

      info.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold')
        doc.text(`${label}:`, 14, y)
        doc.setFont('helvetica', 'normal')
        const displayValue = String(value || '-')
        const splitText = doc.splitTextToSize(displayValue, 130)
        doc.text(splitText, 60, y)
        y += lineHeight * splitText.length
      })

      y += 5

      // Payment Status Section
      if (y > 200) {
        doc.addPage()
        y = 20
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(...blue)
      doc.text('Payment Information', 14, y)
      y += 5
      doc.setDrawColor(...blue)
      doc.line(14, y, 196, y)
      y += 10

      doc.setFontSize(11)
      doc.setTextColor(33)

      const paymentInfo = [
        ['Payment Status', record.isPaid ? 'PAID' : 'PENDING'],
        ['Payment Method', record.paymentMethod || 'Not specified'],
        ['Amount Paid', record.paymentAmount ? `INR ${record.paymentAmount}` : 'N/A'],
        ['Payment Date', record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : 'N/A']
      ]

      paymentInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold')
        doc.text(`${label}:`, 14, y)
        doc.setFont('helvetica', 'normal')
        
        // Highlight payment status
        if (label === 'Payment Status') {
          if (record.isPaid) {
            doc.setTextColor(25, 135, 84) // Green for paid
          } else {
            doc.setTextColor(220, 53, 69) // Red for pending
          }
        }
        
        doc.text(String(value), 60, y)
        doc.setTextColor(33) // Reset color
        y += lineHeight
      })

      y += 8

      // Professional Diagnosis & Prescription section
      if (prescriptionData) {
        console.log('Adding prescription data to PDF')
        
        // Check if we need a new page
        if (y > 200) {
          doc.addPage()
          y = 20
        }

        // Professional Diagnosis Section
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13)
        doc.setTextColor(...green)
        doc.text('Professional Diagnosis', 14, y)
        y += 5
        doc.line(14, y, 196, y)
        y += 10

        doc.setFontSize(11)
        doc.setTextColor(33)
        doc.setFont('helvetica', 'normal')
        
        const diagnosisText = prescriptionData.diagnosis || 'Not provided'
        const diagnosisSplit = doc.splitTextToSize(diagnosisText, 180)
        doc.text(diagnosisSplit, 14, y)
        y += lineHeight * diagnosisSplit.length + 8

        // Check if we need a new page before prescription
        if (y > 220) {
          doc.addPage()
          y = 20
        }

        // Prescription Section
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13)
        doc.setTextColor(...green)
        doc.text('Prescription', 14, y)
        y += 5
        doc.line(14, y, 196, y)
        y += 10

        doc.setFontSize(11)
        doc.setTextColor(33)
        doc.setFont('helvetica', 'normal')
        
        const prescriptionText = prescriptionData.prescription || 'No prescription provided'
        const prescriptionSplit = doc.splitTextToSize(prescriptionText, 180)
        doc.text(prescriptionSplit, 14, y)
        y += lineHeight * prescriptionSplit.length + 8

        // Instructions Section
        if (prescriptionData.instructions && prescriptionData.instructions.trim()) {
          if (y > 220) {
            doc.addPage()
            y = 20
          }

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(13)
          doc.setTextColor(...green)
          doc.text('Instructions & Care Notes', 14, y)
          y += 5
          doc.line(14, y, 196, y)
          y += 10

          doc.setFontSize(11)
          doc.setTextColor(33)
          doc.setFont('helvetica', 'normal')
          
          const instructionsText = prescriptionData.instructions
          const instructionsSplit = doc.splitTextToSize(instructionsText, 180)
          doc.text(instructionsSplit, 14, y)
          y += lineHeight * instructionsSplit.length + 8
        }

        // Follow-up Section
        if (prescriptionData.followUpRequired) {
          if (y > 200) {
            doc.addPage()
            y = 20
          }

          // Follow-up header with warning background
          doc.setFillColor(255, 243, 205)
          doc.rect(10, y - 5, 190, 10, 'F')
          
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(13)
          doc.setTextColor(184, 134, 11)
          doc.text('⚠ Follow-up Required', 14, y + 2)
          y += 10
          
          doc.setDrawColor(255, 193, 7)
          doc.line(14, y, 196, y)
          y += 10

          doc.setFontSize(11)
          doc.setTextColor(33)
          
          const followUpInfo = [
            ['Follow-up Date', formatFollowUpDate(prescriptionData.followUpDate)],
            ['Status', (prescriptionData.followUpStatus || 'pending').toUpperCase()]
          ]

          followUpInfo.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold')
            doc.text(`${label}:`, 14, y)
            doc.setFont('helvetica', 'normal')
            const displayValue = String(value || '-')
            const splitText = doc.splitTextToSize(displayValue, 120)
            doc.text(splitText, 65, y)
            y += lineHeight * splitText.length
          })

          y += 3

          // Follow-up reason
          if (prescriptionData.followUpReason && prescriptionData.followUpReason.trim()) {
            doc.setFont('helvetica', 'bold')
            doc.text('Reason for Follow-up:', 14, y)
            y += 7
            
            doc.setFont('helvetica', 'normal')
            const reasonText = prescriptionData.followUpReason
            const reasonSplit = doc.splitTextToSize(reasonText, 180)
            doc.text(reasonSplit, 14, y)
            y += lineHeight * reasonSplit.length + 5
          }

          // Follow-up reminder note
          doc.setFillColor(255, 250, 230)
          doc.roundedRect(10, y, 190, 20, 3, 3, 'F')
          
          doc.setFontSize(10)
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(80)
          y += 7
          doc.text('IMPORTANT REMINDER:', 14, y)
          y += 5
          doc.text('Please schedule a follow-up appointment with your veterinarian', 14, y)
          y += 5
          doc.text('before the specified date to ensure your pet\'s continued health.', 14, y)
          y += 10
        }
      } else {
        console.log('No prescription data available')
        
        // No prescription available message
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(11)
        doc.setTextColor(120)
        doc.text('No prescription has been issued for this consultation yet.', 14, y)
        y += 10
      }

      // Footer
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      
      y += 10
      doc.setDrawColor(220)
      doc.line(14, y, 196, y)
      y += 8
      doc.setFontSize(10)
      doc.setTextColor(120)
      doc.text('This is an official veterinary health record.', 14, y)
      y += 6
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, y)

      // Add follow-up indicator in footer if required
      if (prescriptionData?.followUpRequired) {
        y += 6
        doc.setTextColor(184, 134, 11)
        doc.setFont('helvetica', 'bold')
        doc.text('⚠ This record includes a follow-up requirement', 14, y)
      }

      // Generate filename
      const safePetName = petName.toLowerCase().replace(/\s+/g, '-')
      const dateStr = record.createdAt ? record.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)
      const fileName = `health-record-${safePetName}-${dateStr}.pdf`
      
      doc.save(fileName)
      
      console.log('PDF generated successfully')
      setModalMessage('Health record PDF downloaded successfully!')
      setShowSuccessModal(true)
    } catch (err) {
      console.error('Error generating PDF:', err)
      setModalMessage('Failed to generate PDF. Please try again.')
      setShowErrorModal(true)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Health Records" role="owner">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading health records...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Health Records" role="owner">
      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small text-muted">Filter by Pet</label>
              <select
                className="form-select"
                value={selectedPet}
                onChange={(e) => setSelectedPet(e.target.value)}
              >
                <option value="all">All Pets</option>
                {pets.map(pet => (
                  <option key={pet.id} value={pet.name}>
                    {pet.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small text-muted">Filter by Date</label>
              <input
                type="date"
                className="form-control"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small text-muted">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by vet or diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Records Display */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {healthRecords.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">No completed consultations yet.</p>
              <p className="small text-muted">Health records will appear here after consultations are completed.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="d-none d-lg-block">
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Pet</th>
                        <th>Diagnosis</th>
                        <th>Veterinarian</th>
                        <th>Prescription</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map(record => {
                        const diagnosisText = renderAIPrediction(record.aiPrediction) || record.diagnosis || 'Not specified'
                        return (
                          <tr key={record._id}>
                            <td>
                              {record.createdAt 
                                ? new Date(record.createdAt).toLocaleDateString()
                                : 'N/A'
                              }
                            </td>
                            <td>
                              <strong>{record.petId?.name || record.petName || 'Unknown'}</strong>
                            </td>
                            <td>
                              <small className="text-muted">
                                {diagnosisText.length > 60 
                                  ? `${diagnosisText.substring(0, 60)}...`
                                  : diagnosisText
                                }
                              </small>
                            </td>
                            <td>{record.vetId?.name || '-'}</td>
                            <td>
                              <small className="text-muted text-truncate d-inline-block" style={{maxWidth: '200px'}}>
                                {formatPrescription(record)}
                              </small>
                            </td>
                            <td className="text-center">
                              <div className="d-flex gap-2 justify-content-center">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => navigate(`/app/owner/consultation/${record._id}`)}
                                  title="View Details"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() => handleDownloadRecord(record)}
                                  title="Download PDF"
                                >
                                  <Download size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {filteredRecords.length === 0 && healthRecords.length > 0 && (
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-muted">
                            No records match your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="d-lg-none">
                {filteredRecords.map(record => {
                  const diagnosisText = renderAIPrediction(record.aiPrediction) || record.diagnosis || 'Not specified'
                  return (
                    <div key={record._id} className="card mb-3 border">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1 fw-bold">{record.petId?.name || record.petName || 'Unknown'}</h6>
                            <small className="text-muted">
                              {record.createdAt 
                                ? new Date(record.createdAt).toLocaleDateString()
                                : 'N/A'
                              }
                            </small>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => navigate(`/app/owner/consultation/${record._id}`)}
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleDownloadRecord(record)}
                              title="Download PDF"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <small className="text-muted d-block mb-1"><strong>Diagnosis:</strong></small>
                          <small className="text-muted">
                            {diagnosisText.length > 100 
                              ? `${diagnosisText.substring(0, 100)}...`
                              : diagnosisText
                            }
                          </small>
                        </div>
                        
                        <div className="mb-2">
                          <small className="text-muted"><strong>Veterinarian:</strong> {record.vetId?.name || '-'}</small>
                        </div>
                        
                        <div>
                          <small className="text-muted d-block mb-1"><strong>Prescription:</strong></small>
                          <small className="text-muted">{formatPrescription(record)}</small>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {filteredRecords.length === 0 && healthRecords.length > 0 && (
                  <div className="text-center py-4 text-muted">
                    No records match your filters.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

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
                  onClick={() => setShowSuccessModal(false)}
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
  )
}