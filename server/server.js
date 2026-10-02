import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/database.js";
import userRoutes from "./routes/userRoutes.js";
import petRoutes from "./routes/petRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import { createDefaultAdmin } from "./utils/createDefaultAdmin.js";
import consultationRoutes from "./routes/consultationRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import diseaseAlertRoutes from "./routes/diseaseAlertRoutes.js";
import { startCronJobs } from "./utils/cronJobs.js";
import aiRoutes from "./routes/aiRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

// =====================================================
// MIDDLEWARE (ORDER MATTERS!)
// =====================================================

// Security - Configure helmet to allow images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// CORS - Must be before routes
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173", // Vite
  ],
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files - MUST be before routes to serve images properly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Logging
app.use(morgan('dev'));

// =====================================================
// DATABASE & INITIALIZATION
// =====================================================
connectDB();
createDefaultAdmin();
startCronJobs();

// =====================================================
// API ROUTES
// =====================================================

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "VetAI Node.js Backend",
    timestamp: new Date().toISOString()
  });
});

// Mount all API routes
app.use("/api/users", userRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/disease-alerts", diseaseAlertRoutes);
app.use("/api", aiRoutes); // AI routes mounted at /api

// Root endpoint - ONLY ONE, at the end
app.get("/", (req, res) => {
  res.json({
    message: "VetAI Backend API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "GET /health",
      aiHealth: "GET /api/ai/health",
      aiConfig: "GET /api/ai/config",
      predictImage: "POST /api/predict/image",
      predictImages: "POST /api/predict/images",
      diagnoseChat: "POST /api/diagnose/chat",
      resetSession: "POST /api/session/reset",
      users: "POST /api/users/register, /login",
      pets: "GET /api/pets/owner/:ownerId",
      consultations: "GET /api/consultations/owner/:ownerId",
    }
  });
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// =====================================================
// START SERVER
// =====================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("\n" + "=".repeat(70));
  console.log("VetAI Node.js Backend Server");
  console.log("=".repeat(70));
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`AI Service: http://localhost:5001`);
  console.log(`Static files: http://localhost:${PORT}/uploads`);
  console.log("\n Available Endpoints:");
  console.log("   GET  /health              - Node.js health check");
  console.log("   GET  /api/ai/health       - Flask AI service health");
  console.log("   GET  /api/ai/config       - AI configuration");
  console.log("   POST /api/predict/image   - Single image prediction");
  console.log("   POST /api/predict/images  - Batch image prediction");
  console.log("   POST /api/diagnose/chat   - Chat diagnosis");
  console.log("   POST /api/session/reset   - Reset chat session");
  console.log("\n Make sure Flask server is running on port 5001");
  console.log("   python flask_api.py");
  console.log("=".repeat(70) + "\n");
});