import User from "../models/User.js";
import bcrypt from "bcryptjs";

// @desc    Register a new user (Pet Owner or Veterinarian)
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
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

    // Validate required fields
    if (!name || !email || !password || !mobileno || !country || !state || !city) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide all required fields" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "Email already registered" 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare user data
    const userData = {
      role: role || "owner",
      name,
      email,
      password: hashedPassword,
      mobileno,
      country,
      state,
      city,
      isApproved: role === "vet" ? false : true,
    };

    // Add veterinarian-specific fields
    if (role === "vet") {
      if (!licenseNumber || !specialization || !experience || !clinicName) {
        return res.status(400).json({ 
          success: false,
          message: "Please provide all veterinarian details" 
        });
      }

      userData.licenseNumber = licenseNumber;
      userData.specialization = specialization;
      userData.experience = experience;
      userData.clinicName = clinicName;

      // Handle file uploads
      if (req.files) {
        if (req.files.idProof) {
          userData.idProof = req.files.idProof[0].path;
        }
        if (req.files.degreeCertificate) {
          userData.degreeCertificate = req.files.degreeCertificate[0].path;
        }
      }
    }

    // Create user
    const user = await User.create(userData);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: role === "vet"
        ? "Veterinarian registration submitted for admin approval. You will be notified within 48 hours."
        : "Pet owner registered successfully. You can now log in.",
      user: userResponse,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error. Please try again later.",
      error: error.message 
    });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin (you can add auth middleware later)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide email and password" 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Check if vet is approved
    if (user.role === "vet" && !user.isApproved) {
      return res.status(403).json({ 
        success: false,
        message: "Your account is pending admin approval. Please wait for verification." 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: userResponse,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

