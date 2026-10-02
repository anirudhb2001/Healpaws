import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Pet from "../models/Pet.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const petsUploadsDir = path.join(__dirname, "..", "uploads", "pets");
if (!fs.existsSync(petsUploadsDir)) {
  fs.mkdirSync(petsUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, petsUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) cb(null, true);
    else cb(new Error("Only .png, .jpg, .jpeg and .pdf files allowed!"));
  },
});

// ==================== GET ALL PETS (for admin) - MUST BE FIRST ====================
router.get("/", async (req, res) => {
  try {
    const pets = await Pet.find()
      .populate("ownerId", "name email")
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: pets.length,
      pets,
    });
  } catch (error) {
    console.error("Get all pets error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: " + error.message,
    });
  }
});

// ==================== CREATE PET ====================
router.post(
  "/",
  upload.fields([
    { name: "petPhoto", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      console.log("Creating new pet profile");
      console.log("Body:", req.body);
      console.log("Files:", req.files);

      const {
        ownerId, name, species, breed, gender, dateOfBirth,
        age, weight, color, microchipId, allergies, medications,
        specialNeeds, vaccinationHistory, pastConsultations,
      } = req.body;

      if (!ownerId || !name || !species || !breed || !gender || !weight) {
        return res.status(400).json({
          success: false,
          message: "Please provide all required fields (ownerId, name, species, breed, gender, weight)",
        });
      }

      const petData = {
        ownerId,
        name,
        species,
        breed,
        gender,
        weight: parseFloat(weight),
        dateOfBirth: dateOfBirth || null,
        age: age ? parseInt(age) : null,
        color: color || null,
        microchipId: microchipId || null,
        allergies: allergies || null,
        medications: medications || null,
        specialNeeds: specialNeeds || null,
        vaccinationHistory: vaccinationHistory || null,
        pastConsultations: pastConsultations || null,
      };

      if (req.files && req.files.petPhoto && req.files.petPhoto[0]) {
        petData.petPhoto = path.join("uploads", "pets", req.files.petPhoto[0].filename);
      }

      if (req.files && req.files.documents && req.files.documents.length > 0) {
        petData.documents = req.files.documents.map((file) =>
          path.join("uploads", "pets", file.filename)
        );
      }

      const pet = await Pet.create(petData);
      console.log("Pet created successfully:", pet._id);

      res.status(201).json({
        success: true,
        message: "Pet registered successfully!",
        pet,
      });
    } catch (error) {
      console.error("Create pet error:", error);
      res.status(500).json({
        success: false,
        message: "Server Error: " + error.message,
      });
    }
  }
);

// ==================== GET ALL PETS BY OWNER ====================
router.get("/owner/:ownerId", async (req, res) => {
  try {
    const { ownerId } = req.params;
    console.log("Fetching pets for owner:", ownerId);

    const pets = await Pet.find({ ownerId }).sort({ createdAt: -1 });

    console.log(`Found ${pets.length} pets for owner ${ownerId}`);

    res.status(200).json({
      success: true,
      count: pets.length,
      pets,
    });
  } catch (error) {
    console.error("Get owner pets error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: " + error.message,
    });
  }
});

// ==================== GET SINGLE PET ====================
router.get("/:petId", async (req, res) => {
  try {
    console.log("Fetching pet:", req.params.petId);

    const pet = await Pet.findById(req.params.petId).populate("ownerId", "name email");

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    console.log("Pet found:", pet.name);

    res.status(200).json({
      success: true,
      pet,
    });
  } catch (error) {
    console.error("Get pet error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: " + error.message,
    });
  }
});

