import numpy as np
import os
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from tensorflow.keras.layers import InputLayer
from tensorflow.keras.mixed_precision import Policy

# =====================================================
# 🔧 PATCH 1: batch_shape → input_shape
# =====================================================
_old_input_init = InputLayer.__init__

def _patched_input_init(self, *args, **kwargs):
    if "batch_shape" in kwargs:
        batch_shape = kwargs.pop("batch_shape")

        # Convert (None, 224, 224, 3) → (224, 224, 3)
        if batch_shape is not None and len(batch_shape) > 1:
            kwargs["input_shape"] = tuple(batch_shape[1:])

    _old_input_init(self, *args, **kwargs)

InputLayer.__init__ = _patched_input_init


# =====================================================
# 🔧 PATCH 2: FIX BROKEN DTYPE POLICY FROM OLD MODELS
# =====================================================
_old_layer_init = tf.keras.layers.Layer.__init__

def _patched_layer_init(self, *args, **kwargs):
    if "dtype" in kwargs and isinstance(kwargs["dtype"], dict):
        kwargs["dtype"] = Policy("float32")
    _old_layer_init(self, *args, **kwargs)

tf.keras.layers.Layer.__init__ = _patched_layer_init


# =====================================================
# ✅ LOAD CNN MODEL
# =====================================================
SKIN_MODEL_PATH = os.path.join("models", "weights", "skindisease_full_model.h5")

print("✅ Loading skin model from:", SKIN_MODEL_PATH)
skin_model = load_model(SKIN_MODEL_PATH, compile=False)
print("✅ Skin disease CNN loaded successfully")


# =====================================================
# ✅ CLASS LABELS
# =====================================================
SKIN_CLASS_NAMES = [
    "Bacterial Infection",
    "Fungal Infection",
    "Allergy",
    "Healthy",
    "Tumor",
    "Mange"
]


# =====================================================
# ✅ IMAGE PREPROCESSING
# =====================================================
def preprocess_image(file_storage, target_size=(224, 224)):
    img = image.load_img(file_storage, target_size=target_size)
    img_array = image.img_to_array(img)
    img_array = img_array / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array


# =====================================================
# ✅ IMAGE PREDICTION
# =====================================================
def predict_skin_image(file_storage):
    img_array = preprocess_image(file_storage)

    preds = skin_model.predict(img_array)
    class_index = int(np.argmax(preds, axis=1)[0])
    confidence = float(np.max(preds))

    return {
        "label": SKIN_CLASS_NAMES[class_index],
        "class_index": class_index,
        "confidence": confidence
    }