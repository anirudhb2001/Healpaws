// controllers/consultationController.js
import mongoose from "mongoose";
import Consultation from "../models/Consultation.js";
import Prescription from "../models/Prescription.js";
import User from "../models/User.js";
import Pet from "../models/Pet.js";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

// Utility: check ObjectId validity
const isValidObjectId = (id) => {
  return id && mongoose.Types.ObjectId.isValid(String(id));
};

// ====================================================================
// HELPER: Format AI Prediction Response
// ====================================================================
const formatAIPrediction = (aiResponse, petSpecies) => {
  // Default structure
  const defaultPrediction = {
    animalType: petSpecies || null,
    diagnosis: "Pending veterinary review",
    confidence: null,
    recommendations: [],
    rawResponse: null
  };

  try {
    // If AI service returned structured prediction
    if (aiResponse?.prediction) {
      const pred = aiResponse.prediction;
      
      return {
        animalType: pred.animal_type || petSpecies || null,
        diagnosis: pred.diagnosis || pred.predicted_class || "Pending veterinary review",
        confidence: pred.confidence || null,
        recommendations: Array.isArray(pred.recommendations) 
          ? pred.recommendations 
          : (pred.recommendation ? [pred.recommendation] : []),
        rawResponse: pred
      };
    }
    
    // If AI service returned simple class/confidence format
    if (aiResponse?.class || aiResponse?.predicted_class) {
      const diagnosis = aiResponse.class || aiResponse.predicted_class;
      const confidence = aiResponse.confidence || null;
      
      return {
        animalType: aiResponse.animal_type || petSpecies || null,
        diagnosis: diagnosis,
        confidence: confidence,
        recommendations: aiResponse.recommendation 
          ? [aiResponse.recommendation]
          : ["Please consult with a veterinarian for proper diagnosis and treatment."],
        rawResponse: aiResponse
      };
    }

    // If AI service returned message only
    if (aiResponse?.message) {
      return {
        animalType: petSpecies || null,
        diagnosis: aiResponse.message,
        confidence: null,
        recommendations: ["Please consult with a veterinarian."],
        rawResponse: aiResponse
      };
    }

    // Fallback
    return defaultPrediction;
    
  } catch (error) {
    console.error("Error formatting AI prediction:", error);
    return defaultPrediction;
  }
};

// ====================================================================
// 2. FETCH OWNER CONSULTATIONS (All appointments)
//    GET /api/consultations/owner/:ownerId
// ====================================================================
export const getOwnerConsultations = async (req, res) => {
  try {
    const { ownerId } = req.params;
    if (!isValidObjectId(ownerId)) {
      return res.status(400).json({ message: "Invalid ownerId" });
    }

    const consultations = await Consultation.find({ ownerId })
      .populate("petId", "name breed age gender weight petPhoto species")
      .populate("vetId", "name specialization")
      .sort({ createdAt: -1 })
      .exec();

    return res.json({ success: true, appointments: consultations });
  } catch (error) {
    console.error("Fetch owner consultations error:", error);
    return res.status(500).json({ message: "Failed to fetch appointments" });
  }
};

// ====================================================================
// 3. FETCH ALL APPROVED VETS
//    GET /api/consultations/vets
// ====================================================================
export const getAllVets = async (req, res) => {
  try {
    const vets = await User.find({ role: "vet", isApproved: true })
      .select("name specialization email")
      .exec();
    return res.json({ success: true, vets });
  } catch (error) {
    console.error("Fetch vets error:", error);
    return res.status(500).json({ message: "Failed to load vets" });
  }
};