// ==================== UPDATE PET ====================
router.put(
  "/:petId",
  upload.fields([
    { name: "petPhoto", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      console.log("Updating pet:", req.params.petId);
      console.log("Update data:", req.body);
      console.log("Files:", req.files);

      const pet = await Pet.findById(req.params.petId);

      if (!pet) {
        return res.status(404).json({
          success: false,
          message: "Pet not found",
        });
      }

      // Prepare update data
      const updateData = {
        name: req.body.name || pet.name,
        species: req.body.species || pet.species,
        breed: req.body.breed || pet.breed,
        gender: req.body.gender || pet.gender,
        weight: req.body.weight ? parseFloat(req.body.weight) : pet.weight,
      };

      // Update optional fields only if provided
      if (req.body.dateOfBirth !== undefined) {
        updateData.dateOfBirth = req.body.dateOfBirth || null;
      }
      if (req.body.age !== undefined) {
        updateData.age = req.body.age ? parseInt(req.body.age) : null;
      }
      if (req.body.color !== undefined) {
        updateData.color = req.body.color || null;
      }
      if (req.body.microchipId !== undefined) {
        updateData.microchipId = req.body.microchipId || null;
      }
      if (req.body.allergies !== undefined) {
        updateData.allergies = req.body.allergies || null;
      }
      if (req.body.medications !== undefined) {
        updateData.medications = req.body.medications || null;
      }
      if (req.body.specialNeeds !== undefined) {
        updateData.specialNeeds = req.body.specialNeeds || null;
      }
      if (req.body.vaccinationHistory !== undefined) {
        updateData.vaccinationHistory = req.body.vaccinationHistory || null;
      }
      if (req.body.pastConsultations !== undefined) {
        updateData.pastConsultations = req.body.pastConsultations || null;
      }

      // Handle new pet photo upload
      if (req.files && req.files.petPhoto && req.files.petPhoto[0]) {
        // Delete old photo if exists
        if (pet.petPhoto) {
          const oldPhotoPath = path.join(__dirname, "..", pet.petPhoto);
          if (fs.existsSync(oldPhotoPath)) {
            try {
              fs.unlinkSync(oldPhotoPath);
              console.log("Deleted old pet photo");
            } catch (err) {
              console.error("Error deleting old photo:", err);
            }
          }
        }
        updateData.petPhoto = path.join("uploads", "pets", req.files.petPhoto[0].filename);
        console.log("New pet photo uploaded");
      }

      // Handle new document uploads
      if (req.files && req.files.documents && req.files.documents.length > 0) {
        const newDocs = req.files.documents.map((file) =>
          path.join("uploads", "pets", file.filename)
        );
        // Append new documents to existing ones
        updateData.documents = [...(pet.documents || []), ...newDocs];
        console.log(`Added ${newDocs.length} new documents`);
      }

      // Perform update
      const updatedPet = await Pet.findByIdAndUpdate(
        req.params.petId,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

      console.log("Pet updated successfully:", updatedPet.name);

      res.status(200).json({
        success: true,
        message: "Pet updated successfully",
        pet: updatedPet,
      });
    } catch (error) {
      console.error("Update pet error:", error);
      res.status(500).json({
        success: false,
        message: "Server Error: " + error.message,
      });
    }
  }
);

// ==================== DELETE PET ====================
router.delete("/:petId", async (req, res) => {
  try {
    console.log("Deleting pet:", req.params.petId);

    const pet = await Pet.findById(req.params.petId);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    // Delete associated files
    if (pet.petPhoto) {
      const photoPath = path.join(__dirname, "..", pet.petPhoto);
      if (fs.existsSync(photoPath)) {
        try {
          fs.unlinkSync(photoPath);
          console.log("Deleted pet photo");
        } catch (err) {
          console.error("Error deleting photo:", err);
        }
      }
    }

    if (pet.documents && pet.documents.length > 0) {
      pet.documents.forEach((doc) => {
        const docPath = path.join(__dirname, "..", doc);
        if (fs.existsSync(docPath)) {
          try {
            fs.unlinkSync(docPath);
            console.log("Deleted document:", doc);
          } catch (err) {
            console.error("Error deleting document:", err);
          }
        }
      });
    }

    await Pet.findByIdAndDelete(req.params.petId);

    console.log("Pet deleted successfully");

    res.status(200).json({
      success: true,
      message: "Pet deleted successfully",
    });
  } catch (error) {
    console.error("Delete pet error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: " + error.message,
    });
  }
});

export default router;