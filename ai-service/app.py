import os
import json
import pickle
import numpy as np
import tensorflow as tf

from disease_knowledge import get_disease_report, DISEASE_DATABASE


try:
    # Try new import path first (TF 2.16+)
    from keras.utils import load_img, img_to_array
    from keras.applications.efficientnet import preprocess_input
except ImportError:
    # Fall back to old path (TF < 2.16)
    from tensorflow.keras.preprocessing import image
    load_img = image.load_img
    img_to_array = image.img_to_array
    from tensorflow.keras.applications.efficientnet import preprocess_input

# =====================================================
# CONFIG
# =====================================================
IMG_SIZE = 224
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}

# ---- MULTI-CLASS MODEL PATHS (preferred) ----
PET_MULTICLASS_MODEL_PATH = "weights/pet_skin_multiclass.keras"
PET_CLASSES_PATH = "weights/pet_classes.json"
CATTLE_MULTICLASS_MODEL_PATH = "weights/cattle_lumpy_skin_fixed.keras"
CATTLE_CLASSES_PATH = "weights/cattle_classes.json"

# ---- LEGACY BINARY MODEL PATHS (fallback) ----
CAT_MODEL_PATH = "weights/cat_skin_final.keras"
DOG_MODEL_PATH = "weights/dog_skin_sigmoid.keras"

# ---- CHAT MODEL PATHS ----
SYMPTOM_CLASSIFIER_PATH = "weights/symptom_classifier.pkl"
SYMPTOM_VECTORIZER_PATH = "weights/symptom_vectorizer.pkl"
HEALTHPAWS_MODEL_PATH = "weights/healthpaws_final_model.keras"

# ---- LEGACY BINARY CLASS NAMES (used only for fallback) ----
CAT_CLASSES = ["non_skin", "skin"]
DOG_CLASSES = ["non_skin", "skin"]
CATTLE_CLASSES = ["healthy", "lumpy_skin"]

# ---- LEGACY THRESHOLDS ----
CAT_THRESHOLD = 0.30
DOG_THRESHOLD = 0.30
CATTLE_THRESHOLD = 0.45

# ---- PET CONFIGURATION ----
PETS_WITH_IMAGE_SUPPORT = ["cat", "dog", "cattle"]
PETS_TEXT_ONLY = ["bird", "rabbit", "hamster", "guinea_pig", "other"]
ALL_PETS = PETS_WITH_IMAGE_SUPPORT + PETS_TEXT_ONLY

# ---- MODEL CLASS → DISEASE_DATABASE KEY MAPPING ----
# The pet model outputs generic class names (e.g., 'dental_disease').
# The DISEASE_DATABASE uses animal-specific keys (e.g., 'dental_disease_cat').
# Some classes are animal-specific and don't need a suffix.
CLASS_TO_DISEASE_KEY = {
    "cat": {
        "dental_disease": "dental_disease_cat",
        "ear_infection": "ear_mites_cat",
        "eye_infection": "eye_infection_cat",
        "feline_leukemia": "feline_leukemia",
        "feline_panleukopenia": "feline_panleukopenia",
        "fungal_infection": "fungal_infection_cat",
        "ringworm": "ringworm_cat",
        "scabies": "scabies_cat",
        "skin_allergy": "skin_allergy_cat",
        "urinary_infection": "urinary_tract_infection_cat",
        "worm_infection": "worm_infection_cat",
    },
    "dog": {
        "dental_disease": "dental_disease_dog",
        "distemper": "distemper_dog",
        "eye_infection": "eye_infection_dog",
        "fungal_infection": "fungal_infection_dog",
        "hot_spots": "hot_spots_dog",
        "kennel_cough": "kennel_cough_dog",
        "mange": "mange_dog",
        "parvovirus": "parvovirus_dog",
        "skin_allergy": "skin_allergy_dog",
        "tick_infestation": "tick_infestation_dog",
        "worm_infection": "worm_infection_dog",
    }
}

def _map_class_to_disease_key(class_name, animal_type):
    """Map model class name to DISEASE_DATABASE key using animal type."""
    mapping = CLASS_TO_DISEASE_KEY.get(animal_type, {})
    return mapping.get(class_name, class_name)

