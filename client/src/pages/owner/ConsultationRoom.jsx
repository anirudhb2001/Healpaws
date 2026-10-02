import React from 'react'
import Sidebar from '../../components/Sidebar'
import Header from '../../components/Header'
import { Video, Send } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'

export default function ConsultationRoom() {
  return (
    <AppLayout title="Virtual Consultation" role="owner">
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="bg-dark rounded-3 d-flex align-items-center justify-content-center" style={{ height: '500px' }}>
                <div className="text-center text-white">
                  <Video size={64} className="mb-3" />
                  <h5>Video Consultation Active</h5>
                  <p className="text-muted">Google Meet Integration</p>
                  <a href="https://meet.google.com/" target="_blank" rel="noreferrer" className="btn btn-success mt-3"><Video size={18} className="me-2" />Join Google Meet</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Consultation Details</h6>
              <div className="mb-2"><small className="text-muted">Pet:</small><div className="fw-semibold">Max (Golden Retriever)</div></div>
              <div className="mb-2"><small className="text-muted">Veterinarian:</small><div className="fw-semibold">Dr. Sarah Johnson</div></div>
              <div className="mb-2"><small className="text-muted">Duration:</small><div className="fw-semibold">30 minutes</div></div>
              <div className="mb-2"><small className="text-muted">Status:</small><div><span className="badge bg-success">In Progress</span></div></div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Chat</h6>
              <div className="border rounded-3 p-3 mb-3" style={{ height: '250px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                <div className="mb-3">
                  <small className="text-muted">Dr. Sarah</small>
                  <div className="bg-white p-2 rounded-3 mt-1 shadow-sm">Hello! I've reviewed the symptoms. Let's discuss the treatment plan.</div>
                </div>
                <div className="mb-3 text-end">
                  <small className="text-muted">You</small>
                  <div className="bg-success text-white p-2 rounded-3 mt-1 d-inline-block">Thank you, Doctor!</div>
                </div>
              </div>
              <div className="input-group">
                <input type="text" className="form-control" placeholder="Type a message..." />
                <button className="btn btn-success"><Send size={18} /></button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
