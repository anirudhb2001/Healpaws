import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["owner", "vet", "admin"],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    mobileno: String,

    // Common fields
    country: String,
    state: String,
    city: String,

    // Vet-only fields
    licenseNumber: String,
    specialization: String,
    experience: String,
    clinicName: String,
    idProof: String, // will store file path or URL (Cloudinary, etc.)
    degreeCertificate: String,

    profilePicture: String,

    // Admin verification
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