# =====================================================
# GLOBAL VARIABLES
# =====================================================
# Multi-class models (preferred)
pet_multiclass_model = None
pet_class_names = None
cattle_multiclass_model = None
cattle_class_names = None
multiclass_available = False

# Legacy binary models (fallback)
cat_model = None
dog_model = None
cattle_model = None
image_models_loaded = False

symptom_classifier = None
symptom_vectorizer = None
healthpaws_model = None
chat_models_loaded = False

conversation_context = {}

# =====================================================
# UTILITY FUNCTIONS
# =====================================================
def validate_animal_type(animal_type, require_image_support=False):
    """Validate animal type"""
    animal_type = animal_type.lower()
    
    if require_image_support:
        if animal_type not in PETS_WITH_IMAGE_SUPPORT:
            return False, f"Image analysis only supports: {', '.join(PETS_WITH_IMAGE_SUPPORT)}"
    else:
        if animal_type not in ALL_PETS:
            return False, f"Invalid pet type. Supported: {', '.join(ALL_PETS)}"
    
    return True, animal_type


def safe_pickle_load(file_path):
    """Load pickle files with multiple fallback methods"""
    methods = [
        ("standard", lambda: pickle.load(open(file_path, 'rb'))),
        ("latin1", lambda: pickle.load(open(file_path, 'rb'), encoding='latin1')),
        ("bytes", lambda: pickle.load(open(file_path, 'rb'), encoding='bytes')),
    ]
    
    # Try joblib if available
    try:
        import joblib
        methods.append(("joblib", lambda: joblib.load(file_path)))
    except ImportError:
        pass
    
    for method_name, load_func in methods:
        try:
            obj = load_func()
            print(f"      ✓ Loaded with {method_name}")
            return obj, None
        except Exception as e:
            print(f"      × {method_name} failed: {str(e)[:50]}")
    
    return None, "All loading methods failed"


# =====================================================
# MODEL LOADING
# =====================================================
def _load_class_mapping(json_path):
    """Load class name mapping from JSON file."""
    try:
        with open(json_path, 'r') as f:
            classes = json.load(f)
        if isinstance(classes, list) and len(classes) > 0:
            return classes
    except Exception as e:
        print(f"      Could not load class mapping {json_path}: {e}")
    return None


def load_image_models():
    """Load image-based disease detection models.
    
    Priority: multi-class models first, then legacy binary as fallback.
    """
    global pet_multiclass_model, pet_class_names
    global cattle_multiclass_model, cattle_class_names
    global cat_model, dog_model, cattle_model
    global image_models_loaded, multiclass_available
    
    if image_models_loaded:
        return {"status": "success", "message": "Already loaded"}
    
    print("Loading image models...")
    results = {"loaded": [], "failed": [], "mode": "unknown"}
    
    os.makedirs("weights", exist_ok=True)
    
    # --- Try multi-class pet model first ---
    if os.path.exists(PET_MULTICLASS_MODEL_PATH) and os.path.exists(PET_CLASSES_PATH):
        try:
            pet_multiclass_model = tf.keras.models.load_model(PET_MULTICLASS_MODEL_PATH, compile=False)
            pet_class_names = _load_class_mapping(PET_CLASSES_PATH)
            if pet_class_names:
                multiclass_available = True
                results["loaded"].append("pet_multiclass")
                print(f"   Pet multi-class model loaded ({len(pet_class_names)} classes)")
            else:
                results["failed"].append("pet_multiclass: class mapping invalid")
        except Exception as e:
            results["failed"].append(f"pet_multiclass: {str(e)[:50]}")
            print(f"   Pet multi-class model error: {str(e)[:50]}")
    else:
        print("   Pet multi-class model not found, trying legacy binary models...")
    
    # --- Fallback: load legacy binary models if multi-class not available ---
    if not multiclass_available:
        if os.path.exists(CAT_MODEL_PATH):
            try:
                cat_model = tf.keras.models.load_model(CAT_MODEL_PATH, compile=False)
                results["loaded"].append("cat_binary")
                print(f"   Cat binary model loaded")
            except Exception as e:
                results["failed"].append(f"cat: {str(e)[:50]}")
        else:
            results["failed"].append("cat: file not found")
        
        if os.path.exists(DOG_MODEL_PATH):
            try:
                dog_model = tf.keras.models.load_model(DOG_MODEL_PATH, compile=False)
                results["loaded"].append("dog_binary")
                print(f"   Dog binary model loaded")
            except Exception as e:
                results["failed"].append(f"dog: {str(e)[:50]}")
        else:
            results["failed"].append("dog: file not found")
    
    # --- Cattle model (always try, supports both multi-class and binary) ---
    if os.path.exists(CATTLE_MULTICLASS_MODEL_PATH):
        try:
            cattle_multiclass_model = tf.keras.models.load_model(CATTLE_MULTICLASS_MODEL_PATH, compile=False)
            # Load class mapping if available, else use defaults
            if os.path.exists(CATTLE_CLASSES_PATH):
                cattle_class_names = _load_class_mapping(CATTLE_CLASSES_PATH)
            if not cattle_class_names:
                cattle_class_names = CATTLE_CLASSES
            results["loaded"].append("cattle")
            print(f"   Cattle model loaded ({len(cattle_class_names)} classes)")
        except Exception as e:
            results["failed"].append(f"cattle: {str(e)[:50]}")
            print(f"   Cattle model error")
    else:
        results["failed"].append("cattle: file not found")
    
    results["mode"] = "multiclass" if multiclass_available else "binary_fallback"
    
    if len(results["loaded"]) > 0:
        image_models_loaded = True
        print(f"Image models loaded: {', '.join(results['loaded'])} (mode: {results['mode']})")
    
    return results


