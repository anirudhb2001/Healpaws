import React from "react";
import "../styles/StatsSection.css";

export default function StatsSection() {
  return (
    <section className="stats-section">
      <div className="container">
        <div className="row text-center">
          <div className="col-md-4 stat-card">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Happy Pet Owners</div>
          </div>
          <div className="col-md-4 stat-card">
            <div className="stat-number">500+</div>
            <div className="stat-label">Licensed Veterinarians</div>
          </div>
          <div className="col-md-4 stat-card">
            <div className="stat-number">50K+</div>
            <div className="stat-label">Consultations Completed</div>
          </div>
        </div>
      </div>
    </section>
  );
}
