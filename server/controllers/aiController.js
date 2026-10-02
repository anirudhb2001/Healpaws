import fs from "fs";
import FormData from "form-data";
import axios from "axios";

const FLASK_API_URL = "http://localhost:5001";

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Clean up uploaded files
 */
const cleanupFiles = (filePaths) => {
  filePaths.forEach(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error(`Failed to delete file: ${filePath}`, err.message);
    }
  });
};

/**
 * Handle Flask API errors
 */
const handleFlaskError = (err, res) => {
  console.error("Flask API Error:", err.message);

  if (err.code === "ECONNREFUSED") {
    return res.status(503).json({ 
      success: false,
      error: "AI service is unavailable. Please try again later.",
      details: "Flask server is not running on port 5001"
    });
  }

  if (err.response) {
    return res.status(err.response.status).json({
      success: false,
      error: err.response.data.error || "AI prediction failed",
      details: err.response.data
    });
  }

  if (err.code === "ETIMEDOUT") {
    return res.status(504).json({
      success: false,
      error: "AI service timeout. Please try again."
    });
  }

  return res.status(500).json({ 
    success: false,
    error: "AI service failed. Please try again.",
    details: err.message
  });
};

// =====================================================
// IMAGE PREDICTION ENDPOINTS
// =====================================================

/**
 * POST - Predict multiple images (Batch)
 * Endpoint: /api/predict/images
 * 
 * Request:
 *   - files: Array of image files
 *   - animal_type: "cat", "dog", or "cattle"
 */
export const predictMultipleImages = async (req, res) => {
  const uploadedFiles = [];

  try {
    // Validate files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "No files uploaded. Please upload at least one image." 
      });
    }

    // Get animal type
    const animalType = (req.body.animal_type || req.body.animalType || 'dog').toLowerCase();
    
    // Validate animal type for image analysis
    const validImageTypes = ['cat', 'dog', 'cattle'];
    if (!validImageTypes.includes(animalType)) {
      return res.status(400).json({
        success: false,
        error: `Image analysis only supports: ${validImageTypes.join(', ')}`,
        provided: animalType
      });
    }

    uploadedFiles.push(...req.files.map(f => f.path));

    // Prepare FormData
    const formData = new FormData();
    formData.append("animal_type", animalType);
    
    req.files.forEach((file) => {
      formData.append("files", fs.createReadStream(file.path), {
        filename: file.originalname,
        contentType: file.mimetype
      });
    });

    // Call Flask API - CORRECTED ENDPOINT
    const response = await axios.post(
      `${FLASK_API_URL}/api/predict/batch`,  // ✅ Fixed endpoint
      formData,
      { 
        headers: formData.getHeaders(),
        timeout: 90000, // 90 seconds for multiple images
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    // Clean up uploaded files
    cleanupFiles(uploadedFiles);

    // Extract Flask response
    const flaskData = response.data;

    // Return formatted response
    return res.status(200).json({
      success: true,
      diagnosis: {
        results: flaskData.results,
        aggregate: flaskData.aggregate,
        count: flaskData.count,
        successful: flaskData.successful
      },
      animalType: animalType,
      filesProcessed: req.files.length,
      message: "Batch AI analysis completed successfully"
    });

  } catch (err) {
    cleanupFiles(uploadedFiles);
    return handleFlaskError(err, res);
  }
};

/**
 * POST - Predict single image
 * Endpoint: /api/predict/image
 * 
 * Request:
 *   - file: Single image file
 *   - animal_type: "cat", "dog", or "cattle"
 */
export const predictSingleImage = async (req, res) => {
  let filePath = null;

  try {
    // Validate file
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: "No file uploaded. Please upload an image." 
      });
    }

    // Get animal type
    const animalType = (req.body.animal_type || req.body.animalType || 'dog').toLowerCase();
    
    // Validate animal type for image analysis
    const validImageTypes = ['cat', 'dog', 'cattle'];
    if (!validImageTypes.includes(animalType)) {
      return res.status(400).json({
        success: false,
        error: `Image analysis only supports: ${validImageTypes.join(', ')}`,
        provided: animalType
      });
    }

    filePath = req.file.path;

    // Prepare FormData
    const formData = new FormData();
    formData.append("animal_type", animalType);
    formData.append("file", fs.createReadStream(filePath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Call Flask API - CORRECTED ENDPOINT
    const response = await axios.post(
      `${FLASK_API_URL}/api/predict/image`,  // ✅ Fixed endpoint
      formData,
      { 
        headers: formData.getHeaders(),
        timeout: 60000 // 60 seconds
      }
    );

    // Clean up uploaded file
    cleanupFiles([filePath]);

    // Extract Flask response
    const flaskData = response.data;

    // Return formatted response
    return res.status(200).json({
      success: true,
      diagnosis: {
        prediction: flaskData.prediction,
        confidence: flaskData.confidence,
        is_healthy: flaskData.is_healthy,
        severity: flaskData.severity,
        urgency: flaskData.urgency,
        recommendation: flaskData.recommendation,
        appointment_required: flaskData.appointment_required,
        prediction_mode: flaskData.prediction_mode || "unknown",
        // Multi-class specific fields
        disease_name: flaskData.disease_name || flaskData.prediction,
        disease_key: flaskData.disease_key || null,
        disease_description: flaskData.disease_description || null,
        symptoms: flaskData.symptoms || [],
        treatment: flaskData.treatment || [],
        home_care: flaskData.home_care || null,
        all_predictions: flaskData.all_predictions || []
      },
      animalType: animalType,
      message: flaskData.message || "AI analysis completed successfully"
    });

  } catch (err) {
    if (filePath) cleanupFiles([filePath]);
    return handleFlaskError(err, res);
  }
};

