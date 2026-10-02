import express from "express";
import { 
  createPrescription, 
  getPrescriptionByConsultationId,
  updatePrescription,
  getPendingFollowUps,
  getOwnerFollowUps
} from "../controllers/prescriptionController.js";

const router = express.Router();

// GET /api/prescriptions/follow-ups/pending - Get all pending follow-ups (for notification system)
// IMPORTANT: This route must come BEFORE /:consultationId route to avoid route conflict
router.get("/follow-ups/pending", getPendingFollowUps);

// GET /api/prescriptions/owner/:ownerId/follow-ups - Get owner's follow-up reminders
// IMPORTANT: This route must come BEFORE /:consultationId route to avoid route conflict
router.get("/owner/:ownerId/follow-ups", getOwnerFollowUps);

// GET /api/prescriptions/:consultationId - Get existing prescription
router.get("/:consultationId", getPrescriptionByConsultationId);

// POST /api/prescriptions/:consultationId - Create new prescription
router.post("/:consultationId", createPrescription);

// PUT /api/prescriptions/:consultationId - Update existing prescription
router.put("/:consultationId", updatePrescription);

export default router;