import React from "react";
import "../styles/BenefitsSection.css";
import { FaHome, FaHistory } from "react-icons/fa";
import { MdElectricBolt } from "react-icons/md";

export default function BenefitsSection() {
  const benefits = [
    { icon: <FaHome />, title: "Accessible Care, Anywhere", desc: "Get expert care from home, even in remote areas." },
    { icon: <MdElectricBolt />, title: "Seamless, Smart & Simple", desc: "Book consultations in minutes, no waiting rooms." },
    { icon: <FaHistory />, title: "Complete Health History", desc: "Track vaccinations, treatments, and progress easily." },
  ];

  return (
    <section id="why-us" className="benefits-section">
      <div className="container">
        <h2 className="section-title">Why Pet Owners Love Health Paws</h2>
        <p className="section-subtitle">Join thousands of happy pet parents who trust us with their pets' health</p>
        <div className="row">
          {benefits.map((benefit, index) => (
            <div key={index} className="col-lg-4 col-md-6">
              <div className="benefit-card">
                <div className="benefit-icon">{benefit.icon}</div>
                <h3 className="benefit-title">{benefit.title}</h3>
                <p className="benefit-desc">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
