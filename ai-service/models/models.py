import os
from tensorflow import keras
from tensorflow.keras.models import load_model

# Build correct paths to models
BASE_DIR = os.path.dirname(__file__)
WEIGHTS_DIR = os.path.join(BASE_DIR, "weights")

DOG_MODEL_PATH = os.path.join(WEIGHTS_DIR, "dogmodel.h5")
SKIN_MODEL_PATH = os.path.join(WEIGHTS_DIR, "skindisease.h5")


class OPetModels:
    """Loads and holds all AI models for OPet"""
    
    def __init__(self):
        print("📌 Loading TensorFlow models...\n")

        # Load both models
        self.dog_model = load_model(DOG_MODEL_PATH)
        self.skin_model = load_model(SKIN_MODEL_PATH)

        print(" OPet Models Loaded Successfully")

    def get_dog_model(self):
        return self.dog_model

    def get_skin_model(self):
        return self.skin_model