def load_chat_models():
    """Load chat-based symptom analysis models"""
    global symptom_classifier, symptom_vectorizer, healthpaws_model, chat_models_loaded
    
    if chat_models_loaded:
        return {"status": "success", "message": "Already loaded"}
    
    print("🔄 Loading chat models...")
    results = {"loaded": [], "failed": []}
    
    # Symptom Classifier
    if os.path.exists(SYMPTOM_CLASSIFIER_PATH):
        obj, error = safe_pickle_load(SYMPTOM_CLASSIFIER_PATH)
        if obj:
            symptom_classifier = obj
            results["loaded"].append("classifier")
            print("   ✅ Classifier loaded")
        else:
            results["failed"].append(f"classifier: {error}")
    else:
        results["failed"].append("classifier: not found")
    
    # Symptom Vectorizer
    if os.path.exists(SYMPTOM_VECTORIZER_PATH):
        obj, error = safe_pickle_load(SYMPTOM_VECTORIZER_PATH)
        if obj:
            symptom_vectorizer = obj
            results["loaded"].append("vectorizer")
            print("   ✅ Vectorizer loaded")
        else:
            results["failed"].append(f"vectorizer: {error}")
    else:
        results["failed"].append("vectorizer: not found")
    
    # HealthPaws (Optional)
    if os.path.exists(HEALTHPAWS_MODEL_PATH):
        try:
            model = tf.keras.models.load_model(HEALTHPAWS_MODEL_PATH, compile=False)
            input_shape = model.input_shape
            
            # Check if it's image model (shouldn't be used for chat)
            if len(input_shape) == 4 and input_shape[1:3] == (224, 224):
                print("   ⚠️ HealthPaws expects images, skipping for chat")
                healthpaws_model = None
            else:
                healthpaws_model = model
                results["loaded"].append("healthpaws")
                print("   ✅ HealthPaws loaded")
        except Exception as e:
            results["failed"].append(f"healthpaws: {str(e)[:50]}")
    
    # We need at least classifier + vectorizer for chat
    if symptom_classifier and symptom_vectorizer:
        chat_models_loaded = True
        print(f"✅ Chat models: {len(results['loaded'])} loaded")
    
    return results


# =====================================================
# IMAGE PREDICTION
# =====================================================
def preprocess_image(img_path, use_preprocess_input=True):
    """Preprocess image for model.
    
    Args:
        img_path: Path to image file.
        use_preprocess_input: If True, apply EfficientNet preprocess_input (legacy models).
            If False, keep raw [0,255] pixels (EfficientNetB0 with built-in preprocessing).
    """
    try:
        img = load_img(img_path, target_size=(IMG_SIZE, IMG_SIZE))
        img_array = img_to_array(img)
        if use_preprocess_input:
            img_array = preprocess_input(img_array)
        img_array = np.expand_dims(img_array, axis=0)
        return img_array, None
    except Exception as e:
        return None, str(e)


