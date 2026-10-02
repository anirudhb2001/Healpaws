import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
import os

DOG_MODEL_PATH = os.path.join("models", "weights", "dogmodel_tf215_fixed.h5")

def build_dog_model():
    model = models.Sequential([
        layers.Input(shape=(86,)),
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


dog_model = build_dog_model()
dog_model.load_weights(DOG_MODEL_PATH)

print("✅ Dog symptom model loaded successfully")

DOG_CLASSES = [
    "Disease_1", "Disease_2", "Disease_3", "Disease_4",
    "Disease_5", "Disease_6", "Disease_7", "Disease_8",
    "Disease_9", "Disease_10", "Disease_11", "Disease_12"
]

def predict_dog_symptoms(features):
    x = np.array(features, dtype="float32").reshape(1, 86)
    preds = dog_model.predict(x)

    idx = int(np.argmax(preds))
    return {
        "class": DOG_CLASSES[idx],
        "confidence": float(preds[0][idx])
    }