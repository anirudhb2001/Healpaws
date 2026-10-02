import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/HealPawsLanding.css";

import NavbarSection from "../components/NavbarSection";
import HeroSection from "../components/HeroSection";
import StatsSection from "../components/StatsSection";
import FeaturesSection from "../components/FeaturesSection";
import HowItWorksSection from "../components/HowItWorksSection";
import BenefitsSection from "../components/BenefitsSection";
import CTASection from "../components/CTASection";
import FooterSection from "../components/FooterSection";

const HealPawsLanding = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="healpaws-landing">
      <NavbarSection scrolled={scrolled} />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <BenefitsSection />
      <CTASection />
      <FooterSection />
    </div>
  );
};

export default HealPawsLanding;
