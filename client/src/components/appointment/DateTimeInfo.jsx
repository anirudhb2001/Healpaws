import React from "react";
import { Calendar } from "lucide-react";

export default function DateTimeInfo({ showDateTime, dateDisplay, timeDisplay }) {
  return (
    <p className="text-muted mb-3 d-flex align-items-center">
      <Calendar size={16} className="me-2" />
      {showDateTime ? (
        <>
          {dateDisplay}
          {timeDisplay && <span className="ms-1">at {timeDisplay}</span>}
        </>
      ) : (
        <span>{dateDisplay}</span>
      )}
    </p>
  );
}
