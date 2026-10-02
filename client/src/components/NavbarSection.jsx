import React, { useState } from "react";
import "../styles/NavbarSection.css";
import LoginPage from "../pages/LoginPage";
import RegisterPopup from "../pages/RegisterPopup";

export default function NavbarSection({ scrolled }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <>
      <nav
        className={`navbar navbar-expand-lg fixed-top navbar-custom ${scrolled ? "scrolled" : ""
          }`}
      >
        <div className="container">
          <a className="brand-logo" href="#">
            <div className="paw-icon">🐾</div>
            <span>
              Heal<span className="highlight">Paws</span>
            </span>
          </a>

          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="menu-icon">{menuOpen ? "✕" : "☰"}</span>
          </button>

          <div className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}>
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item">
                <a className="nav-link-custom" href="#home">
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link-custom" href="#features">
                  Features
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link-custom" href="#how-it-works">
                  How It Works
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link-custom" href="#why-us">
                  Why Us
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link-custom" href="#contact">
                  Contact
                </a>
              </li>
              <li className="nav-item ms-3 d-flex gap-2">
                <button className="btn btn-login" onClick={() => setShowLogin(true)}>
                  Login
                </button>
                <button className="btn btn-register" onClick={() => setShowRegister(true)}>Register</button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <LoginPage show={showLogin} onClose={() => setShowLogin(false)} />
      <RegisterPopup show={showRegister} onClose={() => setShowRegister(false)} />
    </>
  );
}
