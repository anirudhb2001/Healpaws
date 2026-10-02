import Prescription from "../models/Prescription.js";
import Consultation from "../models/Consultation.js";
import mongoose from "mongoose";

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return id && mongoose.Types.ObjectId.isValid(String(id));
};

// ====================================================================
// GET PRESCRIPTION BY CONSULTATION ID
// GET /api/prescriptions/:consultationId
// ====================================================================
export const getPrescriptionByConsultationId = async (req, res) => {
  try {
    const { consultationId } = req.params;

    console.log("Fetching prescription for consultation:", consultationId);

    // Validate consultationId
    if (!isValidObjectId(consultationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultationId",
      });
    }

    // Check if consultation exists
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    // Find prescription for this consultation
    const prescription = await Prescription.findOne({ 
      consultationId 
    })
    .populate('consultationId', 'status vetId ownerId')
    .exec();

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "No prescription found for this consultation",
      });
    }

    console.log("Prescription found successfully");

    return res.status(200).json({
      success: true,
      prescription,
    });
  } catch (error) {
    console.error("Get prescription error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching prescription",
      error: error.message,
    });
  }
};

// ====================================================================
// CREATE PRESCRIPTION
// POST /api/prescriptions/:consultationId
// ====================================================================
export const createPrescription = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { 
      diagnosis, 
      prescription, 
      instructions, 
      vetId,
      followUpRequired,
      followUpDate,
      followUpReason
    } = req.body;

    console.log("Creating/Updating prescription for consultation:", consultationId);

    // Validate consultationId
    if (!isValidObjectId(consultationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultationId",
      });
    }

    // Validate required fields
    if (!diagnosis || !diagnosis.trim()) {
      return res.status(400).json({
        success: false,
        message: "Diagnosis is required",
      });
    }

    if (!prescription || !prescription.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prescription details are required",
      });
    }

    // Validate follow-up fields if follow-up is required
    if (followUpRequired) {
      if (!followUpDate) {
        return res.status(400).json({
          success: false,
          message: "Follow-up date is required when follow-up is enabled",
        });
      }

      if (!followUpReason || !followUpReason.trim()) {
        return res.status(400).json({
          success: false,
          message: "Follow-up reason is required when follow-up is enabled",
        });
      }

      // Validate follow-up date is not in the past
      const selectedDate = new Date(followUpDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        return res.status(400).json({
          success: false,
          message: "Follow-up date cannot be in the past",
        });
      }
    }

    // Check if consultation exists
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    // Verify consultation is completed
    if (consultation.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Prescription can only be created for completed consultations",
      });
    }

    // Optional: Verify vet is assigned to this consultation
    if (vetId && consultation.vetId.toString() !== vetId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create prescription for this consultation",
      });
    }

    // Check if prescription already exists
    let existingPrescription = await Prescription.findOne({ consultationId });

    let savedPrescription;

    if (existingPrescription) {
      // Update existing prescription
      console.log("Updating existing prescription");
      existingPrescription.diagnosis = diagnosis;
      existingPrescription.prescription = prescription;
      existingPrescription.instructions = instructions || "";
      existingPrescription.followUpRequired = followUpRequired || false;
      existingPrescription.followUpDate = followUpRequired ? followUpDate : null;
      existingPrescription.followUpReason = followUpRequired ? (followUpReason || "") : "";
      existingPrescription.updatedAt = new Date();
      
      savedPrescription = await existingPrescription.save();
    } else {
      // Create new prescription
      console.log("Creating new prescription");
      savedPrescription = await Prescription.create({
        consultationId,
        diagnosis,
        prescription,
        instructions: instructions || "",
        followUpRequired: followUpRequired || false,
        followUpDate: followUpRequired ? followUpDate : null,
        followUpReason: followUpRequired ? (followUpReason || "") : "",
      });
    }

    // Populate consultation details
    const populatedPrescription = await Prescription.findById(savedPrescription._id)
      .populate({
        path: 'consultationId',
        populate: [
          { path: 'vetId', select: 'name specialization' },
          { path: 'ownerId', select: 'name email' },
          { path: 'petId', select: 'name breed species age' }
        ]
      })
      .exec();

    console.log("Prescription saved successfully");

    // TODO: If followUpRequired is true, trigger notification system here
    // Example: await createFollowUpNotification(populatedPrescription);

    return res.status(200).json({
      success: true,
      message: existingPrescription 
        ? "Prescription updated successfully" 
        : "Prescription created successfully",
      prescription: populatedPrescription,
    });
  } catch (error) {
    console.error("Create/Update prescription error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while saving prescription",
      error: error.message,
    });
  }
};