def multiclass_predict(model, img_array, class_names, top_n=5):
    """Predict using multi-class softmax model.
    
    Returns:
        tuple: (predicted_class, confidence, all_predictions, error)
    """
    if model is None:
        return None, None, None, "Model not loaded"
    
    try:
        predictions = model.predict(img_array, verbose=0)
        probs = predictions[0]  # shape: (num_classes,)
        
        # Get top predictions sorted by probability
        sorted_indices = np.argsort(probs)[::-1]
        
        all_predictions = []
        for idx in sorted_indices[:top_n]:
            all_predictions.append({
                "class": class_names[idx],
                "probability": round(float(probs[idx]) * 100, 2)
            })
        
        top_idx = sorted_indices[0]
        predicted_class = class_names[top_idx]
        confidence = round(float(probs[top_idx]) * 100, 2)
        
        return predicted_class, confidence, all_predictions, None
    except Exception as e:
        return None, None, None, str(e)


def sigmoid_predict(model, img_array, classes, threshold):
    """Predict using legacy sigmoid model (binary fallback)."""
    if model is None:
        return None, None, "Model not loaded"
    
    try:
        predictions = model.predict(img_array, verbose=0)
        prob = float(predictions[0][0])
        prob = max(0.0, min(1.0, prob))
        
        label = classes[1] if prob >= threshold else classes[0]
        confidence = prob if label == classes[1] else 1 - prob
        
        return label, confidence, None
    except Exception as e:
        return None, None, str(e)


def predict_from_image(image_path, animal_type):
    """Main image prediction function.
    
    Uses multi-class model if available, falls back to binary sigmoid.
    Returns top-3 enriched predictions with disease reports for pet models.
    """
    # Validate animal type
    is_valid, result = validate_animal_type(animal_type, require_image_support=True)
    if not is_valid:
        return {"success": False, "error": result}
    
    animal_type = result
    
    # Load models if needed
    if not image_models_loaded:
        load_image_models()
    
    # Check file exists
    if not os.path.exists(image_path):
        return {"success": False, "error": "Image file not found"}
    
    # --- Multi-class prediction (preferred) ---
    if animal_type in ["cat", "dog"] and multiclass_available and pet_multiclass_model:
        # EfficientNetB0 has built-in preprocessing — use raw [0,255] pixels
        img_array, error = preprocess_image(image_path, use_preprocess_input=False)
        if error:
            return {"success": False, "error": f"Image processing failed: {error}"}
        
        predicted_class, confidence, all_predictions, error = multiclass_predict(
            pet_multiclass_model, img_array, pet_class_names
        )
        if error:
            return {"success": False, "error": error}
        
        # Map model class name to disease database key
        disease_key = _map_class_to_disease_key(predicted_class, animal_type)
        report = get_disease_report(disease_key, animal_type, confidence)
        
        # Build top-3 enriched predictions with disease reports
        top_predictions = []
        for pred in all_predictions[:3]:
            pred_disease_key = _map_class_to_disease_key(pred["class"], animal_type)
            pred_report = get_disease_report(pred_disease_key, animal_type, pred["probability"])
            top_predictions.append({
                "class": pred["class"],
                "disease_key": pred_disease_key,
                "disease_name": pred_report["disease_name"],
                "probability": pred["probability"],
                "description": pred_report["description"],
                "symptoms": pred_report["symptoms"],
                "treatment": pred_report["treatment"],
                "urgency": pred_report["urgency"],
                "home_care": pred_report["home_care"],
                "appointment_required": pred_report["appointment_required"]
            })
        
        return {
            "success": True,
            "diagnosis_type": "image_analysis",
            "prediction_mode": "multiclass",
            "animal_type": animal_type,
            "prediction": report["disease_name"],
            "confidence": confidence,
            "is_healthy": report["is_healthy"],
            "severity": _confidence_to_severity(confidence, report["is_healthy"]),
            "urgency": report["urgency"],
            "disease_name": report["disease_name"],
            "disease_key": report["disease_key"],
            "disease_description": report["description"],
            "symptoms": report["symptoms"],
            "treatment": report["treatment"],
            "home_care": report["home_care"],
            "recommendation": report["description"],
            "appointment_required": report["appointment_required"],
            "all_predictions": all_predictions,
            "top_predictions": top_predictions,
            "message": "No disease detected" if report["is_healthy"] else f"Detected: {report['disease_name']}"
        }
    
    # --- Cattle prediction (softmax multi-class) ---
    elif animal_type == "cattle" and cattle_multiclass_model:
        # Cattle model uses preprocess_input
        img_array, error = preprocess_image(image_path, use_preprocess_input=True)
        if error:
            return {"success": False, "error": f"Image processing failed: {error}"}
        
        predicted_class, confidence, all_predictions, error = multiclass_predict(
            cattle_multiclass_model, img_array, cattle_class_names
        )
        if error:
            return {"success": False, "error": error}
        
        report = get_disease_report(predicted_class, animal_type, confidence)
        
        return {
            "success": True,
            "diagnosis_type": "image_analysis",
            "prediction_mode": "multiclass",
            "animal_type": animal_type,
            "prediction": report["disease_name"],
            "confidence": confidence,
            "is_healthy": report["is_healthy"],
            "severity": _confidence_to_severity(confidence, report["is_healthy"]),
            "urgency": report["urgency"],
            "disease_name": report["disease_name"],
            "disease_key": report["disease_key"],
            "disease_description": report["description"],
            "symptoms": report["symptoms"],
            "treatment": report["treatment"],
            "home_care": report["home_care"],
            "recommendation": report["description"],
            "appointment_required": report["appointment_required"],
            "all_predictions": all_predictions,
            "message": "No disease detected" if report["is_healthy"] else f"Detected: {report['disease_name']}"
        }
    
    # --- Legacy binary fallback ---
    else:
        img_array, error = preprocess_image(image_path, use_preprocess_input=True)
        if error:
            return {"success": False, "error": f"Image processing failed: {error}"}
        return _predict_binary_fallback(img_array, animal_type)


