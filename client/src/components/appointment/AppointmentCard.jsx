import React from "react";
import AppointmentHeader from "./AppointmentHeader";
import VetInfo from "./VetInfo";
import DateTimeInfo from "./DateTimeInfo";
import AIPrediction from "./AIPrediction";
import AppointmentActions from "./AppointmentActions";

export default function AppointmentCard({ 
  appointment, 
  onSchedule,
  onPayment,
  onJoinConsultation,
  onViewRecords,
  onCancel
}) {
  const petName =
    appointment.petId?.name ||
    appointment.pet?.name ||
    appointment.petName ||
    "Unknown Pet";

  const vetName =
    appointment.vetId?.name ||
    appointment.vet?.name ||
    appointment.vetName ||
    null;

  const getStatusBadge = () => {
    switch (appointment.status) {
      case "pending": return { text: "Pending", color: "bg-secondary" };
      case "scheduled": return { text: "Waiting for Vet Approval", color: "bg-warning" };
      case "confirmed": 
        if (appointment.isPaid) {
          return appointment.meetingLink 
            ? { text: "Ready to Join", color: "bg-success" }
            : { text: "Waiting for Link", color: "bg-info" };
        }
        return { text: "Payment Required", color: "bg-primary" };
      case "in-progress": return { text: "In Progress", color: "bg-success" };
      case "completed": return { text: "Completed", color: "bg-info" };
      case "declined": return { text: "Declined", color: "bg-danger" };
      case "cancelled": return { text: "Cancelled", color: "bg-dark" };
      default: return { text: appointment.status, color: "bg-secondary" };
    }
  };

  const statusBadge = getStatusBadge();

  // DATE HANDLING
  let dateDisplay = "Not scheduled yet";
  let timeDisplay = "";
  let showDateTime = false;

  // First, try to use appointmentDate and appointmentTime
  if (appointment.appointmentDate && appointment.appointmentTime) {
    const dateParts = appointment.appointmentDate.split("-");
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    
    const timeParts = appointment.appointmentTime.split(":");
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    
    const d = new Date(year, month, day, hours, minutes);
    
    dateDisplay = d.toLocaleDateString("en-US", {
      year: "numeric", 
      month: "short", 
      day: "numeric",
    });
    timeDisplay = d.toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
    showDateTime = true;
  }
  // Fallback to scheduledAt if available
  else if (appointment.scheduledAt) {
    const d = new Date(appointment.scheduledAt);
    dateDisplay = d.toLocaleDateString("en-US", {
      year: "numeric", 
      month: "short", 
      day: "numeric",
    });
    timeDisplay = d.toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
    showDateTime = true;
  }

  const isPending = appointment.status === "pending";
  const isScheduled = appointment.status === "scheduled";
  const isCompleted = appointment.status === "completed";
  const isDeclined = appointment.status === "declined";

  const getVetDisplay = () => {
    if (isCompleted && !vetName) return "No vet assigned";
    if (isPending) return "Not selected";
    if (isDeclined && vetName) return `Dr. ${vetName} (unavailable)`;
    return vetName ? `Dr. ${vetName}` : "Not assigned";
  };

  // Helper function to extract diagnosis text
  const getDiagnosisText = (prediction) => {
    if (!prediction) return null;
    
    if (typeof prediction === 'string') {
      return prediction;
    }
    
    if (typeof prediction === 'object' && prediction.diagnosis) {
      return prediction.diagnosis;
    }
    
    return null;
  };

  const getAISeverity = () => {
    if (!appointment.aiPrediction) return null;

    const diagnosisText = getDiagnosisText(appointment.aiPrediction);
    
    if (!diagnosisText || diagnosisText === "Awaiting analysis" || diagnosisText === "Unknown") {
      return null;
    }

    const pred = diagnosisText.toLowerCase();

    if (pred.includes("emergency") || pred.includes("critical") || pred.includes("severe") || pred.includes("urgent")) {
      return { 
        level: "high", 
        color: "danger", 
        icon: "🚨", 
        message: "Urgent attention recommended" 
      };
    } else if (pred.includes("moderate") || pred.includes("concern") || pred.includes("attention") || pred.includes("consult")) {
      return { 
        level: "medium", 
        color: "warning", 
        icon: "⚠️", 
        message: "Veterinary consultation recommended" 
      };
    }
    return { 
      level: "low", 
      color: "info", 
      icon: "ℹ️", 
      message: "Monitoring recommended" 
    };
  };

  const aiSeverity = getAISeverity();
  
  // Show AI prediction for pending and scheduled appointments
  const showAIPrediction = (isPending || isScheduled) && aiSeverity;

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">

        <AppointmentHeader petName={petName} statusBadge={statusBadge} />

        <VetInfo display={getVetDisplay()} />

        <DateTimeInfo
          showDateTime={showDateTime}
          dateDisplay={dateDisplay}
          timeDisplay={timeDisplay}
        />

        {/* Show symptoms if pending */}
        {isPending && appointment.symptoms && (
          <div className="mt-3 p-3 bg-light rounded">
            <small className="text-muted fw-semibold d-block mb-1">Reported Symptoms:</small>
            <small className="text-dark">{appointment.symptoms}</small>
          </div>
        )}

        {/* Show AI Prediction */}
        {showAIPrediction && (
          <AIPrediction aiSeverity={aiSeverity} prediction={appointment.aiPrediction} />
        )}

        {/* Show media files count if available */}
        {appointment.mediaFiles && appointment.mediaFiles.length > 0 && (
          <div className="mt-3">
            <small className="text-muted">
              🔎 {appointment.mediaFiles.length} file(s) uploaded
            </small>
          </div>
        )}

        <AppointmentActions
          status={appointment.status}
          consultationId={appointment._id}
          onSchedule={() => onSchedule(appointment)}
          onPayment={() => onPayment(appointment)}
          onJoinConsultation={() => onJoinConsultation(appointment)}
          onCancel={() => onCancel(appointment)}
          meetingLink={appointment.meetingLink}
          isPaid={appointment.isPaid || false}
        />
      </div>
    </div>
  );
}