// ====================================================================
// UPDATE PRESCRIPTION (Alternative explicit update endpoint)
// PUT /api/prescriptions/:consultationId
// ====================================================================
export const updatePrescription = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { 
      diagnosis, 
      prescription, 
      instructions, 
      vetId,
      followUpRequired,
      followUpDate,
      followUpReason
    } = req.body;

    console.log("Updating prescription for consultation:", consultationId);

    // Validate consultationId
    if (!isValidObjectId(consultationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultationId",
      });
    }

    // Find existing prescription
    const existingPrescription = await Prescription.findOne({ consultationId });

    if (!existingPrescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found. Use POST to create a new prescription.",
      });
    }

    // Check consultation status
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    // Optional: Verify vet authorization
    if (vetId && consultation.vetId.toString() !== vetId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this prescription",
      });
    }

    // Validate follow-up fields if follow-up is required
    if (followUpRequired) {
      if (!followUpDate) {
        return res.status(400).json({
          success: false,
          message: "Follow-up date is required when follow-up is enabled",
        });
      }

      if (!followUpReason || !followUpReason.trim()) {
        return res.status(400).json({
          success: false,
          message: "Follow-up reason is required when follow-up is enabled",
        });
      }

      // Validate follow-up date is not in the past
      const selectedDate = new Date(followUpDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        return res.status(400).json({
          success: false,
          message: "Follow-up date cannot be in the past",
        });
      }
    }

    // Update fields
    if (diagnosis) existingPrescription.diagnosis = diagnosis;
    if (prescription) existingPrescription.prescription = prescription;
    if (instructions !== undefined) existingPrescription.instructions = instructions;
    
    // Update follow-up fields
    if (followUpRequired !== undefined) {
      existingPrescription.followUpRequired = followUpRequired;
      existingPrescription.followUpDate = followUpRequired ? followUpDate : null;
      existingPrescription.followUpReason = followUpRequired ? (followUpReason || "") : "";
    }
    
    existingPrescription.updatedAt = new Date();

    const updatedPrescription = await existingPrescription.save();

    // Populate consultation details
    const populatedPrescription = await Prescription.findById(updatedPrescription._id)
      .populate({
        path: 'consultationId',
        populate: [
          { path: 'vetId', select: 'name specialization' },
          { path: 'ownerId', select: 'name email' },
          { path: 'petId', select: 'name breed species age' }
        ]
      })
      .exec();

    console.log("Prescription updated successfully");

    return res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
      prescription: populatedPrescription,
    });
  } catch (error) {
    console.error("Update prescription error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating prescription",
      error: error.message,
    });
  }
};

// ====================================================================
// GET ALL PENDING FOLLOW-UPS (for notification system)
// GET /api/prescriptions/follow-ups/pending
// ====================================================================
export const getPendingFollowUps = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all prescriptions with pending follow-ups
    const pendingFollowUps = await Prescription.find({
      followUpRequired: true,
      followUpStatus: 'pending',
      followUpDate: { $gte: today }
    })
    .populate({
      path: 'consultationId',
      populate: [
        { path: 'vetId', select: 'name specialization email' },
        { path: 'ownerId', select: 'name email phone' },
        { path: 'petId', select: 'name breed species age' }
      ]
    })
    .sort({ followUpDate: 1 })
    .exec();

    return res.status(200).json({
      success: true,
      count: pendingFollowUps.length,
      followUps: pendingFollowUps,
    });
  } catch (error) {
    console.error("Get pending follow-ups error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching pending follow-ups",
      error: error.message,
    });
  }
};

// ====================================================================
// GET OWNER'S FOLLOW-UP REMINDERS (for owner notifications)
// GET /api/prescriptions/owner/:ownerId/follow-ups
// ====================================================================
export const getOwnerFollowUps = async (req, res) => {
  try {
    const { ownerId } = req.params;

    console.log("Fetching follow-ups for owner:", ownerId);

    // Validate ownerId
    if (!isValidObjectId(ownerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ownerId",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all consultations for this owner
    const consultations = await Consultation.find({ ownerId }).select('_id');
    const consultationIds = consultations.map(c => c._id);

    // Find prescriptions with follow-ups for these consultations
    const followUps = await Prescription.find({
      consultationId: { $in: consultationIds },
      followUpRequired: true,
      followUpStatus: 'pending',
      followUpDate: { $gte: today }
    })
    .populate({
      path: 'consultationId',
      populate: [
        { path: 'vetId', select: 'name specialization' },
        { path: 'ownerId', select: 'name email' },
        { path: 'petId', select: 'name breed species age' }
      ]
    })
    .sort({ followUpDate: 1 })
    .exec();

    console.log(`Found ${followUps.length} follow-ups for owner`);

    return res.status(200).json({
      success: true,
      count: followUps.length,
      followUps: followUps,
    });
  } catch (error) {
    console.error("Get owner follow-ups error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching owner follow-ups",
      error: error.message,
    });
  }
};