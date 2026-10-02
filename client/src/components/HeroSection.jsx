import React from "react";
import "../styles/HeroSection.css";
import heroImage from "../assets/hero-pet-care.png";
import { GoHeartFill } from "react-icons/go";
import { useState } from "react";
import RegisterPopup from "../pages/RegisterPopup";

export default function HeroSection() {
  const [showReg,setShowReg] =useState(false);
  return (
    <section id="home" className="hero-section">
      <div className="container">
        <div className="row align-items-center">
          {/* Left Content */}
          <div className="col-lg-6 hero-content">
            <div className="hero-badge">Loved by 10,000+ Pet Parents</div>
            <h1 className="hero-title">
              Compassionate Pet Care,<br /> Anytime, Anywhere.
            </h1>
            <p className="hero-subtitle">
              Get instant veterinary advice, schedule health checkups, and ensure
              your furry friends stay happy and healthy — always.
            </p>

            <div className="d-flex gap-3 flex-wrap mb-4">
              <button className="btn btn-primary-custom" onClick={()=> setShowReg(true)}>Book Consultation</button>
              {/* <button className="btn btn-secondary-custom">Learn More</button> */}
            </div>

            {/* <div className="hero-bullets">
              <div>✅ 24/7 Vet Access</div>
              <div>✅ Certified Professionals</div>
              <div>✅ Safe & Confidential</div>
            </div> */}
          </div>

          {/* Right Illustration */}
          <div className="col-lg-6 hero-visual">
            <div className="image-wrapper">
              <img src={heroImage} alt="Happy pet with vet" className="hero-image" />
              <div className="floating-badge">
                <div className="badge-icon"><GoHeartFill /></div>
                <div className="badge-text">Healthy Pets, Happy Hearts</div>
              </div>
              <div className="floating-shape shape1"></div>
              <div className="floating-shape shape2"></div>
              <div className="floating-shape shape3"></div>
            </div>
          </div>
        </div>
      </div>
    <RegisterPopup show={showReg} onClose={()=>setShowReg(false)} />
    </section>
  );
}
