import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, RefreshCw, Filter, Plus, Edit2, Trash2, CheckCircle, MoreVertical } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function DiseaseOutbreakPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  const [filterStatus, setFilterStatus] = useState('active');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterArea, setFilterArea] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModal, setMessageModal] = useState({ type: '', message: '' });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const [openDropdown, setOpenDropdown] = useState(null);

  const [formData, setFormData] = useState({
    disease: '',
    area: '',
    cases: '',
    severity: 'medium',
    species: 'all',
    status: 'active',
    description: '',
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Show message modal
  const showMessage = (type, message) => {
    setMessageModal({ type, message });
    setShowMessageModal(true);
  };

  // Show confirm modal
  const showConfirm = (action) => {
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterSeverity) params.append('severity', filterSeverity);
      if (filterArea) params.append('area', filterArea);

      const res = await fetch(`${API_URL}/api/disease-alerts?${params.toString()}`);
      const data = await res.json();

      if (data.success) setAlerts(data.alerts);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load disease alerts');
    } finally {
      setLoading(false);
    }
  };

  // Generate alerts
  const generateAlerts = async () => {
    try {
      setGenerating(true);

      const res = await fetch(`${API_URL}/api/disease-alerts/generate`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        showMessage('success', `Successfully generated ${data.alerts.length} alerts`);
        fetchAlerts();
      }
    } catch (err) {
      console.error('Error generating alerts:', err);
      showMessage('error', 'Failed to generate alerts');
    } finally {
      setGenerating(false);
    }
  };

  // Create or update alert
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let url = `${API_URL}/api/disease-alerts`;
      let method = 'POST';

      if (editingAlert) {
        url = `${API_URL}/api/disease-alerts/${editingAlert._id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        showMessage('success', editingAlert ? 'Alert updated successfully' : 'Alert created successfully');
        setShowCreateModal(false);
        setEditingAlert(null);
        fetchAlerts();
      }

      setFormData({
        disease: '',
        area: '',
        cases: '',
        severity: 'medium',
        species: 'all',
        status: 'active',
        description: '',
      });
    } catch (err) {
      console.error('Error saving alert:', err);
      showMessage('error', 'Failed to save alert');
    }
  };

  // Delete alert
  const handleDelete = async (id) => {
    setOpenDropdown(null);
    showConfirm(async () => {
      try {
        await fetch(`${API_URL}/api/disease-alerts/${id}`, { method: 'DELETE' });
        showMessage('success', 'Alert deleted successfully');
        fetchAlerts();
      } catch (err) {
        console.error('Error deleting alert:', err);
        showMessage('error', 'Failed to delete alert');
      }
    });
  };

  // Resolve alert
  const handleResolve = async (id) => {
    setOpenDropdown(null);
    try {
      await fetch(`${API_URL}/api/disease-alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });

      showMessage('success', 'Alert marked as resolved');
      fetchAlerts();
    } catch (err) {
      console.error('Error resolving alert:', err);
      showMessage('error', 'Failed to resolve alert');
    }
  };

  const handleEdit = (alert) => {
    setOpenDropdown(null);
    setEditingAlert(alert);
    setFormData({
      disease: alert.disease,
      area: alert.area,
      cases: alert.cases,
      severity: alert.severity,
      species: alert.species || 'all',
      status: alert.status || 'active',
      description: alert.description || '',
    });
    setShowCreateModal(true);
  };

  useEffect(() => {
    fetchAlerts();
  }, [filterStatus, filterSeverity, filterArea]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'danger';
      case 'monitoring': return 'warning';
      case 'resolved': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <AppLayout title="Disease Outbreak Alerts" role="admin">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <p className="text-muted mb-0">Track and manage disease outbreaks in your area</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary"
            onClick={generateAlerts}
            disabled={generating}
          >
            <RefreshCw size={16} className={generating ? 'spin' : ''} />
            {generating ? ' Generating...' : ' Auto-Generate Alerts'}
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setEditingAlert(null);
              setFormData({
                disease: '',
                area: '',
                cases: '',
                severity: 'medium',
                species: 'all',
                status: 'active',
                description: '',
              });
              setShowCreateModal(true);
            }}
          >
            <Plus size={16} /> Create Alert
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label small fw-bold">Status</label>
              <select 
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="monitoring">Monitoring</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label small fw-bold">Severity</label>
              <select 
                className="form-select"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
              >
                <option value="">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-bold">Area</label>
              <input 
                type="text"
                className="form-control"
                placeholder="Search by area..."
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading disease alerts...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertTriangle size={20} className="me-2" />
          {error}
        </div>
      )}

      {/* Alerts */}
      {!loading && !error && (
        <>
          {alerts.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <AlertTriangle size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No disease alerts found</h5>
                <p className="text-muted mb-3">
                  Try adjusting your filters or generate alerts from consultation data
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={generateAlerts}
                  disabled={generating}
                >
                  <RefreshCw size={16} /> Generate Alerts
                </button>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {alerts.map(alert => (
                <div key={alert._id} className="col-md-6 col-lg-4">
                  <div className={`card border-0 shadow-sm h-100 border-start border-5 border-${getSeverityColor(alert.severity)}`}>
                    <div className="card-body">
                      
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="d-flex align-items-center">
                          <AlertTriangle 
                            className={`me-2 text-${getSeverityColor(alert.severity)}`} 
                            size={24} 
                          />
                          <h5 className="fw-bold mb-0">{alert.disease}</h5>
                        </div>

                        {/* Three Dot Menu - Click to Edit/Delete/Resolve */}
                        <div className="dropdown-container" style={{ position: 'relative' }}>
                          <button 
                            className="btn btn-sm btn-light"
                            onClick={() => setOpenDropdown(openDropdown === alert._id ? null : alert._id)}
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {openDropdown === alert._id && (
                            <div 
                              className="dropdown-menu show" 
                              style={{ 
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                zIndex: 1000,
                                minWidth: '160px'
                              }}
                            >
                              <button 
                                className="dropdown-item" 
                                onClick={() => handleEdit(alert)}
                              >
                                <Edit2 size={14} className="me-2" /> Edit
                              </button>

                              {alert.status === 'active' && (
                                <button 
                                  className="dropdown-item"
                                  onClick={() => handleResolve(alert._id)}
                                >
                                  <CheckCircle size={14} className="me-2" /> Mark Resolved
                                </button>
                              )}

                              <hr className="dropdown-divider" />

                              <button 
                                className="dropdown-item text-danger"
                                onClick={() => handleDelete(alert._id)}
                              >
                                <Trash2 size={14} className="me-2" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-muted mb-1"><strong>Area:</strong> {alert.area}</p>
                        <p className="text-muted mb-1"><strong>Cases:</strong> {alert.cases}</p>
                        <p className="text-muted mb-1"><strong>Species:</strong> {alert.species.charAt(0).toUpperCase() + alert.species.slice(1)}</p>
                        <p className="text-muted mb-1"><strong>Date:</strong> {new Date(alert.createdAt).toLocaleDateString()}</p>
                        {alert.description && (
                          <p className="text-muted small mt-2">{alert.description}</p>
                        )}
                      </div>

                      <div className="d-flex gap-2">
                        <span className={`badge bg-${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className={`badge bg-${getStatusColor(alert.status)}`}>
                          {alert.status.toUpperCase()}
                        </span>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">

              <div className="modal-header">
                <h5 className="modal-title">
                  {editingAlert ? 'Edit Disease Alert' : 'Create Disease Alert'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAlert(null);
                  }}
                ></button>
              </div>

              <div className="modal-body">
                
                <div className="mb-3">
                  <label className="form-label">Disease Name *</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={formData.disease}
                    onChange={(e) => setFormData({...formData, disease: e.target.value})}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Area/Location *</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    required
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Number of Cases *</label>
                    <input 
                      type="number"
                      className="form-control"
                      min="1"
                      value={formData.cases}
                      onChange={(e) => setFormData({...formData, cases: e.target.value})}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Severity *</label>
                    <select 
                      className="form-select"
                      value={formData.severity}
                      onChange={(e) => setFormData({...formData, severity: e.target.value})}
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Species Affected</label>
                    <select 
                      className="form-select"
                      value={formData.species}
                      onChange={(e) => setFormData({...formData, species: e.target.value})}
                    >
                      <option value="all">All Species</option>
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                      <option value="cow">Cow</option>
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Status *</label>
                    <select 
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      required
                    >
                      <option value="active">Active</option>
                      <option value="monitoring">Monitoring</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-control"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Additional information about the outbreak..."
                  ></textarea>
                </div>

              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAlert(null);
                  }}
                >
                  Cancel
                </button>

                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSubmit}
                >
                  {editingAlert ? 'Update Alert' : 'Create Alert'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Message Modal (Success/Error) */}
      {showMessageModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className={`modal-header bg-${messageModal.type === 'success' ? 'success' : 'danger'} text-white`}>
                <h5 className="modal-title">
                  {messageModal.type === 'success' ? 'Success' : 'Error'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={() => setShowMessageModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">{messageModal.message}</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowMessageModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Action</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowConfirmModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">Are you sure you want to delete this alert?</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={() => {
                    setShowConfirmModal(false);
                    if (confirmAction) confirmAction();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

    </AppLayout>
  );
}