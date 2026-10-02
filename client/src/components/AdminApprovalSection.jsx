// import React from 'react'
// import { Stethoscope, Mail, Phone, MapPin, Award, FileText, Clock, CheckCircle, XCircle } from 'lucide-react'

// export default function AdminApprovalSection({ pendingVets, onApprove, onReject }) {
//   return (
//     <div className="bg-white rounded-lg shadow-sm p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-xl font-bold text-gray-900">Veterinarian Approvals</h2>
//         <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg text-yellow-800 font-semibold">
//           <Clock size={20} /> <span>{pendingVets.length} Pending</span>
//         </div>
//       </div>

//       {pendingVets.length === 0 ? (
//         <div className="text-center py-12">
//           <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
//           <h3 className="text-xl font-bold">All Caught Up!</h3>
//           <p className="text-gray-600">No pending veterinarian applications.</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
//           {pendingVets.map(vet => (
//             <div key={vet.id} className="border rounded-lg p-5 hover:shadow-md transition">
//               <div className="flex items-center gap-3 pb-4 border-b mb-4">
//                 <div className="w-12 h-12 bg-green-100 flex items-center justify-center rounded-full text-green-600">
//                   <Stethoscope size={20} />
//                 </div>
//                 <div>
//                   <h4 className="font-bold">{vet.name}</h4>
//                   <span className="text-xs text-yellow-800 bg-yellow-50 rounded-full px-2 py-0.5 inline-flex items-center gap-1">
//                     <Clock size={12} /> Pending
//                   </span>
//                 </div>
//               </div>

//               <div className="text-sm text-gray-700 space-y-2 mb-4">
//                 <p><Mail size={14} className="inline mr-1 text-gray-400" /> {vet.email}</p>
//                 <p><Phone size={14} className="inline mr-1 text-gray-400" /> {vet.mobile}</p>
//                 <p><MapPin size={14} className="inline mr-1 text-gray-400" /> {vet.city}, {vet.state}</p>
//                 <p><Award size={14} className="inline mr-1 text-gray-400" /> {vet.licenseNumber}</p>
//                 <p><FileText size={14} className="inline mr-1 text-gray-400" /> {vet.specialization}</p>
//               </div>

//               <div className="pt-3 border-t mb-4 text-sm">
//                 <div className="text-green-600 font-medium">{vet.experience} experience</div>
//                 <div className="text-gray-600">{vet.clinic}</div>
//                 <div className="text-xs text-gray-500">Applied: {vet.registeredAt}</div>
//               </div>

//               <div className="flex gap-2">
//                 <button onClick={() => onApprove(vet)}
//                   className="flex-1 py-2 bg-green-400 hover:bg-green-500 text-gray-900 font-semibold rounded-lg flex items-center justify-center gap-1 text-sm">
//                   <CheckCircle size={16} /> Approve
//                 </button>
//                 <button onClick={() => onReject(vet)}
//                   className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-800 font-semibold rounded-lg flex items-center justify-center gap-1 text-sm">
//                   <XCircle size={16} /> Reject
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }
