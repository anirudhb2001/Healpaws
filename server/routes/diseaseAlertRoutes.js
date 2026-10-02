// routes/diseaseAlertRoutes.js
import express from "express";
import {
  getAllAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  getAlertById,
  triggerAlertGeneration,
} from "../controllers/diseaseAlertController.js";

const router = express.Router();

// GET /api/disease-alerts - Get all alerts
router.get("/", getAllAlerts);

// POST /api/disease-alerts/generate - Trigger auto-generation
router.post("/generate", triggerAlertGeneration);

// POST /api/disease-alerts - Create new alert (manual)
router.post("/", createAlert);

// GET /api/disease-alerts/:id - Get single alert
router.get("/:id", getAlertById);

// PUT /api/disease-alerts/:id - Update alert
router.put("/:id", updateAlert);

// DELETE /api/disease-alerts/:id - Delete alert
router.delete("/:id", deleteAlert);

export default router;