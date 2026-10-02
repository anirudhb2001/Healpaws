import React from "react";

export default function VetInfo({ display }) {
  return (
    <p className="text-muted mb-2">
      <strong>Veterinarian:</strong> {display}
    </p>
  );
}
