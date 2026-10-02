import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pet",
    required: true,
  },

  petName: { 
    type: String 
  },

  symptoms: { 
    type: String,
    required: true
  },

  mediaFiles: {
    type: [String],
    default: []
  },

  aiPrediction: {
  animalType: { type: String, default: null },
  diagnosis: { type: String, default: "Pending veterinary review" },
  confidence: { type: Number, default: null },
  recommendations: { type: [String], default: [] },
  rawResponse: { type: mongoose.Schema.Types.Mixed, default: null }
},

  status: {
    type: String,
    enum: ["pending", "scheduled", "confirmed", "declined", "in-progress", "completed", "cancelled"],
    default: "pending",
  },

  vetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  appointmentDate: {
    type: String,
    default: null
  },

  appointmentTime: {
    type: String,
    default: null
  },

  reason: {
    type: String,
    default: null
  },

  notes: {
    type: String,
    default: null
  },

  meetingLink: {
    type: String,
    default: null
  },

  meetingStatus: {
    type: String,
    enum: ["sent", "not-sent", null],
    default: null
  },

  // ========== PAYMENT FIELDS ==========
  isPaid: {
    type: Boolean,
    default: false
  },

  consultationFee: {
    type: Number,
    default: 500
  },

  paymentAmount: {
    type: Number,
    default: null
  },

  paymentMethod: {
    type: String,
    default: null
  },

  paymentDate: {
    type: Date,
    default: null
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed", null],
    default: "pending"
  },

  // Meeting Link Information
meetingLink: {
  type: String,
  default: null,
},
meetingStatus: {
  type: String,
  enum: ["pending", "sent", "joined"],
  default: "pending",
},
consultationStartTime: Date,
consultationEndTime: { type: Date },

}, { 
  timestamps: true 
});

// Add indexes for better query performance
consultationSchema.index({ ownerId: 1, createdAt: -1 });
consultationSchema.index({ vetId: 1, status: 1, createdAt: -1 });
consultationSchema.index({ status: 1 });

const Consultation = mongoose.model("Consultation", consultationSchema);
export default Consultation;