// =====================================================
// CHAT DIAGNOSIS ENDPOINT
// =====================================================

/**
 * POST - Chat-based diagnosis (text only)
 * Endpoint: /api/diagnose/chat
 * 
 * Request Body:
 *   - message: Symptom description
 *   - animal_type: Any pet type (cat, dog, cattle, bird, rabbit, etc.)
 *   - user_id: Optional session identifier
 */
export const predictByChat = async (req, res) => {
  try {
    const { message, animal_type, user_id } = req.body;

    // Validate input
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required for chat diagnosis"
      });
    }

    if (!animal_type || !animal_type.trim()) {
      return res.status(400).json({
        success: false,
        error: "animal_type is required"
      });
    }

    // All pet types are valid for chat
    const validPetTypes = [
      'cat', 'dog', 'cattle', 
      'bird', 'rabbit', 'hamster', 'guinea_pig', 'other'
    ];
    
    const petType = animal_type.toLowerCase().trim();
    
    if (!validPetTypes.includes(petType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid animal_type. Supported: ${validPetTypes.join(', ')}`,
        provided: animal_type
      });
    }

    // Call Flask API - CORRECTED ENDPOINT
    const response = await axios.post(
      `${FLASK_API_URL}/api/diagnose/chat`,  // ✅ Fixed endpoint
      {
        message: message.trim(),
        animal_type: petType,
        user_id: user_id || `user_${Date.now()}`
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000 // 30 seconds
      }
    );

    // Extract Flask response
    const flaskData = response.data;

    // Return formatted response
    return res.status(200).json({
      success: true,
      diagnosis: {
        symptoms: flaskData.symptoms,
        symptom_count: flaskData.symptom_count,
        confidence: flaskData.confidence,
        severity: flaskData.severity,
        urgency: flaskData.urgency,
        message: flaskData.message,
        recommendation: flaskData.recommendation,
        appointment_required: flaskData.appointment_required,
        follow_up_questions: flaskData.follow_up_questions
      },
      session_id: flaskData.session_id,
      animal_type: petType,
      message: "Chat diagnosis completed successfully"
    });

  } catch (err) {
    return handleFlaskError(err, res);
  }
};

// =====================================================
// UTILITY ENDPOINTS
// =====================================================

/**
 * POST - Reset chat session
 * Endpoint: /api/session/reset
 * 
 * Request Body:
 *   - session_id: Session to reset
 */
export const resetChatSession = async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: "session_id is required"
      });
    }

    const response = await axios.post(
      `${FLASK_API_URL}/api/session/reset`,
      { session_id },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      }
    );

    return res.status(200).json({
      success: true,
      message: response.data.message
    });

  } catch (err) {
    return handleFlaskError(err, res);
  }
};

/**
 * GET - Health check for AI service
 * Endpoint: /api/ai/health
 */
export const checkAIHealth = async (req, res) => {
  try {
    const response = await axios.get(
      `${FLASK_API_URL}/health`,
      { timeout: 5000 }
    );

    return res.status(200).json({
      success: true,
      flask_status: response.data,
      message: "AI service is healthy"
    });

  } catch (err) {
    return res.status(503).json({
      success: false,
      error: "AI service is unavailable",
      details: err.message
    });
  }
};

/**
 * GET - Get AI system configuration
 * Endpoint: /api/ai/config
 */
export const getAIConfig = async (req, res) => {
  try {
    const response = await axios.get(
      `${FLASK_API_URL}/api/config`,
      { timeout: 5000 }
    );

    return res.status(200).json({
      success: true,
      config: response.data,
      message: "AI configuration retrieved successfully"
    });

  } catch (err) {
    return handleFlaskError(err, res);
  }
};

// =====================================================
// EXPORT ALL FUNCTIONS
// =====================================================

export default {
  predictSingleImage,
  predictMultipleImages,
  predictByChat,
  resetChatSession,
  checkAIHealth,
  getAIConfig
};