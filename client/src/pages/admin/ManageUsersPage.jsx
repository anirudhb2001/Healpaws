import React, { useState, useEffect } from 'react'
import { Eye, Trash2, UserCheck, UserX, RefreshCw, AlertCircle } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'

const API_URL = 'http://localhost:5000/api'

export default function ManageUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [filter, setFilter] = useState('all') // all, owner, vet, pending
  const [selectedUser, setSelectedUser] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch(`${API_URL}/users`)
      const data = await response.json()

      if (Array.isArray(data)) {
        setUsers(data)
      } else if (data.users && Array.isArray(data.users)) {
        setUsers(data.users)
      } else {
        setError('Invalid data format received')
      }
    } catch (err) {
      setError('Failed to fetch users: ' + err.message)
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveVet = async (userId) => {
    if (!confirm('Are you sure you want to approve this veterinarian?')) return

    try {
      setActionLoading(userId)
      const response = await fetch(`${API_URL}/users/approve/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (data.success) {
        alert('Veterinarian approved successfully!')
        fetchUsers()
      } else {
        alert('Failed to approve: ' + data.message)
      }
    } catch (err) {
      alert('Error approving veterinarian: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectVet = async (userId) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    try {
      setActionLoading(userId)
      const response = await fetch(`${API_URL}/users/reject/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })

      const data = await response.json()

      if (data.success) {
        alert('Veterinarian rejected successfully!')
        fetchUsers()
      } else {
        alert('Failed to reject: ' + data.message)
      }
    } catch (err) {
      alert('Error rejecting veterinarian: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewDetails = (user) => {
    setSelectedUser(user)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedUser(null)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'admin': return 'bg-danger'
      case 'vet': return 'bg-info'
      case 'owner': return 'bg-primary'
      default: return 'bg-secondary'
    }
  }

  const getStatusBadge = (user) => {
    if (user.role === 'vet' && !user.isApproved) {
      return <span className="badge bg-warning">Pending Approval</span>
    }
    return <span className="badge bg-success">Active</span>
  }

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true
    if (filter === 'owner') return user.role === 'owner'
    if (filter === 'vet') return user.role === 'vet' && user.isApproved
    if (filter === 'pending') return user.role === 'vet' && !user.isApproved
    return true
  })

  if (loading) {
    return (
      <AppLayout title="Manage Users" role="admin">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading users...</p>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="Manage Users" role="admin">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <AlertCircle className="me-2" size={20} />
          <div>{error}</div>
        </div>
        <button className="btn btn-primary" onClick={fetchUsers}>
          <RefreshCw size={16} className="me-2" />
          Retry
        </button>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Manage Users" role="admin">
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="mb-0">All Users ({filteredUsers.length})</h5>
              <small className="text-muted">Manage pet owners and veterinarians</small>
            </div>
            <div className="btn-group" role="group">
              <button 
                className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilter('all')}
              >
                All ({users.length})
              </button>
              <button 
                className={`btn btn-sm ${filter === 'owner' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilter('owner')}
              >
                Owners ({users.filter(u => u.role === 'owner').length})
              </button>
              <button 
                className={`btn btn-sm ${filter === 'vet' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilter('vet')}
              >
                Vets ({users.filter(u => u.role === 'vet' && u.isApproved).length})
              </button>
              <button 
                className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilter('pending')}
              >
                Pending ({users.filter(u => u.role === 'vet' && !u.isApproved).length})
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {user.profilePicture ? (
                            <img 
                              src={`${API_URL.replace('/api', '')}/${user.profilePicture}`} 
                              alt={user.name}
                              className="rounded-circle me-2"
                              style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2"
                                 style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="fw-medium">{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-muted small">
                        {user.city}, {user.state}<br/>
                        {user.country}
                      </td>
                      <td>{user.mobileno || 'N/A'}</td>
                      <td className="text-muted small">{formatDate(user.createdAt)}</td>
                      <td>{getStatusBadge(user)}</td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          <button 
                            className="btn btn-outline-primary"
                            title="View Details"
                            onClick={() => handleViewDetails(user)}
                          >
                            <Eye size={14} />
                          </button>
                          
                          {user.role === 'vet' && !user.isApproved && (
                            <>
                              <button 
                                className="btn btn-outline-success"
                                title="Approve Veterinarian"
                                onClick={() => handleApproveVet(user._id)}
                                disabled={actionLoading === user._id}
                              >
                                {actionLoading === user._id ? (
                                  <span className="spinner-border spinner-border-sm" />
                                ) : (
                                  <UserCheck size={14} />
                                )}
                              </button>
                              <button 
                                className="btn btn-outline-danger"
                                title="Reject Veterinarian"
                                onClick={() => handleRejectVet(user._id)}
                                disabled={actionLoading === user._id}
                              >
                                <UserX size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <>
          <div 
            className="modal fade show d-block" 
            tabIndex="-1" 
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={closeModal}
          >
            <div 
              className="modal-dialog modal-dialog-centered modal-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title">User Details</h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={closeModal}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-4 text-center mb-4">
                      {selectedUser.profilePicture ? (
                        <img 
                          src={`${API_URL.replace('/api', '')}/${selectedUser.profilePicture}`} 
                          alt={selectedUser.name}
                          className="rounded-circle mb-3"
                          style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center mx-auto mb-3"
                          style={{ width: '150px', height: '150px', fontSize: '48px' }}
                        >
                          {selectedUser.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className={`badge ${getRoleBadgeClass(selectedUser.role)} fs-6`}>
                        {selectedUser.role.toUpperCase()}
                      </span>
                    </div>

                    <div className="col-md-8">
                      <h4 className="mb-3">{selectedUser.name}</h4>
                      
                      <div className="mb-4">
                        <h6 className="text-muted mb-3">Contact Information</h6>
                        <div className="row g-3">
                          <div className="col-6">
                            <strong>Email:</strong>
                            <p className="mb-0">{selectedUser.email}</p>
                          </div>
                          <div className="col-6">
                            <strong>Phone:</strong>
                            <p className="mb-0">{selectedUser.mobileno || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h6 className="text-muted mb-3">Location</h6>
                        <div className="row g-3">
                          <div className="col-4">
                            <strong>City:</strong>
                            <p className="mb-0">{selectedUser.city}</p>
                          </div>
                          <div className="col-4">
                            <strong>State:</strong>
                            <p className="mb-0">{selectedUser.state}</p>
                          </div>
                          <div className="col-4">
                            <strong>Country:</strong>
                            <p className="mb-0">{selectedUser.country}</p>
                          </div>
                        </div>
                      </div>

                      {selectedUser.role === 'vet' && (
                        <div className="mb-4">
                          <h6 className="text-muted mb-3">Professional Information</h6>
                          <div className="row g-3">
                            <div className="col-6">
                              <strong>License Number:</strong>
                              <p className="mb-0">{selectedUser.licenseNumber || 'N/A'}</p>
                            </div>
                            <div className="col-6">
                              <strong>Specialization:</strong>
                              <p className="mb-0">{selectedUser.specialization || 'N/A'}</p>
                            </div>
                            <div className="col-6">
                              <strong>Experience:</strong>
                              <p className="mb-0">{selectedUser.experience ? `${selectedUser.experience} years` : 'N/A'}</p>
                            </div>
                            <div className="col-6">
                              <strong>Clinic Name:</strong>
                              <p className="mb-0">{selectedUser.clinicName || 'N/A'}</p>
                            </div>
                          </div>

                          {(selectedUser.idProof || selectedUser.degreeCertificate) && (
                            <div className="mt-3">
                              <strong>Documents:</strong>
                              <div className="mt-2">
                                {selectedUser.idProof && (
                                  <a 
                                    href={`${API_URL.replace('/api', '')}/${selectedUser.idProof}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary me-2"
                                  >
                                    View ID Proof
                                  </a>
                                )}
                                {selectedUser.degreeCertificate && (
                                  <a 
                                    href={`${API_URL.replace('/api', '')}/${selectedUser.degreeCertificate}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    View Degree Certificate
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mb-3">
                        <h6 className="text-muted mb-3">Account Information</h6>
                        <div className="row g-3">
                          <div className="col-6">
                            <strong>Status:</strong>
                            <p className="mb-0">{getStatusBadge(selectedUser)}</p>
                          </div>
                          <div className="col-6">
                            <strong>Joined:</strong>
                            <p className="mb-0">{formatDate(selectedUser.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  {selectedUser.role === 'vet' && !selectedUser.isApproved && (
                    <>
                      <button 
                        className="btn btn-success"
                        onClick={() => {
                          handleApproveVet(selectedUser._id)
                          closeModal()
                        }}
                        disabled={actionLoading === selectedUser._id}
                      >
                        <UserCheck size={16} className="me-2" />
                        Approve Veterinarian
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => {
                          handleRejectVet(selectedUser._id)
                          closeModal()
                        }}
                        disabled={actionLoading === selectedUser._id}
                      >
                        <UserX size={16} className="me-2" />
                        Reject
                      </button>
                    </>
                  )}
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}