// ====================================================================
// 4. SCHEDULE APPOINTMENT (Owner selects vet + date/time)
//    PATCH /api/consultations/:consultationId
//    Changes status from "pending" to "scheduled"
// ====================================================================
export const scheduleAppointment = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { vetId, appointmentDate, appointmentTime } = req.body;

    if (!isValidObjectId(consultationId)) {
      return res.status(400).json({ message: "Invalid consultationId" });
    }

    if (!vetId || !isValidObjectId(vetId)) {
      return res.status(400).json({ message: "Valid vetId is required to schedule" });
    }

    if (!appointmentDate || !appointmentTime) {
      return res.status(400).json({ message: "Appointment date and time are required" });
    }

    const consultation = await Consultation.findById(consultationId).exec();
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    // Only allow scheduling if status is "pending" or "declined"
    if (consultation.status !== "pending" && consultation.status !== "declined") {
      return res.status(400).json({
        message: `Cannot schedule appointment with status: ${consultation.status}`
      });
    }

    // Update to "scheduled" - waiting for vet confirmation
    const updated = await Consultation.findByIdAndUpdate(
      consultationId,
      {
        vetId,
        appointmentDate,
        appointmentTime,
        status: "scheduled", // Vet needs to accept
      },
      { new: true }
    )
      .populate("petId", "name breed age gender weight petPhoto species")
      .populate("vetId", "name specialization")
      .exec();

    return res.json({ success: true, appointment: updated });
  } catch (error) {
    console.error("Schedule appointment error:", error);
    return res.status(500).json({ message: "Failed to schedule appointment" });
  }
};

// ====================================================================
// 5. GET VET'S SCHEDULED APPOINTMENTS (for Pending Requests page)
//    GET /api/consultations/vet/appointments/:vetId
//    Returns appointments where THIS vet is assigned
// ====================================================================
export const getVetAppointments = async (req, res) => {
  try {
    const { vetId } = req.params;

    console.log("Fetching appointments for vetId:", vetId);

    if (!vetId) {
      return res.status(400).json({
        success: false,
        message: "vetId is required",
        appointments: []
      });
    }

    if (!isValidObjectId(vetId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vetId format",
        appointments: []
      });
    }

    // Find all consultations assigned to this vet
    const appointments = await Consultation.find({
      vetId: vetId,
      status: { $in: ["scheduled", "confirmed", "in-progress"] } // Only show active appointments
    })
      .populate("petId", "name breed age gender weight petPhoto species")
      .populate("ownerId", "name email mobileno profilePhoto")
      .populate("vetId", "name specialization")
      .sort({ createdAt: -1 })
      .exec();

    console.log(`Found ${appointments.length} appointments for vet ${vetId}`);

    return res.status(200).json({
      success: true,
      appointments: appointments || [],
      count: appointments.length
    });
  } catch (error) {
    console.error("Get vet appointments error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Failed to load appointments",
      error: error.message,
      appointments: []
    });
  }
};

// ====================================================================
// 6. ACCEPT APPOINTMENT (Vet confirms scheduled appointment)
//    PATCH /api/consultations/accept/:consultationId
//    Changes status from "scheduled" to "confirmed"
// ====================================================================
export const acceptAppointment = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { vetId } = req.body;

    console.log("Accept appointment request:", { consultationId, vetId });

    if (!isValidObjectId(consultationId)) {
      return res.status(400).json({ message: "Invalid consultationId" });
    }

    if (!isValidObjectId(vetId)) {
      return res.status(400).json({ message: "Invalid vetId" });
    }

    const consultation = await Consultation.findById(consultationId).exec();
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    // Verify this vet is assigned to this consultation
    if (consultation.vetId.toString() !== vetId.toString()) {
      return res.status(403).json({ message: "You are not assigned to this consultation" });
    }

    // Only allow accepting if status is "scheduled"
    if (consultation.status !== "scheduled") {
      return res.status(400).json({
        message: `Cannot accept appointment with status: ${consultation.status}`
      });
    }

    // Update to "confirmed" - owner can now make payment
    consultation.status = "confirmed";
    await consultation.save();

    const populated = await Consultation.findById(consultation._id)
      .populate("petId", "name breed age gender weight petPhoto species")
      .populate("ownerId", "name email mobileno profilePhoto")
      .populate("vetId", "name specialization")
      .exec();

    console.log("Appointment accepted successfully");

    return res.status(200).json({ success: true, appointment: populated });
  } catch (error) {
    console.error("Accept appointment error:", error);
    return res.status(500).json({ message: "Failed to accept appointment", error: error.message });
  }
};

