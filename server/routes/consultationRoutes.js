// consultationRoutes.js - FIXED ROUTE ORDER
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  submitSymptoms,
  getOwnerConsultations,
  scheduleAppointment,
  getAllVets,
  getVetAppointments,
  acceptAppointment,
  declineAppointment,
  startConsultation,
  getConsultationById,
  handlePayment,
  sendMeetingLink,
  completeConsultation,
  getVetCaseHistory,
  cancelAppointment,
  getAllConsultations
} from "../controllers/consultationController.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const consultationPath = path.join(__dirname, "..", "uploads", "consultations");
if (!fs.existsSync(consultationPath)) {
  fs.mkdirSync(consultationPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, consultationPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ==================== ROUTES ====================
// CRITICAL: Static routes MUST come BEFORE dynamic routes

// 1. GET ALL CONSULTATIONS (for admin) - MUST BE FIRST
router.get("/", getAllConsultations);

// 2. Submit symptoms
router.post("/submit", upload.array("media"), submitSymptoms);

// 3. Get all approved vets
router.get("/vets", getAllVets);

// 4. Get owner's consultations
router.get("/owner/:ownerId", getOwnerConsultations);

// 5. Get vet's appointments
router.get("/vet/appointments/:vetId", getVetAppointments);

// 6. Get vet case history
router.get("/history/vet/:vetId", getVetCaseHistory);

// 7. Accept appointment
router.patch("/accept/:consultationId", acceptAppointment);

// 8. Decline appointment
router.patch("/decline/:consultationId", declineAppointment);

// 9. Start consultation
router.patch("/start/:consultationId", startConsultation);

// 10. Send meeting link
router.patch("/send-link/:consultationId", sendMeetingLink);

// 11. Complete consultation
router.patch("/complete/:consultationId", completeConsultation);

// 12. Cancel appointment
router.patch("/:consultationId/cancel", cancelAppointment);

// 13. Make payment
router.post("/:consultationId/payment", handlePayment);

// 14. Get single consultation - MUST BE LAST
router.get("/:consultationId", getConsultationById);

// 15. Schedule appointment - MUST BE LAST
router.patch("/:consultationId", scheduleAppointment);

export default router;


// Complete Workflow Summary
// ```
// 1. pending (after symptom submission - no vet selected)
//    ↓
// 2. scheduled (owner selects vet + date/time)
//    ↓
// 3. confirmed (vet accepts) OR declined (vet declines → back to step 1)
//    ↓
// 4. in-progress (vet starts consultation after payment)
//    ↓
// 5. completed (consultation finished)