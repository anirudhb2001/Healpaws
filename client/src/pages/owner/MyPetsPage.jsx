import React, { useState, useEffect } from 'react'
import { PawPrint, Stethoscope, FileText, Edit } from 'lucide-react'
import AddPetPage from './AddPetPage'
import AppLayout from '../layouts/AppLayout'
import { Link, useNavigate } from "react-router-dom";

export default function MyPetsPage() {
  const [currentView, setCurrentView] = useState('list') // "list" or "add" or "edit"
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingPet, setEditingPet] = useState(null)
  const navigate = useNavigate()

  // Fetch pets from backend
  const fetchPets = async () => {
    try {
      setLoading(true)
      setError('')

      // Get ownerId from localStorage
      const userData = JSON.parse(localStorage.getItem('healpaws_user'))
      const ownerId = userData?._id || userData?.id

      if (!ownerId) {
        setError('User not logged in')
        setLoading(false)
        return
      }

      const response = await fetch(`http://localhost:5000/api/pets/owner/${ownerId}`)
      const data = await response.json()

      if (data.success) {
        setPets(data.pets)
      } else {
        setError(data.message || 'Failed to fetch pets')
      }
    } catch (error) {
      console.error('Error fetching pets:', error)
      setError('Failed to load pets. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch pets on component mount
  useEffect(() => {
    fetchPets()
  }, [])

  // Callback to refresh pets list after adding new pet
  const handlePetAdded = () => {
    setCurrentView('list')
    setEditingPet(null)
    fetchPets() // Refresh the list
  }

  // Handle View Records click - navigate to health records page
  const handleViewRecords = (pet) => {
    navigate('/app/owner/health-records', { 
      state: { 
        petId: pet._id, 
        petName: pet.name 
      } 
    })
  }

  // Handle Edit Pet click
  const handleEditPet = (pet) => {
    setEditingPet(pet)
    setCurrentView('edit')
  }

  // When Add Pet is clicked, show the AddPetPage inside the same layout
  if (currentView === 'add') {
    return (
      <AppLayout title="Add New Pet" role="owner">
        <AddPetPage navigateBack={handlePetAdded} />
      </AppLayout>
    )
  }

  // When Edit Pet is clicked, show the AddPetPage with pet data
  if (currentView === 'edit') {
    return (
      <AppLayout title="Edit Pet" role="owner">
        <AddPetPage navigateBack={handlePetAdded} petData={editingPet} />
      </AppLayout>
    )
  }

  return (
    <AppLayout title="My Pets" role="owner">
      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading your pets...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Pets Grid */}
      {!loading && !error && (
        <div className="row g-4">
          {pets.map(pet => (
            <div key={pet._id} className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  {/* Pet Photo */}
                  {pet.petPhoto ? (
                    <div className="mb-3">
                      <img
                        src={`http://localhost:5000/${pet.petPhoto}`}
                        alt={pet.name}
                        style={{
                          width: '120px',
                          height: '120px',
                          objectFit: 'cover',
                          borderRadius: '50%',
                          border: '3px solid #55db79'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="mb-3">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-circle"
                        style={{
                          width: '120px',
                          height: '120px',
                          backgroundColor: '#e2f0ecff',
                          fontSize: '48px'
                        }}
                      >
                        {pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐈' : pet.species === 'bird' ? '🐦' : '🐰'}
                      </div>
                    </div>
                  )}

                  <h4 className="fw-bold mb-2">{pet.name}</h4>
                  <p className="text-muted mb-1">{pet.breed}</p>
                  <p className="text-muted small mb-3">{pet.species.charAt(0).toUpperCase() + pet.species.slice(1)} • {pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)}</p>

                  <div className="row text-center mb-3">
                    <div className="col-6">
                      <small className="text-muted d-block">Age</small>
                      <strong>{pet.age ? `${pet.age} years` : 'N/A'}</strong>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Weight</small>
                      <strong>{pet.weight} kg</strong>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {(pet.allergies || pet.medications) && (
                    <div className="mb-3 text-start">
                      {pet.allergies && (
                        <small className="text-muted d-block">
                          <strong>Allergies:</strong> {pet.allergies}
                        </small>
                      )}
                      {pet.medications && (
                        <small className="text-muted d-block">
                          <strong>Medications:</strong> {pet.medications}
                        </small>
                      )}
                    </div>
                  )}

                  <div className="d-grid gap-2">
                    <Link
                      to="/app/owner/submit"
                      state={{ pet }}
                      className="btn btn-success"
                    >
                      <Stethoscope size={16} className="me-2" /> Submit Symptoms
                    </Link>
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => handleViewRecords(pet)}
                    >
                      <FileText size={16} className="me-2" />
                      View Records
                    </button>
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={() => handleEditPet(pet)}
                    >
                      <Edit size={16} className="me-2" /> Edit Pet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Pet Card */}
          <div className="col-md-6 col-lg-4">
            <div
              className="card border-0 shadow-sm h-100"
              style={{ border: '2px dashed #198754', cursor: 'pointer' }}
              onClick={() => setCurrentView('add')}
            >
              <div className="card-body d-flex flex-column align-items-center justify-content-center text-center">
                <PawPrint size={64} className="text-success mb-3" />
                <h5 className="fw-bold mb-2">Add New Pet</h5>
                <p className="text-muted mb-3">Register your pet's profile</p>
                <button className="btn btn-success">Add Pet</button>
              </div>
            </div>
          </div>

          {/* Empty State - Show only when no pets */}
          {pets.length === 0 && (
            <div className="col-12">
              <div className="text-center py-5">
                <PawPrint size={64} className="text-muted mb-3" />
                <h5 className="text-muted">No pets registered yet</h5>
                <p className="text-muted">Click "Add New Pet" to register your first pet</p>
              </div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  )
}