// ====================================================================
// 7. DECLINE APPOINTMENT (Vet declines scheduled appointment)
//    PATCH /api/consultations/decline/:consultationId
//    Changes status from "scheduled" to "declined"
// ====================================================================
export const declineAppointment = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { vetId } = req.body;

    console.log("Decline appointment request:", { consultationId, vetId });

    if (!isValidObjectId(consultationId)) {
      return res.status(400).json({ message: "Invalid consultationId" });
    }

    if (!isValidObjectId(vetId)) {
      return res.status(400).json({ message: "Invalid vetId" });
    }

    const consultation = await Consultation.findById(consultationId).exec();
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    // Verify this vet is assigned
    if (consultation.vetId.toString() !== vetId.toString()) {
      return res.status(403).json({ message: "You are not assigned to this consultation" });
    }

    // Only allow declining if status is "scheduled"
    if (consultation.status !== "scheduled") {
      return res.status(400).json({
        message: `Cannot decline appointment with status: ${consultation.status}`
      });
    }

    // Update to "declined" - owner can reschedule with another vet
    consultation.status = "declined";
    await consultation.save();

    const populated = await Consultation.findById(consultation._id)
      .populate("petId", "name breed age gender weight petPhoto species")
      .populate("ownerId", "name email mobileno profilePhoto")
      .populate("vetId", "name specialization")
      .exec();

    console.log("Appointment declined successfully");

    return res.status(200).json({ success: true, appointment: populated });
  } catch (error) {
    console.error("Decline appointment error:", error);
    return res.status(500).json({ message: "Failed to decline appointment", error: error.message });
  }
};

// ====================================================================
// 8. START CONSULTATION (After payment confirmed)
//    PATCH /api/consultations/start/:consultationId
//    Changes status from "confirmed" to "in-progress"
// ====================================================================
// export const startConsultation = async (req, res) => {
//   try {
//     const { consultationId } = req.params;
//     const { vetId } = req.body;

//     console.log("Start consultation request:", { consultationId, vetId });

//     if (!isValidObjectId(consultationId)) {
//       return res.status(400).json({ message: "Invalid consultationId" });
//     }

//     if (!isValidObjectId(vetId)) {
//       return res.status(400).json({ message: "Invalid vetId" });
//     }

//     const consultation = await Consultation.findById(consultationId).exec();
//     if (!consultation) {
//       return res.status(404).json({ message: "Consultation not found" });
//     }

//     // Verify this vet is assigned
//     if (consultation.vetId.toString() !== vetId.toString()) {
//       return res.status(403).json({ message: "You are not assigned to this consultation" });
//     }

//     // Only allow starting if status is "confirmed"
//     if (consultation.status !== "confirmed") {
//       return res.status(400).json({ 
//         message: `Cannot start consultation with status: ${consultation.status}` 
//       });
//     }

//     // Update to "in-progress"
//     consultation.status = "in-progress";
//     await consultation.save();

//     const populated = await Consultation.findById(consultation._id)
//       .populate("petId", "name breed age gender weight petPhoto species")
//       .populate("ownerId", "name email mobileno profilePhoto")
//       .populate("vetId", "name specialization")
//       .exec();

//     console.log("Consultation started successfully");

//     return res.status(200).json({ success: true, consultation: populated });
//   } catch (error) {
//     console.error("Start consultation error:", error);
//     return res.status(500).json({ message: "Failed to start consultation", error: error.message });
//   }
// };

