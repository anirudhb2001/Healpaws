import React from "react";
import "../styles/FeaturesSection.css";
import { FaRobot, FaLaptop } from "react-icons/fa";
import { LuNotebookText } from "react-icons/lu";
import { AiOutlineSchedule, AiOutlineMedicineBox } from "react-icons/ai";
import { PiSiren } from "react-icons/pi";

export default function FeaturesSection() {
  const features = [
    { icon: <FaRobot />, title: "AI-Powered Pre-Diagnosis", description: "Get instant AI-powered insights about possible conditions before consulting with a vet" },
    { icon: <FaLaptop />, title: "Virtual Consultations", description: "Connect with licensed veterinarians via chat or video call from anywhere" },
    { icon: <LuNotebookText />, title: "Digital Health Records", description: "Complete medical history, vaccinations, and treatment records in one secure place" },
    { icon: <AiOutlineSchedule />, title: "Smart Scheduling", description: "Book appointments easily with automated reminders" },
    { icon: <AiOutlineMedicineBox />, title: "Prescription Management", description: "Receive and track prescriptions digitally" },
    { icon: <PiSiren />, title: "Disease Outbreak Alerts", description: "Stay informed about health trends and outbreaks in your area" },
  ];

  return (
    <section id="features" className="features-section">
      <div className="container">
        <h2 className="section-title">Comprehensive Pet Care Features</h2>
        <p className="section-subtitle">Everything you need to keep your furry friends healthy and happy</p>
        <div className="row">
          {features.map((feature, index) => (
            <div key={index} className="col-lg-4 col-md-6">
              <div className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
