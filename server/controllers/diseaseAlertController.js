// controllers/diseaseAlertController.js
import DiseaseAlert from "../models/DiseaseAlert.js";
import Consultation from "../models/Consultation.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return id && mongoose.Types.ObjectId.isValid(String(id));
};

// Helper function to notify owners (console logging for now)
const notifyOwners = async (alert, notificationType) => {
  try {
    // Find owners in the affected area
    const owners = await User.find({
      role: "owner",
      $or: [
        { city: new RegExp(alert.area, "i") },
        { state: new RegExp(alert.area, "i") }
      ]
    });

    if (owners.length === 0) {
      console.log(`[ALERT NOTIFICATION] No owners found in ${alert.area}`);
      return;
    }

    // Log notification details
    if (notificationType === "new") {
      console.log(`[ALERT NOTIFICATION] NEW OUTBREAK: ${alert.disease} in ${alert.area}`);
      console.log(`[ALERT NOTIFICATION] ${owners.length} owners notified about ${alert.cases} cases (Severity: ${alert.severity})`);
    } else if (notificationType === "resolved") {
      console.log(`[ALERT NOTIFICATION] RESOLVED: ${alert.disease} outbreak in ${alert.area}`);
      console.log(`[ALERT NOTIFICATION] ${owners.length} owners notified that the outbreak has been resolved`);
    } else if (notificationType === "updated") {
      console.log(`[ALERT NOTIFICATION] UPDATED: ${alert.disease} in ${alert.area}`);
      console.log(`[ALERT NOTIFICATION] ${owners.length} owners notified about case update (${alert.cases} cases, Severity: ${alert.severity})`);
    }

    // You can expand this later to send actual emails/SMS
  } catch (error) {
    console.error("Error notifying owners:", error);
  }
};

// ====================================================================
// AUTO-GENERATE ALERTS based on consultation patterns
// This analyzes completed consultations to detect disease outbreaks
// ====================================================================
export const generateAlertsFromConsultations = async () => {
  try {
    // Get completed consultations from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const consultations = await Consultation.find({
      status: "completed",
      createdAt: { $gte: thirtyDaysAgo },
    })
      .populate("petId", "species")
      .populate("ownerId", "city state")
      .exec();

    // Group by disease/symptoms and location
    const diseaseMap = {};

    for (const consultation of consultations) {
      // Extract disease from AI prediction or symptoms
      let diseaseName = "Unknown condition";
      if (consultation.aiPrediction) {
        const prediction = consultation.aiPrediction.toLowerCase();
        
        // Common disease patterns
        if (prediction.includes("parvovirus") || prediction.includes("parvo")) {
          diseaseName = "Parvovirus";
        } else if (prediction.includes("distemper")) {
          diseaseName = "Distemper";
        } else if (prediction.includes("kennel cough") || prediction.includes("respiratory")) {
          diseaseName = "Kennel Cough";
        } else if (prediction.includes("skin") || prediction.includes("dermatitis")) {
          diseaseName = "Skin Infection";
        } else if (prediction.includes("gastro") || prediction.includes("diarrhea")) {
          diseaseName = "Gastrointestinal Issue";
        } else if (prediction.includes("tick") || prediction.includes("flea")) {
          diseaseName = "Tick/Flea Infestation";
        }
      }

      const location = consultation.ownerId?.city || "Unknown";
      const species = consultation.petId?.species || "all";
      const key = `${diseaseName}-${location}-${species}`;

      if (!diseaseMap[key]) {
        diseaseMap[key] = {
          disease: diseaseName,
          area: location,
          species: species,
          cases: 0,
          consultations: [],
        };
      }

      diseaseMap[key].cases++;
      diseaseMap[key].consultations.push(consultation._id);
    }

    // Create alerts for high-case areas
    const alerts = [];
    for (const key in diseaseMap) {
      const data = diseaseMap[key];
      
      // Determine severity based on case count
      let severity = "low";
      if (data.cases >= 10) {
        severity = "high";
      } else if (data.cases >= 5) {
        severity = "medium";
      }

      // Only create alerts for medium and high severity
      if (data.cases >= 5) {
        // Check if alert already exists
        const existingAlert = await DiseaseAlert.findOne({
          disease: data.disease,
          area: data.area,
          species: data.species,
          status: "active",
        });

        if (!existingAlert) {
          // Create new alert
          const alert = await DiseaseAlert.create({
            disease: data.disease,
            area: data.area,
            species: data.species,
            cases: data.cases,
            severity: severity,
            description: `${data.cases} cases detected in ${data.area} over the past 30 days`,
            status: "active",
          });
          
          // Notify owners about new outbreak
          await notifyOwners(alert, "new");
          
          alerts.push(alert);
        } else {
          // Update existing alert
          const oldCases = existingAlert.cases;
          existingAlert.cases = data.cases;
          existingAlert.severity = severity;
          await existingAlert.save();
          
          // Notify if cases increased significantly
          if (data.cases > oldCases + 3) {
            await notifyOwners(existingAlert, "updated");
          }
          
          alerts.push(existingAlert);
        }
      }
    }

    return alerts;
  } catch (error) {
    console.error("Error generating alerts:", error);
    throw error;
  }
};

