import React from "react";
import "../styles/FooterSection.css";

export default function FooterSection() {
  return (
    <footer className="footer">
      <div className="container text-center">
        {/* <div className="d-flex justify-content-center align-items-center mb-3">
          <div className="paw-icon">🐾</div>
          <h5 className="footer-brand ms-2">Health Paws</h5>
        </div> */}
        <p className="footer-copy">© 2025 Health Paws. All rights reserved.</p>
      </div>
    </footer>
  );
}
