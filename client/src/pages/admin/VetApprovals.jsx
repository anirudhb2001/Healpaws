import React, { useEffect, useState } from "react";
import {
  Stethoscope,
  Mail,
  Phone,
  MapPin,
  Award,
  FileText,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function VetApprovals() {
  const [pendingVets, setPendingVets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch pending vets from DB
  const fetchPendingVets = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/users");
      const data = await res.json();
      
      const vets = data.filter(
        (u) => u.role === "vet" && u.isApproved === false
      );

      setPendingVets(vets);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching vets:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVets();
  }, []);

  // Approve vet
  const handleApprove = async (vet) => {
  const confirm = window.confirm(`Approve ${vet.name}'s registration?`);
  if (!confirm) return;

  try {
    const res = await fetch(`http://localhost:5000/api/users/approve/${vet._id}`, {
      method: "PUT"
    });

    const data = await res.json();

    console.log("APPROVE RESPONSE:", data);

    if (data.success) {
      alert("Vet approved successfully");
      fetchPendingVets();
    } else {
      alert("Error: " + data.message);
    }
  } catch (err) {
    console.error("Approve error:", err);
    alert("Something went wrong. Check console.");
  }
};


  // Reject vet
  const handleReject = async (vet) => {
    const reason = window.prompt(
      `Enter reason for rejecting ${vet.name}'s application:`
    );
    if (!reason) return;

    try {
      const res = await fetch(`http://localhost:5000/api/users/reject/${vet._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Vet rejected");
        fetchPendingVets();
      }
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  if (loading) {
    return (
      <div className="card p-4 text-center">
        <div>Loading pending veterinarians...</div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-0 py-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h5 className="mb-1 fw-bold">Veterinarian Approvals</h5>
            <p className="text-muted mb-0 small">
              Review and approve veterinarian registrations
            </p>
          </div>
          <div className="d-flex align-items-center gap-2 px-3 py-2 bg-warning bg-opacity-10 rounded">
            <Clock size={20} className="text-warning" />
            <span className="fw-semibold text-warning">
              {pendingVets.length} Pending
            </span>
          </div>
        </div>
      </div>

      <div className="card-body">
        {pendingVets.length === 0 ? (
          <div className="text-center py-5">
            <CheckCircle size={48} className="text-success mb-3" />
            <h5 className="fw-bold mb-2">All Caught Up!</h5>
            <p className="text-muted">
              No pending veterinarian applications at the moment.
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {pendingVets.map((vet) => (
              <div key={vet._id} className="col-lg-4 col-md-6">
                <div className="card border h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-3 pb-3 border-bottom mb-3">
                      <div
                        style={{ width: "48px", height: "48px" }}
                        className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0"
                      >
                        <Stethoscope size={20} className="text-success" />
                      </div>
                      <div className="flex-fill min-w-0">
                        <h6 className="mb-1 fw-bold text-truncate">{vet.name}</h6>
                        <span className="badge bg-warning bg-opacity-10 text-warning d-inline-flex align-items-center gap-1">
                          <Clock size={12} /> Pending
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="d-flex align-items-center gap-2 mb-2 small">
                        <Mail size={14} className="text-muted flex-shrink-0" />
                        <span className="text-truncate">{vet.email}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2 mb-2 small">
                        <Phone size={14} className="text-muted flex-shrink-0" />
                        <span>{vet.mobileno}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2 mb-2 small">
                        <MapPin size={14} className="text-muted flex-shrink-0" />
                        <span>
                          {vet.city}, {vet.state}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2 mb-2 small">
                        <Award size={14} className="text-muted flex-shrink-0" />
                        <span className="text-truncate">{vet.licenseNumber}</span>
                      </div>
                      <div className="d-flex align-items-start gap-2 small">
                        <FileText
                          size={14}
                          className="text-muted flex-shrink-0 mt-1"
                        />
                        <span className="text-truncate">{vet.specialization}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-top mb-3">
                      <div className="text-success fw-medium small mb-1">
                        {vet.experience} experience
                      </div>
                      <div className="text-muted small text-truncate mb-1">
                        {vet.clinicName}
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        onClick={() => handleApprove(vet)}
                        className="btn btn-success flex-fill d-flex align-items-center justify-content-center gap-1 py-2"
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(vet)}
                        className="btn btn-danger flex-fill d-flex align-items-center justify-content-center gap-1 py-2"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