// ====================================================================
// GET ALL DISEASE ALERTS
// GET /api/disease-alerts
// ====================================================================
export const getAllAlerts = async (req, res) => {
  try {
    const { status, severity, area } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (area) query.area = new RegExp(area, "i");

    const alerts = await DiseaseAlert.find(query)
      .sort({ severity: -1, createdAt: -1 })
      .exec();

    return res.status(200).json({
      success: true,
      count: alerts.length,
      alerts: alerts,
    });
  } catch (error) {
    console.error("Get alerts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch disease alerts",
      error: error.message,
    });
  }
};

// ====================================================================
// CREATE DISEASE ALERT (Manual)
// POST /api/disease-alerts
// ====================================================================
export const createAlert = async (req, res) => {
  try {
    const { disease, area, cases, severity, species, description, status } = req.body;

    // Validate required fields
    if (!disease || !area || !cases || !severity) {
      return res.status(400).json({
        success: false,
        message: "Please provide disease, area, cases, and severity",
      });
    }

    const alert = await DiseaseAlert.create({
      disease,
      area,
      cases,
      severity,
      species: species || "all",
      description: description || "",
      status: status || "active",
    });

    // Notify owners if alert is active
    if (alert.status === "active") {
      await notifyOwners(alert, "new");
    }

    console.log("Disease alert created:", alert._id);

    return res.status(201).json({
      success: true,
      message: "Disease alert created successfully",
      alert: alert,
    });
  } catch (error) {
    console.error("Create alert error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create disease alert",
      error: error.message,
    });
  }
};

// ====================================================================
// UPDATE DISEASE ALERT
// PUT /api/disease-alerts/:id
// ====================================================================
export const updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { disease, area, cases, severity, species, description, status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alert ID",
      });
    }

    const alert = await DiseaseAlert.findById(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    // Track status changes
    const oldStatus = alert.status;
    const oldCases = alert.cases;

    // Update fields
    if (disease) alert.disease = disease;
    if (area) alert.area = area;
    if (cases !== undefined) alert.cases = cases;
    if (severity) alert.severity = severity;
    if (species) alert.species = species;
    if (description !== undefined) alert.description = description;
    if (status) {
      alert.status = status;
      if (status === "resolved") {
        alert.resolvedAt = new Date();
      }
    }

    await alert.save();

    // Notify owners based on status change
    if (status && oldStatus !== status) {
      if (status === "resolved") {
        // Alert resolved - notify owners
        await notifyOwners(alert, "resolved");
      } else if (status === "active" && oldStatus !== "active") {
        // Alert reactivated - notify owners
        await notifyOwners(alert, "new");
      } else if (status === "monitoring") {
        // Status changed to monitoring - notify owners
        await notifyOwners(alert, "updated");
      }
    } else if (cases !== undefined && cases > oldCases + 3) {
      // Significant case increase - notify owners
      await notifyOwners(alert, "updated");
    }

    console.log("Disease alert updated:", alert._id);

    return res.status(200).json({
      success: true,
      message: "Disease alert updated successfully",
      alert: alert,
    });
  } catch (error) {
    console.error("Update alert error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update disease alert",
      error: error.message,
    });
  }
};

// ====================================================================
// DELETE DISEASE ALERT
// DELETE /api/disease-alerts/:id
// ====================================================================
export const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alert ID",
      });
    }

    const alert = await DiseaseAlert.findByIdAndDelete(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    console.log("Disease alert deleted:", id);

    return res.status(200).json({
      success: true,
      message: "Disease alert deleted successfully",
    });
  } catch (error) {
    console.error("Delete alert error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete disease alert",
      error: error.message,
    });
  }
};

// ====================================================================
// GET ALERT BY ID
// GET /api/disease-alerts/:id
// ====================================================================
export const getAlertById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alert ID",
      });
    }

    const alert = await DiseaseAlert.findById(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    return res.status(200).json({
      success: true,
      alert: alert,
    });
  } catch (error) {
    console.error("Get alert error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch disease alert",
      error: error.message,
    });
  }
};

// ====================================================================
// TRIGGER ALERT GENERATION (Admin action)
// POST /api/disease-alerts/generate
// ====================================================================
export const triggerAlertGeneration = async (req, res) => {
  try {
    console.log("Triggering disease alert generation...");

    const alerts = await generateAlertsFromConsultations();

    return res.status(200).json({
      success: true,
      message: `Generated ${alerts.length} disease alerts`,
      alerts: alerts,
    });
  } catch (error) {
    console.error("Generate alerts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate disease alerts",
      error: error.message,
    });
  }
};