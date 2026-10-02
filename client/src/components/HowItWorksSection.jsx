import React from "react";
import "../styles/HowItWorksSection.css";

export default function HowItWorksSection() {
  const steps = [
    { step: "1", title: "Register & Create Profile", desc: "Sign up and add your pet's details" },
    { step: "2", title: "Submit Symptoms", desc: "Describe your pet's condition and upload photos" },
    { step: "3", title: "AI Pre-Diagnosis", desc: "Get instant AI-powered insights" },
    { step: "4", title: "Consult with Vet", desc: "Join chat or video consultation" },
    { step: "5", title: "Receive Care Plan", desc: "Get prescriptions and treatment schedules" },
  ];

  return (
    <section id="how-it-works" className="how-it-works-section">
      <div className="container">
        <h2 className="section-title">How Health Paws Works</h2>
        <p className="section-subtitle">Simple steps to get your pet the care they deserve</p>
        <div className="row">
          {steps.map((item, index) => (
            <div key={index} className="col-lg col-md-6">
              <div className="step-card">
                <div className="step-number">{item.step}</div>
                <h4 className="step-title">{item.title}</h4>
                <p className="step-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