def _confidence_to_severity(confidence, is_healthy):
    """Map confidence percentage to severity level."""
    if is_healthy:
        return "none"
    if confidence >= 70:
        return "high"
    if confidence >= 50:
        return "moderate"
    return "mild"


def _predict_binary_fallback(img_array, animal_type):
    """Legacy binary sigmoid prediction (used when multi-class model is unavailable)."""
    if animal_type == "cat":
        if not cat_model:
            return {"success": False, "error": "Cat model not available"}
        label, confidence, error = sigmoid_predict(cat_model, img_array, CAT_CLASSES, CAT_THRESHOLD)
    elif animal_type == "dog":
        if not dog_model:
            return {"success": False, "error": "Dog model not available"}
        label, confidence, error = sigmoid_predict(dog_model, img_array, DOG_CLASSES, DOG_THRESHOLD)
    elif animal_type == "cattle":
        if not cattle_model:
            return {"success": False, "error": "Cattle model not available"}
        label, confidence, error = sigmoid_predict(cattle_model, img_array, CATTLE_CLASSES, CATTLE_THRESHOLD)
    else:
        return {"success": False, "error": f"No model for {animal_type}"}
    
    if error:
        return {"success": False, "error": error}
    
    is_healthy = "non" in label.lower() or label.lower() == "healthy"
    confidence_percent = round(confidence * 100, 2)
    severity = _confidence_to_severity(confidence_percent, is_healthy)
    
    return {
        "success": True,
        "diagnosis_type": "image_analysis",
        "prediction_mode": "binary_legacy",
        "animal_type": animal_type,
        "prediction": label.replace("_", " ").title(),
        "confidence": confidence_percent,
        "is_healthy": is_healthy,
        "severity": severity,
        "urgency": "low" if is_healthy else ("urgent" if severity == "high" else "medium"),
        "message": "No disease detected" if is_healthy else f"Detected: {label.replace('_', ' ')}",
        "recommendation": f"Consult a veterinarian for your {animal_type}. This prediction used a basic binary model.",
        "appointment_required": not is_healthy and confidence_percent >= 50
    }


