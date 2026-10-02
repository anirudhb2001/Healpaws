import React, { useState } from "react";
import "../styles/CTASection.css";
import RegisterPopup from "../pages/RegisterPopup";

export default function CTASection() {
  const [showReg,setShowReg] =useState(false);
  return (
    <section id="contact" className="cta-section">
        <div className="container text-center">
          <h2 className="cta-title">Join Health Paws Today!</h2>
          <p className="cta-subtitle">Registration fee: ₹500 (Academic Project)</p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <button className="btn btn-cta-primary" onClick={() => setShowReg(true)}>
              Register Now
            </button>
          </div>
        </div>
        <RegisterPopup show={showReg} onClose={() => setShowReg(false)} />
      </section>
  );
}
