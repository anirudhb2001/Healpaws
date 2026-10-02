import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultation",
    required: true,
    unique: true, // Ensure one prescription per consultation
    index: true, // Add index for faster queries
  },
  diagnosis: {
    type: String,
    required: true,
    trim: true,
  },
  prescription: {
    type: String,
    required: true,
    trim: true,
  },
  instructions: {
    type: String,
    default: "",
    trim: true,
  },
  // Follow-up fields
  followUpRequired: {
    type: Boolean,
    default: false,
  },
  followUpDate: {
    type: Date,
    default: null,
  },
  followUpReason: {
    type: String,
    default: "",
    trim: true,
  },
  followUpStatus: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
});

// Add a pre-save hook to update the updatedAt field
prescriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // If follow-up is not required, clear follow-up fields
  if (!this.followUpRequired) {
    this.followUpDate = null;
    this.followUpReason = "";
    this.followUpStatus = 'pending';
  }
  
  next();
});

// Add indexes for better query performance
prescriptionSchema.index({ consultationId: 1 });
prescriptionSchema.index({ createdAt: -1 });
prescriptionSchema.index({ followUpRequired: 1, followUpDate: 1 }); // For follow-up queries

export default mongoose.model("Prescription", prescriptionSchema);