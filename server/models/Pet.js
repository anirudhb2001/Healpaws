import mongoose from "mongoose";

const petSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    species: {
      type: String,
      required: true,
      trim: true,
    },
    breed: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female"],
    },
    dateOfBirth: {
      type: Date,
    },
    age: {
      type: Number,
    },
    weight: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      trim: true,
    },
    microchipId: {
      type: String,
      trim: true,
    },
    
    // Health Information
    allergies: {
      type: String,
      trim: true,
    },
    medications: {
      type: String,
      trim: true,
    },
    specialNeeds: {
      type: String,
      trim: true,
    },
    
    // Medical History
    vaccinationHistory: {
      type: String,
      trim: true,
    },
    pastConsultations: {
      type: String,
      trim: true,
    },
    
    // Files
    petPhoto: {
      type: String,
    },
    documents: [
      {
        type: String,
      },
    ],
  },
  { 
    timestamps: true 
  }
);

const Pet = mongoose.model("Pet", petSchema);
export default Pet;