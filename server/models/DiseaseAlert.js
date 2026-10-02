// models/DiseaseAlert.js
import mongoose from "mongoose";

const diseaseAlertSchema = new mongoose.Schema(
  {
    disease: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    cases: {
      type: Number,
      required: true,
      min: 1,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    species: {
      type: String,
      required: true,
      enum: ["dog", "cat", "cow", "all"],
      default: "all",
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "resolved", "monitoring"],
      default: "active",
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
diseaseAlertSchema.index({ area: 1, status: 1 });
diseaseAlertSchema.index({ severity: 1, status: 1 });
diseaseAlertSchema.index({ createdAt: -1 });

const DiseaseAlert = mongoose.model("DiseaseAlert", diseaseAlertSchema);

export default DiseaseAlert;