// ====================================================================
// 9. GET SINGLE CONSULTATION BY ID
//    GET /api/consultations/:consultationId
// ====================================================================
export const getConsultationById = async (req, res) => {
  try {
    const { consultationId } = req.params;

    console.log("Fetching consultation:", consultationId);

    if (!isValidObjectId(consultationId)) {
      return res.status(400).json({ success: false, message: "Invalid consultationId" });
    }

    const consultation = await Consultation.findById(consultationId)
      .populate("petId", "name breed age gender weight petPhoto species")
      .populate("ownerId", "name email mobileno profilePhoto")
      .populate("vetId", "name specialization")
      .exec();

    if (!consultation) {
      return res.status(404).json({ success: false, message: "Consultation not found" });
    }

    console.log("Consultation found successfully");

    return res.status(200).json({ success: true, consultation });
  } catch (error) {
    console.error("Get single consultation error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// DEPRECATED - Remove these old functions
export const getPendingConsultationsForVet = async (req, res) => {
  return res.status(410).json({
    message: "This endpoint is deprecated. Use /api/consultations/vet/appointments/:vetId instead"
  });
};

export const assignConsultationToVet = async (req, res) => {
  return res.status(410).json({
    message: "This endpoint is deprecated. Use /api/consultations/:consultationId for scheduling"
  });
};

export const declineConsultation = async (req, res) => {
  return res.status(410).json({
    message: "This endpoint is deprecated. Use /api/consultations/decline/:consultationId instead"
  });
};

export const handlePayment = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { amount, paymentMethod, status } = req.body;

    console.log("Payment request:", { consultationId, amount, paymentMethod, status });

    if (!isValidObjectId(consultationId)) {
      return res.status(400).json({ message: "Invalid consultationId" });
    }

    const consultation = await Consultation.findById(consultationId).exec();
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    // Only allow payment for confirmed appointments
    if (consultation.status !== "confirmed") {
      return res.status(400).json({
        message: `Cannot process payment for appointment with status: ${consultation.status}`
      });
    }

    // Check if already paid
    if (consultation.isPaid) {
      return res.status(400).json({
        message: "Payment has already been processed for this appointment"
      });
    }

    // Update payment status
    if (status === "success") {
      consultation.isPaid = true;
      consultation.paymentAmount = amount;
      consultation.paymentMethod = paymentMethod;
      consultation.paymentDate = new Date();
      consultation.paymentStatus = "completed";

      await consultation.save();

      const populated = await Consultation.findById(consultation._id)
        .populate("petId", "name breed age gender weight petPhoto species")
        .populate("ownerId", "name email mobileno profilePhoto")
        .populate("vetId", "name specialization")
        .exec();

      console.log("Payment successful");

      return res.status(200).json({
        success: true,
        message: "Payment successful",
        consultation: populated
      });
    } else {
      // Payment failed - update status but don't mark as paid
      consultation.paymentStatus = "failed";
      await consultation.save();

      console.log("Payment failed");

      return res.status(200).json({
        success: false,
        message: "Payment failed",
        consultation: consultation
      });
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    return res.status(500).json({
      message: "Failed to process payment",
      error: error.message
    });
  }
};

// ====================================================================
// 8. START CONSULTATION (After payment confirmed)
//    PATCH /api/consultations/start/:consultationId
//    Changes status from "confirmed" to "in-progress"
// ====================================================================
export const startConsultation = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { vetId } = req.body;

    if (!isValidObjectId(consultationId)) {
      return res.status(400).json({ message: "Invalid consultationId" });
    }

    if (!isValidObjectId(vetId)) {
      return res.status(400).json({ message: "Invalid vetId" });
    }

    const consultation = await Consultation.findById(consultationId).exec();
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    if (consultation.vetId.toString() !== vetId.toString()) {
      return res.status(403).json({ message: "You are not assigned to this consultation" });
    }

    if (consultation.status !== "confirmed") {
      return res.status(400).json({
        message: `Cannot start consultation with status: ${consultation.status}`
      });
    }

    // NEW CHECK: Ensure meeting link has been sent
    if (!consultation.meetingLink || consultation.meetingStatus !== "sent") {
      return res.status(400).json({
        message: "Please send the meeting link to the pet owner first"
      });
    }

    consultation.status = "in-progress";
    consultation.consultationStartTime = new Date();
    await consultation.save();

    const populated = await Consultation.findById(consultation._id)
      .populate("petId", "name breed age gender weight petPhoto species")
      .populate("ownerId", "name email mobileno profilePhoto")
      .populate("vetId", "name specialization")
      .exec();

    console.log("Consultation started successfully");

    return res.status(200).json({ success: true, consultation: populated });
  } catch (error) {
    console.error("Start consultation error:", error);
    return res.status(500).json({
      message: "Failed to start consultation",
      error: error.message
    });
  }
};

