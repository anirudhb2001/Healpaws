import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory");
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) cb(null, true);
    else cb(new Error("Only .png, .jpg, .jpeg and .pdf files are allowed!"));
  },
});

// ============================================================
// PUBLIC ROUTES
// ============================================================

// REGISTER ROUTE
router.post(
  "/register",
  upload.any(),
  async (req, res) => {
    try {
      console.log("📩 Registration request received");
      console.log("Body:", req.body);
      console.log("Files:", req.files);

      const {
        role,
        name,
        email,
        password,
        mobileno,
        country,
        state,
        city,
        licenseNumber,
        specialization,
        experience,
        clinicName,
      } = req.body;

      if (!role || !name || !email || !password || !mobileno || !country || !state || !city) {
        return res.status(400).json({
          success: false,
          message: "Please provide all required fields",
        });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const userData = {
        role,
        name,
        email,
        password: hashedPassword,
        mobileno,
        country,
        state,
        city,
        isApproved: role === "vet" ? false : true,
      };

      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          const filePath = path.join("uploads", file.filename);
          if (file.fieldname === "profilePicture") userData.profilePicture = filePath;
          if (file.fieldname === "idProof") userData.idProof = filePath;
          if (file.fieldname === "degreeCertificate") userData.degreeCertificate = filePath;
        });
      }

      if (role === "vet") {
        if (!licenseNumber || !specialization || !experience || !clinicName) {
          return res.status(400).json({
            success: false,
            message: "Please provide all veterinarian details",
          });
        }

        userData.licenseNumber = licenseNumber;
        userData.specialization = specialization;
        userData.experience = experience;
        userData.clinicName = clinicName;
      }

      const user = await User.create(userData);
      console.log("✅ User created successfully:", user._id);

      res.status(201).json({
        success: true,
        message:
          role === "vet"
            ? "Vet registration submitted for admin approval."
            : "Pet owner registered successfully.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture || null,
          isApproved: user.isApproved,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Server Error: " + error.message,
      });
    }
  }
);

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  try {
    console.log("🔐 Login attempt:", req.body.email);
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, password, and role",
      });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });

    if (user.role !== role)
      return res.status(401).json({
        success: false,
        message: `This account is not registered as a ${role}`,
      });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });

    if (user.role === "vet" && !user.isApproved)
      return res.status(403).json({
        success: false,
        message: "Your veterinarian account is pending admin approval",
      });

    console.log("✅ Login successful:", user.email);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobileno: user.mobileno,
        country: user.country,
        state: user.state,
        city: user.city,
        profilePicture: user.profilePicture || null,
        isApproved: user.isApproved,
        ...(user.role === "vet" && {
          licenseNumber: user.licenseNumber,
          specialization: user.specialization,
          experience: user.experience,
          clinicName: user.clinicName,
        }),
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: " + error.message,
    });
  }
});

// ============================================================
// VET ROUTES - CRITICAL FOR PROFILE LOADING
// ============================================================

// Get all APPROVED veterinarians (THIS IS WHAT WAS MISSING!)
router.get("/vets", async (req, res) => {
  try {
    console.log("📋 Fetching approved veterinarians...");
    
    const vets = await User.find({ 
      role: "vet", 
      isApproved: true 
    })
    .select("-password -idProof -degreeCertificate")
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${vets.length} approved vets`);

    res.status(200).json({
      success: true,
      count: vets.length,
      vets,
    });
  } catch (error) {
    console.error("❌ Get Approved Vets Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch veterinarians",
      error: error.message 
    });
  }
});

// Get PENDING veterinarians (for admin approval)
router.get("/vets/pending", async (req, res) => {
  try {
    console.log("📋 Fetching pending veterinarians...");
    
    const vets = await User.find({ 
      role: "vet", 
      isApproved: false 
    })
    .select("-password")
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${vets.length} pending vets`);

    res.status(200).json({
      success: true,
      count: vets.length,
      vets,
    });
  } catch (error) {
    console.error("❌ Get Pending Vets Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch pending veterinarians",
      error: error.message 
    });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

// Approve vet
router.put("/approve/:id", async (req, res) => {
  try {
    console.log(`✅ Approving vet: ${req.params.id}`);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Vet not found" 
      });
    }

    console.log(`✅ Vet approved: ${user.name}`);

    res.json({ 
      success: true, 
      message: "Vet approved", 
      user 
    });
  } catch (err) {
    console.error("❌ Approve error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

// Reject vet
router.put("/reject/:id", async (req, res) => {
  try {
    const { reason } = req.body;
    
    console.log(`❌ Rejecting vet: ${req.params.id}`);

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Vet not found" 
      });
    }

    console.log(`❌ Vet rejected: ${user.name}`);

    res.json({ 
      success: true, 
      message: "Vet rejected", 
      reason 
    });
  } catch (err) {
    console.error("❌ Reject error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

// ============================================================
// GENERAL USER ROUTES
// ============================================================

// Fetch all users (MUST BE LAST - after specific routes)
router.get("/", async (req, res) => {
  try {
    console.log("📋 Fetching all users...");
    
    const users = await User.find().select("-password");
    
    console.log(`✅ Found ${users.length} users`);

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error("❌ Get all users error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

export default router;
