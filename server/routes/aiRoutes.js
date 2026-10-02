// import express from "express";
// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import { 
//   predictMultipleImages, 
//   predictSingleImage,
//   predictByChat
// } from "../controllers/aiController.js";

// const router = express.Router();

// // Ensure uploads directory exists
// const uploadsDir = "uploads/";
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadsDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const fileFilter = (req, file, cb) => {
//   // Accept images only
//   const allowedTypes = /jpeg|jpg|png|gif|webp|bmp/;
//   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = allowedTypes.test(file.mimetype);

//   if (mimetype && extname) {
//     return cb(null, true);
//   } else {
//     cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp, bmp)"));
//   }
// };

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB per file
//     files: 5 // Maximum 5 files
//   },
//   fileFilter: fileFilter
// });

// // ============================================
// // IMAGE-BASED DIAGNOSIS ROUTES
// // ============================================

// // POST /api/ai/predict - Single file (backward compatibility)
// router.post("/predict", upload.single("file"), predictSingleImage);

// // POST /api/ai/predict-multiple - Multiple files
// router.post("/predict-multiple", upload.array("files", 5), predictMultipleImages);

// // ============================================
// // TEXT/CHAT-BASED DIAGNOSIS ROUTES
// // ============================================

// // POST /api/ai/diagnose/chat - Chat-based diagnosis (no file upload)
// router.post("/diagnose/chat", predictByChat);

// // ============================================
// // HEALTH CHECK ROUTE
// // ============================================

// // GET /api/ai/health - Check if AI service is available
// router.get("/health", async (req, res) => {
//   try {
//     const axios = (await import('axios')).default;
//     const response = await axios.get("http://localhost:5001/health", {
//       timeout: 5000
//     });
    
//     return res.status(200).json({
//       success: true,
//       aiService: response.data,
//       nodeService: {
//         status: "healthy",
//         timestamp: new Date().toISOString()
//       }
//     });
//   } catch (err) {
//     return res.status(503).json({
//       success: false,
//       error: "AI service is unavailable",
//       nodeService: {
//         status: "healthy",
//         timestamp: new Date().toISOString()
//       }
//     });
//   }
// });

// // ============================================
// // ERROR HANDLING MIDDLEWARE
// // ============================================

// // Error handling middleware for multer
// router.use((err, req, res, next) => {
//   // Clean up any uploaded files on error
//   if (req.file && fs.existsSync(req.file.path)) {
//     fs.unlinkSync(req.file.path);
//   }
//   if (req.files && Array.isArray(req.files)) {
//     req.files.forEach(file => {
//       if (fs.existsSync(file.path)) {
//         fs.unlinkSync(file.path);
//       }
//     });
//   }

//   // Handle multer errors
//   if (err instanceof multer.MulterError) {
//     if (err.code === "LIMIT_FILE_SIZE") {
//       return res.status(400).json({ 
//         success: false,
//         error: "File size too large. Maximum size is 10MB per file." 
//       });
//     }
//     if (err.code === "LIMIT_FILE_COUNT") {
//       return res.status(400).json({ 
//         success: false,
//         error: "Too many files. Maximum 5 files allowed." 
//       });
//     }
//     if (err.code === "LIMIT_UNEXPECTED_FILE") {
//       return res.status(400).json({ 
//         success: false,
//         error: "Unexpected field in file upload." 
//       });
//     }
//     return res.status(400).json({ 
//       success: false,
//       error: err.message 
//     });
//   }
  
//   // Handle other errors
//   if (err) {
//     return res.status(400).json({ 
//       success: false,
//       error: err.message 
//     });
//   }
  
//   next();
// });

// export default router;

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

// Import controllers
import {
  predictSingleImage,
  predictMultipleImages,
  predictByChat,
  resetChatSession,
  checkAIHealth,
  getAIConfig
} from "../controllers/aiController.js"; // Adjust path as needed

const router = express.Router();

// =====================================================
// MULTER CONFIGURATION
// =====================================================

// Create uploads directory if it doesn't exist
const uploadsDir = "./uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|bmp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, bmp)"));
  }
};

// Multer instances
const uploadSingle = multer({
  storage: storage,
  limits: {
    fileSize: 16 * 1024 * 1024 // 16MB max file size
  },
  fileFilter: fileFilter
});

const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB per file
    files: 10 // Max 10 files per request
  },
  fileFilter: fileFilter
});

// =====================================================
// AI SERVICE HEALTH & CONFIG
// =====================================================

/**
 * GET /api/ai/health
 * Check if Flask AI service is running
 */
router.get("/ai/health", checkAIHealth);

/**
 * GET /api/ai/config
 * Get AI system configuration (supported pets, features, etc.)
 */
router.get("/ai/config", getAIConfig);

// =====================================================
// IMAGE PREDICTION ROUTES
// =====================================================

/**
 * POST /api/predict/image
 * Single image prediction
 * 
 * Form Data:
 *   - file: image file
 *   - animal_type: "cat", "dog", or "cattle"
 * 
 * Response:
 *   {
 *     success: true,
 *     diagnosis: {
 *       prediction: "Skin Disease",
 *       confidence: 87.5,
 *       is_healthy: false,
 *       severity: "high",
 *       urgency: "urgent",
 *       recommendation: "...",
 *       appointment_required: true
 *     },
 *     animalType: "dog",
 *     message: "..."
 *   }
 */
router.post(
  "/predict/image",
  uploadSingle.single("file"),
  predictSingleImage
);

/**
 * POST /api/predict/images
 * Multiple image prediction (batch)
 * 
 * Form Data:
 *   - files: array of image files
 *   - animal_type: "cat", "dog", or "cattle"
 * 
 * Response:
 *   {
 *     success: true,
 *     diagnosis: {
 *       results: [...],
 *       aggregate: {
 *         average_confidence: 85.2,
 *         appointment_recommended: true
 *       }
 *     }
 *   }
 */
router.post(
  "/predict/images",
  uploadMultiple.array("files", 10),
  predictMultipleImages
);

// Backward compatibility aliases
router.post(
  "/predict/batch",
  uploadMultiple.array("files", 10),
  predictMultipleImages
);

// =====================================================
// CHAT DIAGNOSIS ROUTES
// =====================================================

/**
 * POST /api/diagnose/chat
 * Chat-based symptom diagnosis
 * 
 * JSON Body:
 *   {
 *     "message": "My dog is scratching a lot",
 *     "animal_type": "dog",
 *     "user_id": "optional_session_id"
 *   }
 * 
 * Response:
 *   {
 *     success: true,
 *     diagnosis: {
 *       symptoms: ["Itching/Scratching"],
 *       symptom_count: 1,
 *       confidence: 75.5,
 *       severity: "mild",
 *       urgency: "low",
 *       message: "...",
 *       recommendation: "...",
 *       appointment_required: false,
 *       follow_up_questions: [...]
 *     },
 *     session_id: "...",
 *     animal_type: "dog"
 *   }
 */
router.post("/diagnose/chat", predictByChat);

/**
 * POST /api/session/reset
 * Reset chat conversation session
 * 
 * JSON Body:
 *   {
 *     "session_id": "user123"
 *   }
 */
router.post("/session/reset", resetChatSession);

// =====================================================
// ERROR HANDLING MIDDLEWARE
// =====================================================

// Handle multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 16MB per file."
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: "Too many files. Maximum is 10 files per request."
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  next();
});

export default router;