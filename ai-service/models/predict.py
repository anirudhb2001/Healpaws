import numpy as np
import cv2
import tensorflow as tf
from tensorflow.keras import layers, models

DOG_MODEL_PATH = "models\weights\dogmodel_tf215_fixed.h5"

# Rebuild the exact ANN architecture
def build_dog_model():
    model = models.Sequential([
        layers.Input(shape=(86,)),            # CRITICAL
        layers.Dense(1024, activation='relu'),
        layers.Dropout(0.2),

        layers.Dense(512, activation='relu'),
        layers.Dropout(0.2),

        layers.Dense(128, activation='relu'),
        layers.Dropout(0.2),

        layers.Dense(64, activation='relu'),
        layers.Dense(12, activation='softmax')
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(0.0001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    return model


# Load weights instead of load_model
dog_model = build_dog_model()
dog_model.load_weights(DOG_MODEL_PATH)

print("Dog model weights loaded successfully")

def preprocess_image(img_path):
    img = cv2.imread(img_path)
    img = cv2.resize(img, (224, 224))
    img = img.astype("float32") / 255.0
    img = np.expand_dims(img, axis=0)
    return img

def predict_image(img_path):
    img = preprocess_image(img_path)
    preds = dog_model.predict(img)

    idx = int(np.argmax(preds))

    classes = [
        "Disease_1", "Disease_2", "Disease_3", "Disease_4",
        "Disease_5", "Disease_6", "Disease_7", "Disease_8",
        "Disease_9", "Disease_10", "Disease_11", "Disease_12"
    ]

    return {
        "class": classes[idx],
        "confidence": float(preds[0][idx])
    }