// ====================================================================
// SEND MEETING LINK (Vet adds Google Meet link)
// PATCH /api/consultations/send-link/:consultationId
// ====================================================================
export const sendMeetingLink = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { vetId, meetingLink } = req.body;

    console.log("Send meeting link request:", { consultationId, vetId, meetingLink });

    if (!isValidObjectId(consultationId)) {
      return res.status(400).json({ message: "Invalid consultationId" });
    }

    if (!isValidObjectId(vetId)) {
      return res.status(400).json({ message: "Invalid vetId" });
    }

    if (!meetingLink || !meetingLink.trim()) {
      return res.status(400).json({ message: "Meeting link is required" });
    }

    if (!meetingLink.includes("meet.google.com")) {
      return res.status(400).json({ message: "Please provide a valid Google Meet link" });
    }

    const consultation = await Consultation.findById(consultationId).exec();
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    if (consultation.vetId.toString() !== vetId.toString()) {
      return res.status(403).json({ message: "You are not assigned to this consultation" });
    }

    if (consultation.status !== "confirmed") {
      return res.status(400).json({
        message: `Cannot add meeting link for appointment with status: ${consultation.status}`
      });
    }

    // Optional: Uncomment to enforce payment check
    // if (!consultation.isPaid) {
    //   return res.status(400).json({ 
    //     message: "Payment must be completed before sending meeting link" 
    //   });
    // }

    consultation.meetingLink = meetingLink;
    consultation.meetingStatus = "sent";
    await consultation.save();

    const populated = await Consultation.findById(consultation._id)
      .populate("petId", "name breed age gender weight petPhoto species")
      .populate("ownerId", "name email mobileno profilePhoto")
      .populate("vetId", "name specialization")
      .exec();

    console.log("Meeting link sent successfully");

    return res.status(200).json({
      success: true,
      message: "Meeting link sent to pet owner",
      consultation: populated
    });
  } catch (error) {
    console.error("Send meeting link error:", error);
    return res.status(500).json({
      message: "Failed to send meeting link",
      error: error.message
    });
  }
};

// Add this function to your consultationController.js

// ====================================================================
// COMPLETE CONSULTATION (After meeting ends)
// PATCH /api/consultations/complete/:consultationId
// Changes status from "in-progress" to "completed"
// ====================================================================
export const completeConsultation = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { vetId } = req.body;

    console.log("Complete consultation request:", { consultationId, vetId });

    if (!isValidObjectId(consultationId)) {
      return res.status(400).json({ message: "Invalid consultationId" });
    }

    if (!isValidObjectId(vetId)) {
      return res.status(400).json({ message: "Invalid vetId" });
    }

    const consultation = await Consultation.findById(consultationId).exec();
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    // Verify this vet is assigned to this consultation
    if (consultation.vetId.toString() !== vetId.toString()) {
      return res.status(403).json({ message: "You are not assigned to this consultation" });
    }

    // Only allow completing if status is "in-progress"
    if (consultation.status !== "in-progress") {
      return res.status(400).json({
        message: `Cannot complete consultation with status: ${consultation.status}. The consultation must be in progress.`
      });
    }

    // Update to "completed" status
    consultation.status = "completed";
    consultation.consultationEndTime = new Date();
    await consultation.save();

    const populated = await Consultation.findById(consultation._id)
      .populate("petId", "name breed age gender weight petPhoto species")
      .populate("ownerId", "name email mobileno profilePhoto")
      .populate("vetId", "name specialization")
      .exec();

    console.log("Consultation completed successfully");

    return res.status(200).json({
      success: true,
      message: "Consultation completed successfully",
      consultation: populated
    });
  } catch (error) {
    console.error("Complete consultation error:", error);
    return res.status(500).json({
      message: "Failed to complete consultation",
      error: error.message
    });
  }
};

