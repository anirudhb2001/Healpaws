import React from 'react'
import { Routes, Route } from 'react-router-dom'
import OwnerDashboard from './pages/owner/OwnerDashboard'
import MyPetsPage from './pages/owner/MyPetsPage'
import AppointmentsPage from './pages/owner/AppointmentsPage'
import HealthRecordsPage from './pages/owner/HealthRecordsPage'
import SubmitSymptomsPage from './pages/owner/SubmitSymptomsPage'
import PaymentPage from './pages/owner/PaymentPage'
import ConsultationRoom from './pages/owner/ConsultationRoom'
import AddPetPage from './pages/owner/AddPetPage'
import HealthRecordView from './pages/owner/HealthRecordView'

import VetDashboard from './pages/vet/VetDashboard'
import PendingRequestsPage from './pages/vet/PendingRequestsPage'
import VetSchedulePage from './pages/vet/VetSchedulePage'
import PrescriptionPage from './pages/vet/PrescriptionPage'
import CaseHistoryPage from './pages/vet/CaseHistoryPage'

import AdminDashboard from './pages/admin/AdminDashboard'
import ManageUsersPage from './pages/admin/ManageUsersPage'
import DiseaseOutbreakPage from './pages/admin/DiseaseOutbreakPage'
import SystemReportsPage from './pages/admin/SystemReportsPage'
import AIDiagnosisReviewPage from './pages/vet/AIDiagnosisReviewPage';
import VirtualConsultationSetupPage from './pages/vet/VirtualConsultationSetupPage'
import CaseHistoryView from './pages/vet/CaseHistoryView'

export default function HealPaw3() {
  return (
    <Routes>
      {/* Owner routes */}
      <Route path="owner/dashboard" element={<OwnerDashboard />} />
      <Route path="owner/pets" element={<MyPetsPage />} />
      <Route path="owner/appointments" element={<AppointmentsPage />} />
      <Route path="owner/health-records" element={<HealthRecordsPage />} />
      <Route path="owner/consultation/:id" element={<HealthRecordView />} />
      <Route path="owner/submit" element={<SubmitSymptomsPage />} />
      <Route path="owner/payment/:appointmentId" element={<PaymentPage />} />
      <Route path="owner/consultation" element={<ConsultationRoom />} />
      <Route path="owner/addpet" element={<AddPetPage />} />

      {/* Vet routes */}
      <Route path="vet/dashboard" element={<VetDashboard />} />
      <Route path="vet/pending" element={<PendingRequestsPage />} />
      <Route path="vet/schedule" element={<VetSchedulePage />} />
      <Route path="vet/prescription" element={<PrescriptionPage />} />
      <Route path="vet/cases" element={<CaseHistoryPage />} />
      <Route path="vet/case-history/:id" element={<CaseHistoryView />} />
      <Route path="vet/diagnosis" element={<AIDiagnosisReviewPage />} />
      <Route path="vet/virtual-setup" element={<VirtualConsultationSetupPage />} />

      {/* Admin routes */}
      <Route path="admin/dashboard" element={<AdminDashboard />} />
      <Route path="admin/users" element={<ManageUsersPage />} />
      <Route path="admin/alerts" element={<DiseaseOutbreakPage />} />
      <Route path="admin/reports" element={<SystemReportsPage />} />
    </Routes>
  )
}
