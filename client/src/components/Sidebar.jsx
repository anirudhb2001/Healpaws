import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PawPrint,
  Home,
  Stethoscope,
  Calendar,
  FileText,
  Clock,
  User,
  AlertTriangle,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

export default function Sidebar() {
  const navigate = useNavigate()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  const user = JSON.parse(localStorage.getItem('healpaws_user')) || {}
  const role = user.role || 'owner'

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 992)
      if (window.innerWidth >= 992) {
        setIsMobileOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('healpaws_user')
    navigate('/')
  }

  const handleNavClick = (path) => {
    navigate(path)
    if (isMobile) {
      setIsMobileOpen(false)
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          className="btn btn-light position-fixed top-0 start-0 m-3 shadow-sm"
          style={{ zIndex: 1100 }}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && isMobileOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            zIndex: 1001 
          }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className="border-end shadow-sm position-fixed top-0 start-0 d-flex flex-column"
        style={{
          width: '260px',
          height: '100vh',
          zIndex: isMobile ? 1050 : 1000,
          backgroundColor: '#e2f0ecff',
          transform: isMobile && !isMobileOpen ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        {/* Header */}
        <div className="p-4">
          <div className="d-flex align-items-center">
            <PawPrint size={28} className="text-success me-2" />
            <h4 className="mb-0 fw-bold" style={{ color: '#1e3a5f' }}>
              Health Paws
            </h4>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 flex-grow-1" style={{ overflowY: 'auto' }}>
          {role === 'owner' ? (
            <>
              <button className="btn w-100 text-start mb-2 btn-light" onClick={() => handleNavClick('/app/owner/dashboard')}>
                <Home size={18} className="me-2" /> Dashboard
              </button>
              <button className="btn w-100 text-start mb-2 btn-light" onClick={() => handleNavClick('/app/owner/submit')}>
                <Stethoscope size={18} className="me-2" /> Submit Symptoms
              </button>
              <button className="btn w-100 text-start mb-2 btn-light" onClick={() => handleNavClick('/app/owner/pets')}>
                <PawPrint size={18} className="me-2" /> My Pets
              </button>
              <button className="btn w-100 text-start mb-2 btn-light" onClick={() => handleNavClick('/app/owner/appointments')}>
                <Calendar size={18} className="me-2" /> Appointments
              </button>
              <button className="btn w-100 text-start mb-2 btn-light" onClick={() => handleNavClick('/app/owner/health-records')}>
                <FileText size={18} className="me-2" /> Health Records
              </button>
            </>
          ) : role === 'vet' ? (
            <>
              <button className="btn w-100 text-start mb-2 btn-light" onClick={() => handleNavClick('/app/vet/dashboard')}>
                <Home size={18} className="me-2" /> Dashboard
              </button>
              <button className="btn w-100 text-start mb-2 btn-light" onClick={() => handleNavClick('/app/vet/pending')}>
                <Clock size={18} className="me-2" /> Pending Requests
              </button>
              <button className="btn w-100 text-start mb-2 btn-light" onClick={() => handleNavClick('/app/vet/schedule')}>
                <Calendar size={18} className="me-2" /> My Schedule
              </button>
              <button className="btn w-100 text-start mb-2 btn-light" onClick={() => handleNavClick('/app/vet/cases')}>
                <FileText size={18} className="me-2" /> Case History
              </button>
            </>
          ) : (
            <>
              <button className="btn w-100 text-start mb-2 btn-light" onClick={() => handleNavClick('/app/admin/dashboard')}>
                <Home size={18} className="me-2" /> Dashboard
              </button>
              <button className="btn w-100 text-start mb-2 btn-light" onClick={() => handleNavClick('/app/admin/users')}>
                <User size={18} className="me-2" /> Manage Users
              </button>
              <button className="btn w-100 text-start mb-2 btn-light" onClick={() => handleNavClick('/app/admin/alerts')}>
                <AlertTriangle size={18} className="me-2" /> Disease Alerts
              </button>
              <button className="btn w-100 text-start mb-2 btn-light" onClick={() => handleNavClick('/app/admin/reports')}>
                <FileText size={18} className="me-2" /> Reports
              </button>
            </>
          )}
        </nav>

        {/* Logout Button */}
        <div className="p-3">
          <button className="btn btn-outline-danger w-100" onClick={handleLogout}>
            <LogOut size={18} className="me-2" /> Logout
          </button>
        </div>
      </div>
    </>
  )
}