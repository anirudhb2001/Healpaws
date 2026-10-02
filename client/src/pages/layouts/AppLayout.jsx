import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import Header from '../../components/Header'

export default function AppLayout({ title, children }) {
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 992)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('healpaws_user'))
    if (!user) {
      navigate('/') // Redirect only if user is missing
    }
  }, [navigate])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Section */}
      <main
        style={{
          marginLeft: isMobile ? '0' : '260px',
          background: '#f8f9fa',
          minHeight: '100vh',
          width: isMobile ? '100%' : 'calc(100% - 260px)',
          transition: 'margin 0.3s ease, width 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          paddingTop: isMobile ? '60px' : '0', // Add padding for fixed header on mobile
        }}
      >
        <Header title={title} />
        <div 
          className="container-fluid" 
          style={{
            padding: isMobile ? '0.75rem' : '1.5rem',
            paddingTop: isMobile ? '1rem' : '1.5rem',
            maxWidth: '100%',
            overflowX: 'hidden',
          }}
        >
          {children}
        </div>
      </main>
    </div>
  )
}