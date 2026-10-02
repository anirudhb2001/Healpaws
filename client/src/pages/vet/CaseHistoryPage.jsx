import React, { useEffect, useState } from 'react'
import { Eye, Download, Search } from 'lucide-react'
import jsPDF from 'jspdf'
import AppLayout from '../layouts/AppLayout'
import { useNavigate } from 'react-router-dom'

export default function CaseHistoryPage() {

  const [data, setData] = useState([])
  const [filtered, setFiltered] = useState([])

  const [search, setSearch] = useState("")
  const [date, setDate] = useState("")
  const [status, setStatus] = useState("All")

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("healpaws_user"))
  const vetId = user?._id

  const API_URL = "http://localhost:5000/api"

  // Fetch history on load
  useEffect(() => {
    if (!vetId) return
    fetch(`${API_URL}/consultations/history/vet/${vetId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setData(data.history)
          setFiltered(data.history)
        }
      })
  }, [vetId])

  // ================== FILTER LOGIC ===================
  const handleFilter = () => {
    let result = data

    if (search)
      result = result.filter(x =>
        x.petId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        x.ownerId?.name?.toLowerCase().includes(search.toLowerCase())
      )

    if (date)
      result = result.filter(x => new Date(x.createdAt).toISOString().split("T")[0] === date)

    if (status !== "All")
      result = result.filter(x => x.status.toLowerCase() === status.toLowerCase())

    setFiltered(result)
  }

  // Optional: live filtering as user types (remove if only button-triggered filtering is desired)
  useEffect(() => {
    handleFilter()
    // eslint-disable-next-line
  }, [search, date, status, data])

  // Helper function to format AI prediction for PDF
  const formatAIPredictionForPDF = (aiPrediction) => {
    if (!aiPrediction) return 'No AI analysis available'
    
    if (typeof aiPrediction === 'string') {
      return aiPrediction
    }
    
    if (typeof aiPrediction === 'object') {
      let text = ''
      
      if (aiPrediction.animal_type || aiPrediction.animalType) {
        text += `Animal Type: ${aiPrediction.animal_type || aiPrediction.animalType}\n`
      }
      
      if (aiPrediction.diagnosis) {
        text += `Predicted Diagnosis: ${aiPrediction.diagnosis}\n`
      }
      
      if (aiPrediction.confidence) {
        text += `Confidence: ${aiPrediction.confidence}\n`
      }
      
      if (aiPrediction.recommendations) {
        if (Array.isArray(aiPrediction.recommendations)) {
          text += `Recommendations:\n${aiPrediction.recommendations.map(r => `  • ${r}`).join('\n')}`
        } else {
          text += `Recommendations: ${aiPrediction.recommendations}`
        }
      }
      
      return text || 'No detailed AI analysis available'
    }
    
    return 'No AI analysis available'
  }

  // ================== ENHANCED PDF Generate =======================
  const generatePDF = (rec) => {
    const doc = new jsPDF()
    doc.setFont("helvetica")

    // Header
    doc.setFontSize(18)
    doc.setTextColor(40, 120, 40)
    doc.text(`Pet Medical Case Report`, 105, 15, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' })
    
    doc.setDrawColor(85, 219, 121)
    doc.setLineWidth(0.5)
    doc.line(20, 25, 190, 25)

    // Pet Information Section
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(`Pet Information`, 20, 35)
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 37, 190, 37)

    doc.setFontSize(11)
    let yPos = 45
    doc.text(`Pet Name: ${rec.petId?.name || 'N/A'}`, 20, yPos)
    yPos += 7
    doc.text(`Species: ${rec.petId?.species ? rec.petId.species.charAt(0).toUpperCase() + rec.petId.species.slice(1) : 'N/A'}`, 20, yPos)
    yPos += 7
    doc.text(`Breed: ${rec.petId?.breed || 'N/A'}`, 20, yPos)
    yPos += 7
    doc.text(`Age: ${rec.petId?.age ? `${rec.petId.age} years` : 'N/A'}`, 20, yPos)
    yPos += 7
    doc.text(`Gender: ${rec.petId?.gender ? rec.petId.gender.charAt(0).toUpperCase() + rec.petId.gender.slice(1) : 'N/A'}`, 20, yPos)
    yPos += 7
    doc.text(`Weight: ${rec.petId?.weight ? `${rec.petId.weight} kg` : 'N/A'}`, 20, yPos)

    // Owner Information Section
    yPos += 12
    doc.setFontSize(14)
    doc.text(`Owner Information`, 20, yPos)
    doc.line(20, yPos + 2, 190, yPos + 2)

    yPos += 10
    doc.setFontSize(11)
    doc.text(`Owner Name: ${rec.ownerId?.name || 'N/A'}`, 20, yPos)
    yPos += 7
    doc.text(`Email: ${rec.ownerId?.email || 'N/A'}`, 20, yPos)
    yPos += 7
    doc.text(`Contact: ${rec.ownerId?.mobileno || 'N/A'}`, 20, yPos)

    // Consultation Details Section
    yPos += 12
    doc.setFontSize(14)
    doc.text(`Consultation Details`, 20, yPos)
    doc.line(20, yPos + 2, 190, yPos + 2)

    yPos += 10
    doc.setFontSize(11)
    doc.text(`Consultation Date: ${new Date(rec.createdAt).toLocaleDateString()}`, 20, yPos)
    yPos += 7
    doc.text(`Consultation Time: ${new Date(rec.createdAt).toLocaleTimeString()}`, 20, yPos)
    yPos += 7
    doc.text(`Status: ${rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}`, 20, yPos)
    yPos += 7
    doc.text(`Appointment Date: ${rec.appointmentDate ? new Date(rec.appointmentDate).toLocaleDateString() : 'N/A'}`, 20, yPos)
    yPos += 7
    doc.text(`Appointment Time: ${rec.appointmentTime || 'N/A'}`, 20, yPos)

    // Symptoms Section
    yPos += 12
    doc.setFontSize(14)
    doc.text(`Reported Symptoms`, 20, yPos)
    doc.line(20, yPos + 2, 190, yPos + 2)

    yPos += 10
    doc.setFontSize(11)
    const symptomsText = rec.symptoms || 'No symptoms recorded'
    const symptomLines = doc.splitTextToSize(symptomsText, 170)
    doc.text(symptomLines, 20, yPos)
    yPos += (symptomLines.length * 7)

    // AI Prediction Section (if available) - FIXED
    if (rec.aiPrediction) {
      yPos += 7
      doc.setFontSize(14)
      doc.text(`AI Analysis`, 20, yPos)
      doc.line(20, yPos + 2, 190, yPos + 2)

      yPos += 10
      doc.setFontSize(11)
      const aiText = formatAIPredictionForPDF(rec.aiPrediction)
      const aiLines = doc.splitTextToSize(aiText, 170)
      doc.text(aiLines, 20, yPos)
      yPos += (aiLines.length * 7)
    }

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    // Diagnosis Section
    yPos += 7
    doc.setFontSize(14)
    doc.setTextColor(220, 53, 69)
    doc.text(`Diagnosis`, 20, yPos)
    doc.setDrawColor(220, 53, 69)
    doc.line(20, yPos + 2, 190, yPos + 2)

    yPos += 10
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    const diagnosisText = rec.prescriptionData?.diagnosis || 'No diagnosis recorded'
    const diagnosisLines = doc.splitTextToSize(diagnosisText, 170)
    doc.text(diagnosisLines, 20, yPos)
    yPos += (diagnosisLines.length * 7)

    // Treatment/Prescription Section
    yPos += 7
    doc.setFontSize(14)
    doc.setTextColor(13, 110, 253)
    doc.text(`Treatment & Prescription`, 20, yPos)
    doc.setDrawColor(13, 110, 253)
    doc.line(20, yPos + 2, 190, yPos + 2)

    yPos += 10
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    const prescriptionText = rec.prescriptionData?.prescription || 'No treatment recorded'
    const prescriptionLines = doc.splitTextToSize(prescriptionText, 170)
    doc.text(prescriptionLines, 20, yPos)
    yPos += (prescriptionLines.length * 7)

    // Instructions Section (if available)
    if (rec.prescriptionData?.instructions) {
      yPos += 7
      doc.setFontSize(14)
      doc.text(`Instructions`, 20, yPos)
      doc.setDrawColor(200, 200, 200)
      doc.line(20, yPos + 2, 190, yPos + 2)

      yPos += 10
      doc.setFontSize(11)
      const instructionsLines = doc.splitTextToSize(rec.prescriptionData.instructions, 170)
      doc.text(instructionsLines, 20, yPos)
      yPos += (instructionsLines.length * 7)
    }

    // Follow-up Section (if required)
    if (rec.prescriptionData?.followUpRequired) {
      yPos += 7
      doc.setFontSize(14)
      doc.setTextColor(255, 193, 7)
      doc.text(`Follow-up Required`, 20, yPos)
      doc.setDrawColor(255, 193, 7)
      doc.line(20, yPos + 2, 190, yPos + 2)

      yPos += 10
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      doc.text(`Follow-up Date: ${rec.prescriptionData.followUpDate ? new Date(rec.prescriptionData.followUpDate).toLocaleDateString() : 'N/A'}`, 20, yPos)
      yPos += 7
      if (rec.prescriptionData.followUpReason) {
        const followUpLines = doc.splitTextToSize(`Reason: ${rec.prescriptionData.followUpReason}`, 170)
        doc.text(followUpLines, 20, yPos)
        yPos += (followUpLines.length * 7)
      }
    }

    // Payment Information (if available)
    if (rec.isPaid) {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      yPos += 7
      doc.setFontSize(14)
      doc.setTextColor(40, 167, 69)
      doc.text(`Payment Information`, 20, yPos)
      doc.setDrawColor(40, 167, 69)
      doc.line(20, yPos + 2, 190, yPos + 2)

      yPos += 10
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      doc.text(`Payment Status: Paid`, 20, yPos)
      yPos += 7
      doc.text(`Amount: ${rec.paymentAmount ? `INR ${rec.paymentAmount}` : 'N/A'}`, 20, yPos)
      yPos += 7
      doc.text(`Payment Method: ${rec.paymentMethod || 'N/A'}`, 20, yPos)
      yPos += 7
      doc.text(`Payment Date: ${rec.paymentDate ? new Date(rec.paymentDate).toLocaleDateString() : 'N/A'}`, 20, yPos)
    }

    // Footer
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' })
      doc.text(`HealPaws Veterinary Services - Confidential Medical Record`, 105, 290, { align: 'center' })
    }

    doc.save(`${rec.petId?.name || 'Pet'}_Medical_Report_${new Date(rec.createdAt).toLocaleDateString().replace(/\//g, '-')}.pdf`)
  }

  return (
    <>
      <AppLayout title="Case History" role="vet">

        {/* FILTER CARD */}
        <div className="card shadow-sm mb-4">
          <div className="card-body row g-3">
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Search by pet or owner"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option>All</option>
                <option>Completed</option>
                <option>In-progress</option>
                <option>Pending</option>
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-success w-100 d-flex justify-content-center align-items-center"
                onClick={handleFilter}
              >
                <Search size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="card shadow-sm">
          <div className="card-body table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Pet</th>
                  <th>Owner</th>
                  <th>Diagnosis</th>
                  <th>Treatment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(rec => (
                  <tr key={rec._id}>
                    <td>{new Date(rec.createdAt).toLocaleDateString()}</td>
                    <td>{rec.petId?.name}</td>
                    <td>{rec.ownerId?.name}</td>
                    <td>{rec.prescriptionData?.diagnosis || "—"}</td>
                    <td>{rec.prescriptionData?.prescription || "—"}</td>
                    <td>
                      <span className={`badge ${rec.status === "completed" ? "bg-success" : rec.status === "pending" ? "bg-warning" : "bg-info"}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => navigate(`/app/vet/case-history/${rec._id}`)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => generatePDF(rec)}
                      >
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </AppLayout>
    </>
  )
}