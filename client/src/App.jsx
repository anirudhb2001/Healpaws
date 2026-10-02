import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HealPaw3 from './HealPaw3'
import LoginPage from './pages/LoginPage'
import HealPawsLanding from './pages/HealPawsLanding'
import RegisterPopup from './pages/RegisterPopup'

export default function App() {
  return (
      <Routes>
        {/* Default route → Landing page */}
        <Route path="/" element={<HealPawsLanding />} />
        <Route path="/register" element={<RegisterPopup />} />

        {/* Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* App routes (Owner, Vet, Admin) */}
        <Route path="/app/*" element={<HealPaw3 />} />

        {/* Fallback */}
        <Route path="*" element={<div className="m-5">404 — Page not found</div>} />
      </Routes>
  )
}
