import React, { useState, useEffect } from 'react';
import { FileText, Download, Activity, Users, DollarSign, AlertTriangle, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AppLayout from '../layouts/AppLayout';

// Modal Component
function Modal({ show, onClose, title, message, type = "success" }) {
  if (!show) return null;

  const iconColor = type === "success" ? "text-success" : "text-danger";
  const Icon = type === "success" ? CheckCircle : XCircle;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      <div 
        className="modal fade show d-block" 
        tabIndex="-1" 
        style={{ zIndex: 1050 }}
        onClick={onClose}
      >
        <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header border-0">
              <h5 className="modal-title fw-bold">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body text-center py-4">
              <Icon size={64} className={`${iconColor} mb-3`} />
              <p className="mb-0">{message}</p>
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SystemReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    consultations: [],
    users: [],
    pets: [],
    diseaseAlerts: []
  });
  const [stats, setStats] = useState({
    totalConsultations: 0,
    completedConsultations: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalVets: 0,
    totalOwners: 0,
    totalPets: 0,
    activeAlerts: 0
  });

  // Modal state
  const [modalState, setModalState] = useState({
    show: false,
    type: "success",
    title: "",
    message: ""
  });

  useEffect(() => {
    fetchAllReportData();
  }, []);

  const showModal = (type, title, message) => {
    setModalState({ show: true, type, title, message });
  };

  const closeModal = () => {
    setModalState({ show: false, type: "success", title: "", message: "" });
  };

  const fetchAllReportData = async () => {
    try {
      setLoading(true);
      
      const [consultationsRes, usersRes, petsRes, alertsRes] = await Promise.all([
        fetch('http://localhost:5000/api/consultations'),
        fetch('http://localhost:5000/api/users'),
        fetch('http://localhost:5000/api/pets'),
        fetch('http://localhost:5000/api/disease-alerts')
      ]);

      const consultations = await consultationsRes.json();
      const users = await usersRes.json();
      const pets = await petsRes.json();
      const alerts = await alertsRes.json();

      const consultationList = consultations.appointments || consultations || [];
      const userList = users.users || users || [];
      const petList = pets.pets || pets || [];
      const alertList = alerts.alerts || alerts || [];

      const completedConsultations = consultationList.filter(c => c.status === 'completed');
      const totalRevenue = completedConsultations.reduce((sum, c) => sum + (c.paymentAmount || 0), 0);
      const vets = userList.filter(u => u.role === 'vet');
      const owners = userList.filter(u => u.role === 'owner');
      const activeAlerts = alertList.filter(a => a.status === 'active');

      setReportData({
        consultations: consultationList,
        users: userList,
        pets: petList,
        diseaseAlerts: alertList
      });

      setStats({
        totalConsultations: consultationList.length,
        completedConsultations: completedConsultations.length,
        totalRevenue: totalRevenue,
        totalUsers: userList.length,
        totalVets: vets.length,
        totalOwners: owners.length,
        totalPets: petList.length,
        activeAlerts: activeAlerts.length
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setLoading(false);
    }
  };

  const generateMonthlyActivityReport = () => {
    try {
      const doc = new jsPDF();
      const currentDate = new Date();
      const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Monthly Activity Report', 14, 22);
      
      // Subtitle
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(monthYear, 14, 30);
      doc.text(`Generated on: ${currentDate.toLocaleDateString()}`, 14, 36);

      // System Overview Header
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('System Overview', 14, 50);

      // Summary data
      const summaryData = [
        ['Total Consultations', stats.totalConsultations.toString()],
        ['Completed Consultations', stats.completedConsultations.toString()],
        ['Total Revenue', `INR ${stats.totalRevenue.toFixed(2)}`],
        ['Total Users', stats.totalUsers.toString()],
        ['Total Veterinarians', stats.totalVets.toString()],
        ['Total Pet Owners', stats.totalOwners.toString()],
        ['Total Pets', stats.totalPets.toString()],
        ['Active Disease Alerts', stats.activeAlerts.toString()]
      ];

      autoTable(doc, {
        startY: 55,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        margin: { left: 14 }
      });

      // Consultation status breakdown
      const statusCounts = reportData.consultations.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {});

      const statusData = Object.entries(statusCounts).map(([status, count]) => [
        status.charAt(0).toUpperCase() + status.slice(1),
        count.toString()
      ]);

      const finalY = doc.lastAutoTable?.finalY || 55;
      doc.text('Consultation Status Breakdown', 14, finalY + 15);
      
      autoTable(doc, {
        startY: finalY + 20,
        head: [['Status', 'Count']],
        body: statusData.length > 0 ? statusData : [['No data', '0']],
        theme: 'striped',
        headStyles: { fillColor: [92, 184, 92] },
        margin: { left: 14 }
      });

      doc.save(`Monthly_Activity_Report_${monthYear.replace(' ', '_')}.pdf`);
      showModal('success', 'Report Downloaded', 'Monthly Activity Report downloaded successfully!');
    } catch (error) {
      console.error('Error generating monthly report:', error);
      showModal('error', 'Download Failed', `Failed to generate report: ${error.message}`);
    }
  };

  const generateUserGrowthReport = () => {
    try {
      const doc = new jsPDF();
      const currentDate = new Date();

      // Title
      doc.setFontSize(20);
      doc.text('User Growth Report', 14, 22);
      
      // Subtitle
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${currentDate.toLocaleDateString()}`, 14, 30);

      // User Statistics Header
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('User Statistics', 14, 45);

      const userStats = [
        ['Total Users', stats.totalUsers.toString()],
        ['Pet Owners', stats.totalOwners.toString()],
        ['Veterinarians', stats.totalVets.toString()],
        ['Approved Vets', reportData.users.filter(u => u.role === 'vet' && u.isApproved).length.toString()],
        ['Pending Vets', reportData.users.filter(u => u.role === 'vet' && !u.isApproved).length.toString()]
      ];

      autoTable(doc, {
        startY: 50,
        head: [['Category', 'Count']],
        body: userStats,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        margin: { left: 14 }
      });

      const finalY = doc.lastAutoTable?.finalY || 50;
      doc.text('Veterinarians', 14, finalY + 15);
      
      const vetData = reportData.users
        .filter(u => u.role === 'vet')
        .map(v => [
          v.name || 'N/A',
          v.specialization || 'N/A',
          v.isApproved ? 'Approved' : 'Pending',
          v.email || 'N/A'
        ]);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Name', 'Specialization', 'Status', 'Email']],
        body: vetData.length > 0 ? vetData : [['No veterinarians found', '', '', '']],
        theme: 'striped',
        headStyles: { fillColor: [92, 184, 92] },
        margin: { left: 14 }
      });

      doc.save(`User_Growth_Report_${currentDate.toLocaleDateString().replace(/\//g, '_')}.pdf`);
      showModal('success', 'Report Downloaded', 'User Growth Report downloaded successfully!');
    } catch (error) {
      console.error('Error generating user report:', error);
      showModal('error', 'Download Failed', `Failed to generate report: ${error.message}`);
    }
  };

  const generateRevenueReport = () => {
    try {
      const doc = new jsPDF();
      const currentDate = new Date();

      // Title
      doc.setFontSize(20);
      doc.text('Revenue Summary Report', 14, 22);
      
      // Subtitle
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${currentDate.toLocaleDateString()}`, 14, 30);

      // Revenue Overview Header
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Revenue Overview', 14, 45);

      const revenueStats = [
        ['Total Revenue', `INR ${stats.totalRevenue.toFixed(2)}`],
        ['Completed Consultations', stats.completedConsultations.toString()],
        ['Average Revenue per Consultation', stats.completedConsultations > 0 ? `INR ${(stats.totalRevenue / stats.completedConsultations).toFixed(2)}` : 'INR 0.00'],
        ['Pending Consultations', reportData.consultations.filter(c => c.status === 'pending').length.toString()],
        ['In-Progress Consultations', reportData.consultations.filter(c => c.status === 'in-progress').length.toString()]
      ];

      autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Value']],
        body: revenueStats,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        margin: { left: 14 }
      });

      const finalY = doc.lastAutoTable?.finalY || 50;
      doc.text('Completed Consultation Details', 14, finalY + 15);

      const revenueData = reportData.consultations
        .filter(c => c.status === 'completed' && c.isPaid)
        .map(c => [
          c.petId?.name || 'N/A',
          c.ownerId?.name || 'N/A',
          c.vetId?.name || 'N/A',
          new Date(c.appointmentDate || c.createdAt).toLocaleDateString(),
          `INR ${(c.paymentAmount || 0).toFixed(2)}`
        ]);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Pet', 'Owner', 'Vet', 'Date', 'Amount']],
        body: revenueData.length > 0 ? revenueData : [['No completed consultations found', '', '', '', '']],
        theme: 'striped',
        headStyles: { fillColor: [92, 184, 92] },
        margin: { left: 14 }
      });

      doc.save(`Revenue_Summary_${currentDate.toLocaleDateString().replace(/\//g, '_')}.pdf`);
      showModal('success', 'Report Downloaded', 'Revenue Summary Report downloaded successfully!');
    } catch (error) {
      console.error('Error generating revenue report:', error);
      showModal('error', 'Download Failed', `Failed to generate report: ${error.message}`);
    }
  };

  const generateDiseaseAlertReport = () => {
    try {
      const doc = new jsPDF();
      const currentDate = new Date();

      // Title
      doc.setFontSize(20);
      doc.text('Disease Alert Report', 14, 22);
      
      // Subtitle
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${currentDate.toLocaleDateString()}`, 14, 30);

      // Alert Summary Header
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Alert Summary', 14, 45);

      const alertStats = [
        ['Total Alerts', reportData.diseaseAlerts.length.toString()],
        ['Active Alerts', stats.activeAlerts.toString()],
        ['High Severity', reportData.diseaseAlerts.filter(a => a.severity === 'high').length.toString()],
        ['Medium Severity', reportData.diseaseAlerts.filter(a => a.severity === 'medium').length.toString()],
        ['Low Severity', reportData.diseaseAlerts.filter(a => a.severity === 'low').length.toString()]
      ];

      autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Count']],
        body: alertStats,
        theme: 'grid',
        headStyles: { fillColor: [217, 83, 79] },
        margin: { left: 14 }
      });

      const finalY = doc.lastAutoTable?.finalY || 50;
      doc.text('Active Disease Alerts', 14, finalY + 15);

      const alertData = reportData.diseaseAlerts
        .filter(a => a.status === 'active')
        .map(a => [
          a.disease || 'N/A',
          a.area || 'N/A',
          (a.cases || 0).toString(),
          (a.severity || 'N/A').toUpperCase(),
          a.species || 'All'
        ]);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Disease', 'Area', 'Cases', 'Severity', 'Species']],
        body: alertData.length > 0 ? alertData : [['No active alerts', '', '', '', '']],
        theme: 'striped',
        headStyles: { fillColor: [240, 173, 78] },
        margin: { left: 14 }
      });

      doc.save(`Disease_Alert_Report_${currentDate.toLocaleDateString().replace(/\//g, '_')}.pdf`);
      showModal('success', 'Report Downloaded', 'Disease Alert Report downloaded successfully!');
    } catch (error) {
      console.error('Error generating disease alert report:', error);
      showModal('error', 'Download Failed', `Failed to generate report: ${error.message}`);
    }
  };

  const generateComprehensiveReport = () => {
    try {
      const doc = new jsPDF();
      const currentDate = new Date();

      // Cover Page
      doc.setFontSize(24);
      doc.setTextColor(40, 40, 40);
      doc.text('Comprehensive System Report', 14, 40);
      
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${currentDate.toLocaleDateString()}`, 14, 50);
      doc.text('PetCare Management System', 14, 58);

      // Executive Summary Page
      doc.addPage();
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('Executive Summary', 14, 20);

      const execSummary = [
        ['Total System Users', stats.totalUsers.toString()],
        ['Active Veterinarians', stats.totalVets.toString()],
        ['Pet Owners', stats.totalOwners.toString()],
        ['Registered Pets', stats.totalPets.toString()],
        ['Total Consultations', stats.totalConsultations.toString()],
        ['Completed Consultations', stats.completedConsultations.toString()],
        ['Total Revenue', `INR ${stats.totalRevenue.toFixed(2)}`],
        ['Active Disease Alerts', stats.activeAlerts.toString()]
      ];

      autoTable(doc, {
        startY: 28,
        head: [['Metric', 'Value']],
        body: execSummary,
        theme: 'grid',
        headStyles: { fillColor: [52, 73, 94] },
        margin: { left: 14 }
      });

      // Consultation Analytics
      const finalY = doc.lastAutoTable?.finalY || 28;
      doc.setFontSize(16);
      doc.text('Consultation Analytics', 14, finalY + 15);

      const statusBreakdown = reportData.consultations.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {});

      const consultationData = Object.entries(statusBreakdown).map(([status, count]) => [
        status.charAt(0).toUpperCase() + status.slice(1),
        count.toString(),
        stats.totalConsultations > 0 ? `${((count / stats.totalConsultations) * 100).toFixed(1)}%` : '0%'
      ]);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Status', 'Count', 'Percentage']],
        body: consultationData.length > 0 ? consultationData : [['No data', '0', '0%']],
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
        margin: { left: 14 }
      });

      doc.save(`Comprehensive_Report_${currentDate.toLocaleDateString().replace(/\//g, '_')}.pdf`);
      showModal('success', 'Report Downloaded', 'Comprehensive Report downloaded successfully!');
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      showModal('error', 'Download Failed', `Failed to generate report: ${error.message}`);
    }
  };

  const reports = [
    {
      id: 1,
      title: 'Monthly Activity Report',
      description: 'Overview of system activity and consultations',
      icon: Activity,
      iconBg: 'bg-primary bg-opacity-10',
      iconColor: 'text-primary',
      action: generateMonthlyActivityReport,
      stats: `${stats.totalConsultations} consultations`
    },
    {
      id: 2,
      title: 'User Growth Report',
      description: 'User registration and growth metrics',
      icon: Users,
      iconBg: 'bg-success bg-opacity-10',
      iconColor: 'text-success',
      action: generateUserGrowthReport,
      stats: `${stats.totalUsers} total users`
    },
    {
      id: 3,
      title: 'Revenue Summary',
      description: 'Financial overview and revenue details',
      icon: DollarSign,
      iconBg: 'bg-info bg-opacity-10',
      iconColor: 'text-info',
      action: generateRevenueReport,
      stats: `₹${stats.totalRevenue.toFixed(2)} total`
    },
    {
      id: 4,
      title: 'Disease Alert Report',
      description: 'Active disease alerts and outbreak tracking',
      icon: AlertTriangle,
      iconBg: 'bg-danger bg-opacity-10',
      iconColor: 'text-danger',
      action: generateDiseaseAlertReport,
      stats: `${stats.activeAlerts} active alerts`
    },
    // {
    //   id: 5,
    //   title: 'Comprehensive Report',
    //   description: 'Complete system overview with all metrics',
    //   icon: TrendingUp,
    //   iconBg: 'bg-secondary bg-opacity-10',
    //   iconColor: 'text-secondary',
    //   action: generateComprehensiveReport,
    //   stats: 'All data included'
    // }
  ];

  if (loading) {
    return (
      <AppLayout title="System Reports" role="admin">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading report data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="System Reports" role="admin">
      {/* Modal */}
      <Modal
        show={modalState.show}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />

      {/* Stats Overview */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm border-start border-primary border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Total Consultations</p>
                  <h3 className="fw-bold mb-0">{stats.totalConsultations}</h3>
                </div>
                <Activity className="text-primary" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm border-start border-success border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Total Users</p>
                  <h3 className="fw-bold mb-0">{stats.totalUsers}</h3>
                </div>
                <Users className="text-success" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm border-start border-info border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Total Revenue</p>
                  <h3 className="fw-bold mb-0">₹{stats.totalRevenue.toFixed(2)}</h3>
                </div>
                <span style={{fontSize: '32px', fontWeight: '600', color: '#0dcaf0'}}>₹</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm border-start border-danger border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Active Alerts</p>
                  <h3 className="fw-bold mb-0">{stats.activeAlerts}</h3>
                </div>
                <AlertTriangle className="text-danger" size={32} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="row g-4 mb-4">
        {reports.map((report) => {
          const IconComponent = report.icon;
          return (
            <div key={report.id} className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm h-100 hover-shadow transition">
                <div className="card-body text-center">
                  <div className="d-flex justify-content-center mb-3">
                    <div className={`p-3 rounded-circle ${report.iconBg}`}>
                      <IconComponent className={report.iconColor} size={40} />
                    </div>
                  </div>
                  
                  <h5 className="card-title fw-bold mb-2">{report.title}</h5>
                  <p className="card-text text-muted small mb-3">{report.description}</p>

                  <div className="bg-light rounded p-2 mb-3">
                    <small className="text-dark fw-medium">{report.stats}</small>
                  </div>

                  <button
                    onClick={report.action}
                    className="btn btn-success w-100"
                  >
                    <Download size={18} className="me-2" />
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="alert alert-info border-0 shadow-sm">
        <div className="d-flex align-items-start">
          <FileText className="text-info me-3 mt-1" size={20} />
          <div>
            <h6 className="alert-heading fw-bold mb-1">Report Information</h6>
            <p className="mb-0 small">
              All reports are generated in real-time with the latest data from the system. 
              Click "Download PDF" to generate and save any report to your device.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hover-shadow {
          transition: box-shadow 0.3s ease;
        }
        .hover-shadow:hover {
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
        .bg-opacity-10 {
          background-color: rgba(var(--bs-primary-rgb), 0.1);
        }
      `}</style>
    </AppLayout>
  );
}