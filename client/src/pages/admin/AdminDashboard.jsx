import React, { useState, useEffect } from "react";
import {
  User,
  Stethoscope,
  PawPrint,
  Activity,
  Clock,
  CheckCircle,
  DollarSign,
  AlertCircle,
  Loader,
  X
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";

// Modal Component
function Modal({ show, onClose, title, message, type = "success" }) {
  if (!show) return null;

  const iconColor = type === "success" ? "text-success" : type === "error" ? "text-danger" : "text-warning";
  const Icon = type === "success" ? CheckCircle : type === "error" ? AlertCircle : AlertCircle;

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

// Confirm Modal Component
function ConfirmModal({ show, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel" }) {
  if (!show) return null;

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
            <div className="modal-body">
              <p className="mb-0">{message}</p>
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {cancelText}
              </button>
              <button type="button" className="btn btn-primary" onClick={onConfirm}>
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Reject Modal Component (for entering reason)
function RejectModal({ show, onClose, onConfirm, vetName }) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim());
      setReason("");
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      <div 
        className="modal fade show d-block" 
        tabIndex="-1" 
        style={{ zIndex: 1050 }}
        onClick={handleClose}
      >
        <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header border-0">
              <h5 className="modal-title fw-bold">Reject Application</h5>
              <button type="button" className="btn-close" onClick={handleClose}></button>
            </div>
            <div className="modal-body">
              <p className="mb-3">Enter reason for rejecting <strong>{vetName}</strong>'s application:</p>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Enter rejection reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                autoFocus
              />
              {reason.trim() === "" && (
                <small className="text-muted d-block mt-2">
                  * Reason is required
                </small>
              )}
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={handleConfirm}
                disabled={!reason.trim()}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// StatCard Component
function StatCard({ icon, label, value, color }) {
  return (
    <div className="col-6 col-lg-3 mb-3 mb-lg-0">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body p-3">
          <div className="d-flex align-items-center">
            <div className={`rounded-circle bg-${color} bg-opacity-10 p-2 p-md-3 me-2 me-md-3 text-${color}`}>
              {React.cloneElement(icon, { size: window.innerWidth < 768 ? 20 : 24 })}
            </div>
            <div>
              <h6 className="text-muted mb-0 small">{label}</h6>
              <h3 className="mb-0 fs-4 fs-md-3">{value}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// SystemActivity Component
function SystemActivity({ stats }) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-0 py-3">
        <h5 className="mb-0 fw-bold fs-6 fs-md-5">System Activity Overview</h5>
      </div>
      <div className="card-body p-2 p-md-3">
        <div className="row g-2 g-md-3 text-center">
          <div className="col-6 col-md-3">
            <div className="p-2 p-md-3 border-end">
              <Clock className="text-warning mb-2" size={window.innerWidth < 768 ? 24 : 32} />
              <h4 className="fs-5 fs-md-4">{stats.pendingAppointments}</h4>
              <small className="d-block">Pending</small>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 p-md-3 border-end">
              <Activity className="text-info mb-2" size={window.innerWidth < 768 ? 24 : 32} />
              <h4 className="fs-5 fs-md-4">{stats.scheduledAppointments}</h4>
              <small className="d-block">Scheduled</small>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 p-md-3 border-end">
              <CheckCircle className="text-success mb-2" size={window.innerWidth < 768 ? 24 : 32} />
              <h4 className="fs-5 fs-md-4">{stats.completedAppointments}</h4>
              <small className="d-block">Completed</small>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 p-md-3">
              <DollarSign className="text-primary mb-2" size={window.innerWidth < 768 ? 24 : 32} />
              <h4 className="fs-5 fs-md-4">{stats.revenue}</h4>
              <small className="d-block">Revenue</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// RecentAppointments Component
function RecentAppointments({ appointments }) {
  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-warning text-dark",
      scheduled: "bg-info",
      confirmed: "bg-primary",
      "in-progress": "bg-secondary",
      completed: "bg-success",
      declined: "bg-danger",
      cancelled: "bg-dark"
    };
    return badges[status] || "bg-secondary";
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-0 py-3">
        <h5 className="fw-bold mb-0 fs-6 fs-md-5">Recent Appointments</h5>
      </div>
      <div className="card-body p-2 p-md-3" style={{ maxHeight: "160px", overflowY: "auto" }}>
        {appointments.length === 0 ? (
          <p className="text-muted text-center py-3">No appointments yet</p>
        ) : (
          appointments.map((appointment) => (
            <div key={appointment._id} className="p-2 border rounded-3 mb-2 bg-light">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1 pe-2">
                  <strong className="d-block mb-1 small">
                    {appointment.petId?.name || appointment.petName || "Unknown Pet"}
                  </strong>
                  <p className="text-muted mb-1 small" style={{fontSize: '0.75rem'}}>
                    Owner: {appointment.ownerId?.name || "N/A"}
                  </p>
                  {appointment.vetId && (
                    <p className="text-muted mb-1 small" style={{fontSize: '0.75rem'}}>
                      Vet: {appointment.vetId.name}
                    </p>
                  )}
                  {appointment.appointmentDate && (
                    <p className="text-muted mb-0 small" style={{fontSize: '0.75rem'}}>
                      {new Date(appointment.appointmentDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className={`badge ${getStatusBadge(appointment.status)} text-nowrap`} style={{fontSize: '0.7rem'}}>
                  {appointment.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// VetApprovals Component
function VetApprovals({ pendingVets, handleApprove, handleReject, loading }) {
  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 py-3">
          <h5 className="mb-0 fw-bold fs-6 fs-md-5">Pending Veterinarian Approvals</h5>
        </div>
        <div className="card-body text-center py-5">
          <Loader className="text-primary" />
          <p className="mt-2">Loading pending vets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-0 py-3">
        <h5 className="mb-0 fw-bold fs-6 fs-md-5">
          Pending Veterinarian Approvals
          {pendingVets.length > 0 && (
            <span className="badge bg-warning text-dark ms-2">{pendingVets.length}</span>
          )}
        </h5>
      </div>
      <div className="card-body p-2 p-md-3">
        {pendingVets.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <CheckCircle size={48} className="mb-2 text-success" />
            <p>No pending veterinarian approvals</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="d-none d-lg-block">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>License</th>
                      <th>Specialization</th>
                      <th>Experience</th>
                      <th>Clinic</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingVets.map((vet) => (
                      <tr key={vet._id}>
                        <td>{vet.name}</td>
                        <td>{vet.email}</td>
                        <td>{vet.licenseNumber || "N/A"}</td>
                        <td>{vet.specialization || "N/A"}</td>
                        <td>{vet.experience ? `${vet.experience} years` : "N/A"}</td>
                        <td>{vet.clinicName || "N/A"}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprove(vet)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleReject(vet)}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="d-lg-none">
              {pendingVets.map((vet) => (
                <div key={vet._id} className="card mb-3 border">
                  <div className="card-body p-3">
                    <div className="mb-3">
                      <h6 className="fw-bold mb-2">{vet.name}</h6>
                      <div className="row g-2">
                        <div className="col-12">
                          <small className="text-muted d-block">
                            <strong>Email:</strong> {vet.email}
                          </small>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">
                            <strong>License:</strong> {vet.licenseNumber || "N/A"}
                          </small>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">
                            <strong>Experience:</strong> {vet.experience ? `${vet.experience} yrs` : "N/A"}
                          </small>
                        </div>
                        <div className="col-12">
                          <small className="text-muted d-block">
                            <strong>Specialization:</strong> {vet.specialization || "N/A"}
                          </small>
                        </div>
                        <div className="col-12">
                          <small className="text-muted d-block">
                            <strong>Clinic:</strong> {vet.clinicName || "N/A"}
                          </small>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-success flex-fill"
                        onClick={() => handleApprove(vet)}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="btn btn-sm btn-danger flex-fill"
                        onClick={() => handleReject(vet)}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Main AdminDashboard Component
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVets: 0,
    totalOwners: 0,
    totalPets: 0,
    totalConsultations: 0,
    pendingAppointments: 0,
    scheduledAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    revenue: "₹0"
  });

  const [pendingVets, setPendingVets] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [modalState, setModalState] = useState({
    show: false,
    type: "success",
    title: "",
    message: ""
  });

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    vet: null
  });

  const [rejectModal, setRejectModal] = useState({
    show: false,
    vet: null
  });

  const API_BASE_URL = "http://localhost:5000/api";

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const showModal = (type, title, message) => {
    setModalState({ show: true, type, title, message });
  };

  const closeModal = () => {
    setModalState({ show: false, type: "success", title: "", message: "" });
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching dashboard data...");

      // 1. Fetch all users
      const usersRes = await fetch(`${API_BASE_URL}/users`);
      if (!usersRes.ok) throw new Error(`Users API failed: ${usersRes.status}`);
      const usersData = await usersRes.json();
      
      let users = [];
      if (Array.isArray(usersData)) {
        users = usersData;
      } else if (usersData.users && Array.isArray(usersData.users)) {
        users = usersData.users;
      } else if (usersData.success && usersData.users) {
        users = usersData.users;
      }
      
      console.log("Users fetched:", users.length);

      // 2. Fetch all pets
      let pets = [];
      try {
        const petsRes = await fetch(`${API_BASE_URL}/pets`);
        if (petsRes.ok) {
          const petsData = await petsRes.json();
          pets = petsData.pets || petsData || [];
          console.log("Pets fetched:", pets.length);
        }
      } catch (e) {
        console.log("Pets endpoint error:", e.message);
      }

      // 3. Fetch all consultations
      let consultations = [];
      try {
        const consultationsRes = await fetch(`${API_BASE_URL}/consultations`);
        if (consultationsRes.ok) {
          const consultationsData = await consultationsRes.json();
          consultations = consultationsData.appointments || consultationsData || [];
          console.log("Consultations fetched:", consultations.length);
        }
      } catch (e) {
        console.log("Consultations endpoint error:", e.message);
      }

      // 4. Calculate revenue from paid consultations
      let totalRevenue = 0;
      consultations.forEach(consultation => {
        if (consultation.isPaid && consultation.paymentAmount) {
          totalRevenue += consultation.paymentAmount;
        }
      });
      
      // Filter users by role
      const pendingVetsList = users.filter(
        (user) => user.role === "vet" && user.isApproved === false
      );

      const approvedVets = users.filter(
        (user) => user.role === "vet" && user.isApproved === true
      );
      
      const owners = users.filter((user) => user.role === "owner");

      console.log("Stats calculated:", {
        totalUsers: users.length,
        pendingVets: pendingVetsList.length,
        approvedVets: approvedVets.length,
        owners: owners.length,
        pets: pets.length,
        consultations: consultations.length
      });

      // Count appointments by status
      const pendingCount = consultations.filter((c) => c.status === "pending").length;
      const scheduledCount = consultations.filter((c) => c.status === "scheduled").length;
      const confirmedCount = consultations.filter((c) => c.status === "confirmed").length;
      const completedCount = consultations.filter((c) => c.status === "completed").length;

      console.log("Appointment counts:", {
        pending: pendingCount,
        scheduled: scheduledCount,
        confirmed: confirmedCount,
        completed: completedCount
      });

      // Get recent appointments (last 10)
      const recent = [...consultations]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

      setStats({
        totalUsers: users.length,
        totalVets: approvedVets.length,
        totalOwners: owners.length,
        totalPets: pets.length,
        totalConsultations: consultations.length,
        pendingAppointments: pendingCount,
        scheduledAppointments: scheduledCount,
        confirmedAppointments: confirmedCount,
        completedAppointments: completedCount,
        revenue: `₹${totalRevenue.toLocaleString()}`
      });

      setPendingVets(pendingVetsList);
      setRecentAppointments(recent);
      setLoading(false);
      
      console.log("Dashboard data loaded successfully");
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
      setLoading(false);
    }
  };

  const handleApprove = (vet) => {
    setConfirmModal({ show: true, vet });
  };

  const confirmApprove = async () => {
    const vet = confirmModal.vet;
    setConfirmModal({ show: false, vet: null });

    try {
      console.log("Approving vet:", vet._id);
      
      const response = await fetch(`${API_BASE_URL}/users/approve/${vet._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log("Approve response:", data);
      
      if (response.ok && data.success) {
        showModal(
          "success",
          "Veterinarian Approved",
          `${vet.name} has been approved and can now access the system.`
        );
        fetchDashboardData();
      } else {
        throw new Error(data.message || 'Failed to approve vet');
      }
    } catch (err) {
      console.error("Error approving vet:", err);
      showModal(
        "error",
        "Approval Failed",
        `Failed to approve veterinarian: ${err.message}`
      );
    }
  };

  const handleReject = (vet) => {
    setRejectModal({ show: true, vet });
  };

  const confirmReject = async (reason) => {
    const vet = rejectModal.vet;
    setRejectModal({ show: false, vet: null });

    try {
      console.log("Rejecting vet:", vet._id, "Reason:", reason);
      
      const response = await fetch(`${API_BASE_URL}/users/reject/${vet._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      
      const data = await response.json();
      console.log("Reject response:", data);
      
      if (response.ok && data.success) {
        showModal(
          "success",
          "Application Rejected",
          `${vet.name}'s application has been rejected.`
        );
        fetchDashboardData();
      } else {
        throw new Error(data.message || 'Failed to reject vet');
      }
    } catch (err) {
      console.error("Error rejecting vet:", err);
      showModal(
        "error",
        "Rejection Failed",
        `Failed to reject veterinarian: ${err.message}`
      );
    }
  };

  if (loading) {
    return (
      <AppLayout title="Admin Dashboard" role="admin">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading dashboard...</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Admin Dashboard" role="admin">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <AlertCircle className="me-2" />
          <div>{error}</div>
        </div>
        <button className="btn btn-primary" onClick={fetchDashboardData}>
          Retry
        </button>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Admin Dashboard" role="admin">
      {/* Modals */}
      <Modal
        show={modalState.show}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />

      <ConfirmModal
        show={confirmModal.show}
        onClose={() => setConfirmModal({ show: false, vet: null })}
        onConfirm={confirmApprove}
        title="Approve Veterinarian"
        message={`Are you sure you want to approve ${confirmModal.vet?.name}'s registration?`}
        confirmText="Approve"
      />

      <RejectModal
        show={rejectModal.show}
        onClose={() => setRejectModal({ show: false, vet: null })}
        onConfirm={confirmReject}
        vetName={rejectModal.vet?.name}
      />

      {/* Refresh Button */}
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-outline-primary btn-sm" onClick={fetchDashboardData}>
          <span className="d-none d-sm-inline">🔄 Refresh Data</span>
          <span className="d-sm-none">🔄</span>
        </button>
      </div>

      {/* Top Stats */}
      <div className="row g-3 mb-4">
        <StatCard icon={<User />} label="Total Users" value={stats.totalUsers} color="primary" />
        <StatCard icon={<Stethoscope />} label="Veterinarians" value={stats.totalVets} color="success" />
        <StatCard icon={<PawPrint />} label="Total Pets" value={stats.totalPets} color="warning" />
        <StatCard icon={<Activity />} label="Consultations" value={stats.totalConsultations} color="info" />
      </div>

      {/* System Activity + Recent Appointments */}
      <div className="row g-3 g-md-4 mb-4">
        <div className="col-12 col-lg-8">
          <SystemActivity stats={stats} />
        </div>
        <div className="col-12 col-lg-4">
          <RecentAppointments appointments={recentAppointments} />
        </div>
      </div>

      {/* Veterinarian Approvals */}
      <div className="row">
        <div className="col-12">
          <VetApprovals
            pendingVets={pendingVets}
            handleApprove={handleApprove}
            handleReject={handleReject}
            loading={false}
          />
        </div>
      </div>
    </AppLayout>
  );
}