# =====================================================
# CHAT DIAGNOSIS
# =====================================================
def chat_diagnosis(user_message, animal_type, session_id="default"):
    """Chat-based symptom analysis"""
    
    # Validate animal type
    is_valid, result = validate_animal_type(animal_type, require_image_support=False)
    if not is_valid:
        return {"success": False, "error": result}
    
    animal_type = result
    
    # Initialize session
    if session_id not in conversation_context:
        conversation_context[session_id] = {
            "animal_type": animal_type,
            "messages": [],
            "symptoms": [],
            "confidence_scores": []
        }
    
    context = conversation_context[session_id]
    context["messages"].append(user_message)
    
    # Try ML diagnosis first
    if symptom_classifier and symptom_vectorizer:
        return chat_diagnosis_ml(user_message, animal_type, session_id, context)
    else:
        return chat_diagnosis_fallback(user_message, animal_type, session_id, context)


def chat_diagnosis_ml(user_message, animal_type, session_id, context):
    """ML-based symptom diagnosis"""
    
    try:
        # Vectorize and classify
        message_vec = symptom_vectorizer.transform([user_message])
        prediction = symptom_classifier.predict(message_vec)
        proba = symptom_classifier.predict_proba(message_vec)
        
        symptom = prediction[0]
        confidence = float(np.max(proba[0]))
        
        # Add to context if confident enough
        if confidence > 0.3 and symptom not in context["symptoms"]:
            context["symptoms"].append(symptom)
            context["confidence_scores"].append(confidence)
        
        return build_chat_response(context, animal_type, session_id, "ml")
    
    except Exception as e:
        print(f"ML diagnosis error: {e}")
        return chat_diagnosis_fallback(user_message, animal_type, session_id, context)


def chat_diagnosis_fallback(user_message, animal_type, session_id, context):
    """Rule-based symptom detection"""
    
    symptom_keywords = {
        "scratch": "Itching/Scratching",
        "itch": "Itching/Scratching",
        "red": "Redness",
        "patch": "Skin patches",
        "vomit": "Vomiting",
        "diarrhea": "Diarrhea",
        "cough": "Coughing",
        "sneez": "Sneezing",
        "letharg": "Lethargy",
        "tired": "Lethargy",
        "weak": "Weakness",
        "appetite": "Loss of appetite",
        "eating": "Eating issues",
        "limp": "Limping",
        "fever": "Fever",
        "discharge": "Discharge"
    }
    
    msg_lower = user_message.lower()
    
    for keyword, symptom in symptom_keywords.items():
        if keyword in msg_lower and symptom not in context["symptoms"]:
            context["symptoms"].append(symptom)
            context["confidence_scores"].append(0.7)
    
    return build_chat_response(context, animal_type, session_id, "rule_based")


def build_chat_response(context, animal_type, session_id, method):
    """Build standardized chat response"""
    
    symptom_count = len(context["symptoms"])
    avg_confidence = sum(context["confidence_scores"]) / len(context["confidence_scores"]) if context["confidence_scores"] else 0
    confidence_percent = round(avg_confidence * 100, 2)
    
    # Determine severity and urgency
    if symptom_count == 0:
        severity = "none"
        urgency = "low"
        message = f"I'm here to help assess your {animal_type}'s health. Please describe any symptoms."
        appointment_required = False
    
    elif symptom_count == 1:
        severity = "mild"
        urgency = "low"
        message = f"Noted: {context['symptoms'][0]}. Can you provide more details?"
        appointment_required = False
    
    elif symptom_count == 2:
        severity = "moderate"
        urgency = "medium"
        message = f"I've identified {symptom_count} symptoms. Any other concerns?"
        appointment_required = True
    
    else:
        severity = "moderate_to_high"
        urgency = "urgent"
        message = f"Based on {symptom_count} symptoms, I recommend veterinary consultation."
        appointment_required = True
    
    return {
        "success": True,
        "diagnosis_type": f"symptom_chat_{method}",
        "animal_type": animal_type,
        "session_id": session_id,
        "symptoms": context["symptoms"],
        "symptom_count": symptom_count,
        "confidence": confidence_percent,
        "severity": severity,
        "urgency": urgency,
        "message": message,
        "recommendation": get_recommendation(animal_type, symptom_count == 0, severity),
        "appointment_required": appointment_required,
        "follow_up_questions": get_follow_up_questions(symptom_count, animal_type)
    }


