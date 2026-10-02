import React from "react";

export default function AppointmentHeader({ petName, statusBadge }) {
  return (
    <div className="d-flex justify-content-between align-items-start mb-3">
      <h5 className="fw-bold mb-0">{petName}</h5>
      <span className={`badge ${statusBadge.color}`}>
        {statusBadge.text}
      </span>
    </div>
  );
}
