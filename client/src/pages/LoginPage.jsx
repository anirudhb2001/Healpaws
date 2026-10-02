import React, { useState, useEffect } from "react";
import { IoPaw, IoCloseCircleSharp, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const API_URL = "http://localhost:5000/api";

export default function LoginPage({ show, onClose }) {
  const [userRole, setUserRole] = useState("owner");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const navigate = useNavigate();

  // Auto-close alert after 5 seconds
  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert({ show: false, type: '', message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ show: false, type: '', message: '' });

    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: userRole,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const fixedUser = {
          ...data.user,
          _id: data.user._id || data.user.id || data.user.ownerId
        };

        localStorage.setItem("healpaws_user", JSON.stringify(fixedUser));

        setAlert({
          show: true,
          type: 'success',
          message: `Welcome back, ${data.user.name}!`
        });

        setFormData({ email: "", password: "", remember: false });

        // Redirect after showing success message
        setTimeout(() => {
          onClose();
          if (userRole === "owner") navigate("/app/owner/dashboard");
          if (userRole === "vet") navigate("/app/vet/dashboard");
          if (userRole === "admin") navigate("/app/admin/dashboard");
        }, 1500);

      } else {
        setAlert({
          show: true,
          type: 'danger',
          message: data.message || "Login failed. Please try again."
        });
      }
    } catch (error) {
      setAlert({
        show: true,
        type: 'danger',
        message: "Network error. Please check your connection and try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const closeAlert = () => {
    setAlert({ show: false, type: '', message: '' });
  };

  return (
    <div className="login-overlay">
      <div className="login-popup shadow-lg">

        <button className="close-btn" onClick={onClose} disabled={loading}>
          <IoCloseCircleSharp />
        </button>

        <div className="text-center mb-3">
          <h4 className="fw-bold d-flex align-items-center justify-content-center gap-2">
            <IoPaw /> HealPaws
          </h4>
          <h5 className="fw-bold mt-3">Welcome Back!</h5>
          <p className="text-muted small">Login to access your account</p>
        </div>

        {/* Bootstrap Alert */}
        {alert.show && (
          <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
            <button 
              type="button" 
              className="btn-close" 
              onClick={closeAlert}
              aria-label="Close"
            ></button>
            {alert.message}
          </div>
        )}

        <div className="d-flex justify-content-center mb-3 tab-buttons">
          <button
            type="button"
            className={`btn tab-btn ${userRole === "owner" ? "active-tab" : ""}`}
            onClick={() => setUserRole("owner")}
          >
            Pet Owner
          </button>
          <button
            type="button"
            className={`btn tab-btn ${userRole === "vet" ? "active-tab" : ""}`}
            onClick={() => setUserRole("vet")}
          >
            Veterinarian
          </button>
          <button
            type="button"
            className={`btn tab-btn ${userRole === "admin" ? "active-tab" : ""}`}
            onClick={() => setUserRole("admin")}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="Email Address"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-3 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              disabled={loading}
              style={{ paddingRight: "40px" }}
            />
            <button
              type="button"
              className="btn btn-link position-absolute top-50 end-0 translate-middle-y"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              style={{
                border: "none",
                background: "none",
                color: "#6c757d",
                padding: "0 12px",
                zIndex: 10
              }}
            >
              {showPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-success w-100 login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}