# =====================================================
# HELPER FUNCTIONS
# =====================================================
# get_recommendation is no longer used for image predictions (replaced by disease_knowledge)
# Kept for backward compatibility with chat diagnosis
def get_recommendation(animal_type, is_healthy, severity):
    """Get recommendation based on severity (used by chat diagnosis only)"""
    if is_healthy or severity == "none":
        return f"Your {animal_type} appears healthy. Continue regular care and monitoring."
    elif severity == "mild":
        return f"Monitor your {animal_type} closely. If symptoms persist or worsen, consult a veterinarian."
    elif severity == "moderate":
        return f"Schedule a veterinary appointment within 24-48 hours to assess your {animal_type}."
    else:
        return f"Seek veterinary attention as soon as possible for your {animal_type}."


def get_follow_up_questions(symptom_count, animal_type):
    """Get contextual follow-up questions"""
    
    if symptom_count == 0:
        return [
            f"What symptoms is your {animal_type} showing?",
            "When did you first notice these changes?",
            "Is your pet eating and drinking normally?"
        ]
    
    elif symptom_count == 1:
        return [
            "Are there any other symptoms?",
            "How long has this been happening?",
            "Has it gotten worse over time?"
        ]
    
    elif symptom_count == 2:
        return [
            "Any changes in behavior or energy level?",
            "Is there any visible discomfort?",
            "Has your pet been around other animals recently?"
        ]
    
    else:
        return [
            "When can you visit a veterinarian?",
            "Is your pet in immediate distress?",
            "Do you need emergency vet contact information?"
        ]


# =====================================================
# MAIN INTERFACE
# =====================================================
def process_user_input(input_type, user_data, animal_type, session_id="default"):
    """
    Main processing function
    
    Args:
        input_type: "image" or "chat"
        user_data: image path (str) or message (str)
        animal_type: pet type
        session_id: unique session ID
    
    Returns:
        dict: Diagnosis response
    """
    
    if input_type == "image":
        return predict_from_image(user_data, animal_type)
    
    elif input_type == "chat":
        return chat_diagnosis(user_data, animal_type, session_id)
    
    else:
        return {
            "success": False,
            "error": "Invalid input type. Use 'image' or 'chat'"
        }


def reset_conversation(session_id="default"):
    """Reset conversation context"""
    if session_id in conversation_context:
        del conversation_context[session_id]
    return {"success": True, "message": "Conversation reset"}


def get_system_status():
    """Get system status"""
    return {
        "image_models": {
            "loaded": image_models_loaded,
            "mode": "multiclass" if multiclass_available else "binary_fallback",
            "pet_multiclass": pet_multiclass_model is not None,
            "pet_classes": len(pet_class_names) if pet_class_names else 0,
            "cattle": cattle_multiclass_model is not None,
            "cattle_classes": len(cattle_class_names) if cattle_class_names else 0,
            "cat_binary": cat_model is not None,
            "dog_binary": dog_model is not None
        },
        "chat_models": {
            "loaded": chat_models_loaded,
            "classifier": symptom_classifier is not None,
            "vectorizer": symptom_vectorizer is not None,
            "healthpaws": healthpaws_model is not None
        },
        "supported_pets": {
            "image_analysis": PETS_WITH_IMAGE_SUPPORT,
            "text_only": PETS_TEXT_ONLY,
            "all": ALL_PETS
        }
    }


# =====================================================
# INITIALIZATION
# =====================================================
if __name__ == "__main__":
    print("="*70)
    print("🏥 VetAI Diagnosis System")
    print("="*70)
    
    print("\n🔄 Loading models...")
    load_image_models()
    load_chat_models()
    
    status = get_system_status()
    
    print("\n📊 System Status:")
    print(f"   Image Analysis: {status['image_models']['loaded']}")
    print(f"   Chat Diagnosis: {status['chat_models']['loaded']}")
    print(f"   Supported Pets: {', '.join(ALL_PETS)}")
    
    print("\n✅ System Ready!")
    print("="*70)