// ===============================================
// GET CASE HISTORY (Completed Consultations for Vet)
// GET  /api/history/vet/:vetId
// ===============================================
export const getVetCaseHistory = async (req, res) => {
  try {
    const { vetId } = req.params;

    if (!vetId) return res.status(400).json({ message: "vetId is required" });

    const result = await Consultation.find({
      vetId,
      status: "completed"
    })
      .sort({ createdAt: -1 })
      .populate("ownerId", "name email")
      .populate("petId", "name species breed age gender")
      .lean();

    for (let record of result) {
      const prescription = await Prescription.findOne({
        consultationId: record._id
      }).lean();

      record.prescriptionData = prescription || null;
    }

    res.status(200).json({ success: true, history: result });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch case history" });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { consultationId } = req.params;

    // Safely extract reason from body (handle undefined req.body)
    const reason = req.body?.reason || null;

    console.log("Cancel appointment request:", { consultationId, reason });

    // Validate consultationId
    if (!isValidObjectId(consultationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultationId"
      });
    }

    // Find the consultation
    const consultation = await Consultation.findById(consultationId);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found"
      });
    }

    // Check if consultation can be cancelled
    // Can only cancel if status is: pending, scheduled, or confirmed
    const cancellableStatuses = ['pending', 'scheduled', 'confirmed'];

    if (!cancellableStatuses.includes(consultation.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel appointment with status: ${consultation.status}`
      });
    }

    // Update consultation status to cancelled
    consultation.status = 'cancelled';
    consultation.cancelledAt = new Date();

    // Store cancellation reason if provided
    if (reason && reason.trim()) {
      consultation.notes = consultation.notes
        ? `${consultation.notes}\n\nCancellation Reason: ${reason}`
        : `Cancellation Reason: ${reason}`;
    }

    await consultation.save();

    // Populate related fields for response
    const populated = await Consultation.findById(consultation._id)
      .populate('vetId', 'name email specialization')
      .populate('ownerId', 'name email mobileno')
      .populate('petId', 'name breed species')
      .exec();

    console.log("Appointment cancelled successfully");

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      consultation: populated
    });

  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
      error: error.message
    });
  }
};

export const submitSymptoms = async (req, res) => {
  try {
    const { ownerId, petId, symptoms, petName } = req.body;

    // Validate required fields
    if (!ownerId || !petId || !symptoms) {
      return res.status(400).json({ 
        message: "Missing required fields: ownerId, petId or symptoms" 
      });
    }

    if (!isValidObjectId(ownerId) || !isValidObjectId(petId)) {
      return res.status(400).json({ 
        message: "Invalid ownerId or petId" 
      });
    }

    // Fetch pet details to check species
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    // Define species that support AI image analysis
    const AI_SUPPORTED_SPECIES = ['dog', 'cat', 'cow'];
    const petSpecies = pet.species?.toLowerCase();
    const supportsAI = AI_SUPPORTED_SPECIES.includes(petSpecies);

    console.log(`🐾 Pet: ${pet.name} | Species: ${petSpecies} | AI Support: ${supportsAI}`);

    // Build relative paths for uploaded files
    const mediaFiles = (req.files && Array.isArray(req.files))
      ? req.files.map((f) => `uploads/consultations/${f.filename}`)
      : [];

    console.log(`📁 Files uploaded: ${mediaFiles.length}`);

    // Initialize AI prediction with default structure
    let aiPrediction = {
      animalType: petSpecies,
      diagnosis: "Pending veterinary review",
      confidence: null,
      recommendations: ["A veterinarian will review your case shortly."],
      rawResponse: null
    };

    // Only run AI analysis if:
    // 1. Species supports AI (dog, cat, cow)
    // 2. Images are uploaded
    if (supportsAI && req.files && req.files.length > 0) {
      try {
        console.log("🤖 Starting AI analysis...");
        
        const formData = new FormData();

        // Map pet species to Flask API animal_type
        const animalTypeMapping = {
          'dog': 'dog',
          'cat': 'cat',
          'cow': 'cattle'
        };
        const flaskAnimalType = animalTypeMapping[petSpecies] || 'dog';
        
        formData.append("animal_type", flaskAnimalType);

        // Append all files
        req.files.forEach((file, index) => {
          if (fs.existsSync(file.path)) {
            console.log(`  📎 Adding file ${index + 1}: ${file.originalname}`);
            formData.append("files", fs.createReadStream(file.path), {
              filename: file.originalname,
              contentType: file.mimetype
            });
          } else {
            console.warn(`  ⚠️ File not found: ${file.path}`);
          }
        });

        // Call Flask API
        const aiResponse = await axios.post(
          "http://localhost:5001/api/predict/batch",
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              'Accept': 'application/json'
            },
            timeout: 90000, // 90 seconds for batch processing
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          }
        );

        console.log("✅ AI Response received:", JSON.stringify(aiResponse.data, null, 2));

        // Format the AI prediction properly
        if (aiResponse.data) {
          // Handle batch response format
          if (aiResponse.data.results && aiResponse.data.aggregate) {
            const aggregate = aiResponse.data.aggregate;
            const results = aiResponse.data.results;
            
            // Find the most confident prediction
            const topResult = results.reduce((max, result) => 
              (result.confidence || 0) > (max.confidence || 0) ? result : max
            , results[0] || {});

            aiPrediction = {
              animalType: flaskAnimalType,
              diagnosis: topResult.prediction || aggregate.most_common_prediction || "Analysis complete",
              confidence: aggregate.average_confidence || topResult.confidence || null,
              recommendations: aggregate.recommendations || [
                "Please schedule an appointment with a veterinarian for detailed examination."
              ],
              rawResponse: {
                batchResults: results,
                aggregate: aggregate,
                totalImages: aiResponse.data.count
              }
            };
          } 
          // Handle single prediction format (fallback)
          else {
            aiPrediction = formatAIPrediction(aiResponse.data, petSpecies);
          }

          console.log("📊 Formatted AI Prediction:", JSON.stringify(aiPrediction, null, 2));
        }

      } catch (aiError) {
        console.error("❌ AI Service Error:", aiError.message);

        // Handle specific errors gracefully
        if (aiError.code === "ECONNREFUSED") {
          aiPrediction.diagnosis = "AI service is temporarily unavailable";
          aiPrediction.recommendations = [
            "A veterinarian will review your pet's symptoms and uploaded media."
          ];
        } else if (aiError.response?.status === 400) {
          aiPrediction.diagnosis = "Unable to process images for AI analysis";
          aiPrediction.recommendations = [
            "A veterinarian will review your case shortly."
          ];
        } else if (aiError.code === "ETIMEDOUT" || aiError.code === "ECONNABORTED") {
          aiPrediction.diagnosis = "AI analysis timed out";
          aiPrediction.recommendations = [
            "A veterinarian will review your case shortly."
          ];
        } else {
          aiPrediction.diagnosis = "Unable to generate AI prediction at this time";
          aiPrediction.recommendations = [
            "A veterinarian will review your case shortly."
          ];
        }

        console.log("⚠️ Using fallback prediction due to AI error");
      }
    } 
    // Species doesn't support AI but images uploaded
    else if (!supportsAI && mediaFiles.length > 0) {
      aiPrediction.diagnosis = `Images uploaded for ${pet.species}`;
      aiPrediction.recommendations = [
        `AI analysis is currently available only for dogs, cats, and cows.`,
        `A veterinarian will review your uploaded images.`
      ];
      console.log(`ℹ️ Species ${petSpecies} does not support AI - images saved for vet review`);
    } 
    // Species doesn't support AI and no images
    else if (!supportsAI) {
      aiPrediction.diagnosis = "Symptoms submitted for veterinary review";
      aiPrediction.recommendations = [
        `A veterinarian will review your ${pet.species}'s symptoms and provide professional diagnosis.`
      ];
    } 
    // Species supports AI but no images uploaded
    else {
      aiPrediction.diagnosis = "No images provided for AI analysis";
      aiPrediction.recommendations = [
        `Upload images of your ${pet.species} for AI-powered analysis.`,
        `Or schedule an appointment with a veterinarian directly.`
      ];
    }

    // Create consultation with properly structured AI prediction
    const consultation = await Consultation.create({
      ownerId,
      petId,
      petName: petName || pet.name || undefined,
      symptoms,
      mediaFiles,
      aiPrediction: aiPrediction, // This matches the schema structure
      status: "pending",
      vetId: null,
    });

    // Populate and return
    const populated = await Consultation.findById(consultation._id)
      .populate("petId", "name breed age gender weight petPhoto species")
      .populate("ownerId", "name email mobileno profilePhoto")
      .exec();

    console.log("✅ Consultation created successfully");
    console.log("📋 AI Prediction stored:", JSON.stringify(populated.aiPrediction, null, 2));

    return res.status(201).json({ 
      success: true, 
      consultation: populated 
    });

  } catch (error) {
    console.error("❌ Submit symptoms error:", error);
    return res.status(500).json({ 
      message: "Failed to submit symptoms",
      error: error.message 
    });
  }
};

export const getAllConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find()
      .populate("petId", "name breed species")
      .populate("ownerId", "name email")
      .populate("vetId", "name specialization")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      appointments: consultations,
      count: consultations.length
    });
  } catch (error) {
    console.error("Get all consultations error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch consultations"
    });
  }
};