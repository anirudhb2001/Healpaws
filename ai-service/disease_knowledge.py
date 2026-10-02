"""
Disease Knowledge Base for VetAI Diagnosis System.

Maps disease class names (as output by the multi-class models) to
veterinary information used for diagnosis reports.
"""

DISEASE_DATABASE = {
    # ===========================================================
    # CAT DISEASES
    # ===========================================================
    "dental_disease_cat": {
        "display_name": "Dental Disease",
        "animal": "cat",
        "description": "Dental disease in cats includes gingivitis, periodontitis, and tooth resorption. It is one of the most common feline health issues, often caused by plaque and tartar buildup.",
        "symptoms": [
            "Bad breath (halitosis)",
            "Drooling or excessive salivation",
            "Difficulty eating or dropping food",
            "Red, swollen, or bleeding gums",
            "Pawing at the mouth",
            "Weight loss due to reduced appetite"
        ],
        "treatment": [
            "Professional dental cleaning under anesthesia",
            "Tooth extraction if severely affected",
            "Antibiotics for secondary infections",
            "Pain management medication",
            "Dental diet and treats for ongoing care"
        ],
        "urgency": "moderate",
        "appointment_required": True,
        "home_care": "Offer soft food if eating is painful. Do not attempt to brush inflamed gums."
    },
    "ear_mites_cat": {
        "display_name": "Ear Mites",
        "animal": "cat",
        "description": "Ear mites (Otodectes cynotis) are tiny parasites that infest the ear canal. Extremely common in kittens and highly contagious between animals.",
        "symptoms": [
            "Intense ear itching and scratching",
            "Dark, crumbly ear discharge (coffee-ground-like)",
            "Head shaking",
            "Inflammation of the ear canal",
            "Possible secondary bacterial infection",
            "Hair loss around ears from scratching"
        ],
        "treatment": [
            "Veterinary ear cleaning",
            "Topical anti-parasitic ear drops",
            "Systemic anti-parasitic medication (e.g., selamectin)",
            "Treatment of all animals in the household",
            "Antibiotics if secondary infection present"
        ],
        "urgency": "moderate",
        "appointment_required": True,
        "home_care": "Keep ears dry. Do not insert objects into the ear canal. Isolate from other pets until treated."
    },
    "eye_infection_cat": {
        "display_name": "Eye Infection",
        "animal": "cat",
        "description": "Feline eye infections can be caused by bacteria, viruses (especially feline herpesvirus), or environmental irritants. Can affect one or both eyes.",
        "symptoms": [
            "Redness of the eye or surrounding tissue",
            "Watery or thick discharge (clear, yellow, or green)",
            "Squinting or keeping the eye closed",
            "Swelling of the eyelids",
            "Cloudiness of the eye surface",
            "Excessive tearing"
        ],
        "treatment": [
            "Antibiotic or antiviral eye drops/ointment",
            "Oral antibiotics for severe cases",
            "Anti-inflammatory medication",
            "Warm compress to clean discharge",
            "L-lysine supplement if herpesvirus suspected"
        ],
        "urgency": "moderate",
        "appointment_required": True,
        "home_care": "Gently clean discharge with warm, damp cloth. Prevent rubbing. Keep indoors."
    },
    "feline_leukemia": {
        "display_name": "Feline Leukemia (FeLV)",
        "animal": "cat",
        "description": "Feline Leukemia Virus is a retrovirus that suppresses the immune system and can cause cancer. Transmitted through close contact, grooming, or shared food/water bowls.",
        "symptoms": [
            "Gradual weight loss",
            "Lethargy and decreased activity",
            "Recurring infections and fever",
            "Pale gums (anemia)",
            "Enlarged lymph nodes",
            "Poor coat condition",
            "Loss of appetite"
        ],
        "treatment": [
            "No cure — supportive and symptomatic care",
            "Immune-boosting supplements",
            "Antibiotics for secondary infections",
            "Regular veterinary monitoring",
            "Keeping the cat indoors to prevent spread",
            "Blood transfusions for severe anemia"
        ],
        "urgency": "high",
        "appointment_required": True,
        "home_care": "Keep indoors. Provide stress-free environment. Separate from uninfected cats."
    },
    "feline_panleukopenia": {
        "display_name": "Feline Panleukopenia (Feline Distemper)",
        "animal": "cat",
        "description": "A highly contagious and often fatal viral disease caused by feline parvovirus. Attacks the gastrointestinal tract, immune system, and nervous system. Most severe in kittens.",
        "symptoms": [
            "Severe vomiting and diarrhea (often bloody)",
            "High fever followed by hypothermia",
            "Extreme lethargy and depression",
            "Complete loss of appetite",
            "Dehydration",
            "Sudden death in kittens"
        ],
        "treatment": [
            "Emergency veterinary hospitalization",
            "Aggressive IV fluid therapy",
            "Anti-nausea medication",
            "Antibiotics for secondary infections",
            "Nutritional support",
            "Isolation from other cats"
        ],
        "urgency": "critical",
        "appointment_required": True,
        "home_care": "Seek emergency veterinary care immediately. Keep the cat warm and hydrated if transport is delayed."
    },
    "fungal_infection_cat": {
        "display_name": "Fungal Infection",
        "animal": "cat",
        "description": "Fungal skin infections in cats are commonly caused by dermatophytes (ringworm) or yeast. Can spread to humans (zoonotic).",
        "symptoms": [
            "Circular patches of hair loss",
            "Scaly, crusty, or flaky skin",
            "Redness and inflammation",
            "Itching (variable intensity)",
            "Brittle or broken hair",
            "Darkened skin in affected areas"
        ],
        "treatment": [
            "Topical antifungal cream or shampoo",
            "Oral antifungal medication for severe cases",
            "Lime sulfur dips",
            "Environmental decontamination",
            "Treatment duration: 6-8 weeks minimum"
        ],
        "urgency": "moderate",
        "appointment_required": True,
        "home_care": "Wear gloves when handling. Clean bedding frequently. Vacuum regularly to remove spores."
    },
    "ringworm_cat": {
        "display_name": "Ringworm",
        "animal": "cat",
        "description": "Ringworm is a fungal infection (dermatophytosis) that affects the skin, hair, and nails. Despite its name, it is not caused by a worm. Highly contagious to other animals and humans.",
        "symptoms": [
            "Circular areas of hair loss",
            "Broken or stubby hair",
            "Scaly or crusty skin lesions",
            "Mild to moderate itching",
            "Red ring-shaped skin patches",
            "Infected nails may become brittle"
        ],
        "treatment": [
            "Topical antifungal treatment (miconazole, clotrimazole)",
            "Oral antifungal medication (itraconazole, terbinafine)",
            "Medicated baths or lime sulfur dips",
            "Thorough environmental cleaning",
            "Treatment for 4-8 weeks beyond symptom resolution"
        ],
        "urgency": "moderate",
        "appointment_required": True,
        "home_care": "Isolate infected cat. Disinfect environment. Wash bedding in hot water. Use gloves for handling."
    },
    "scabies_cat": {
        "display_name": "Scabies (Sarcoptic Mange)",
        "animal": "cat",
        "description": "Feline scabies is caused by the Notoedres cati mite, which burrows into the skin. Causes intense itching and discomfort. Can temporarily affect humans.",
        "symptoms": [
            "Intense, relentless itching",
            "Thick, crusty skin (especially on ears and face)",
            "Hair loss in affected areas",
            "Restlessness and discomfort",
            "Secondary skin infections from scratching",
            "Skin thickening over time"
        ],
        "treatment": [
            "Topical anti-parasitic treatment (selamectin, ivermectin)",
            "Lime sulfur dips",
            "Antibiotics for secondary infections",
            "Anti-inflammatory medication for itching",
            "Treatment of all cats in household"
        ],
        "urgency": "high",
        "appointment_required": True,
        "home_care": "Prevent scratching with an e-collar if needed. Clean bedding and environment."
    },
    "skin_allergy_cat": {
        "display_name": "Skin Allergy",
        "animal": "cat",
        "description": "Feline skin allergies can result from food, environmental allergens (pollen, dust mites), or flea bites. Causes inflammation and discomfort.",
        "symptoms": [
            "Excessive grooming and scratching",
            "Hair loss (often symmetrical)",
            "Red, inflamed skin",
            "Small scabs or bumps (miliary dermatitis)",
            "Ear infections",
            "Watery eyes"
        ],
        "treatment": [
            "Identify and eliminate allergen source",
            "Antihistamines or corticosteroids",
            "Flea prevention treatment",
            "Hypoallergenic diet trial (8-12 weeks)",
            "Omega-3 fatty acid supplements",
            "Medicated shampoo for skin relief"
        ],
        "urgency": "low",
        "appointment_required": True,
        "home_care": "Use flea prevention. Try elimination diet. Keep environment clean."
    },
    "urinary_tract_infection_cat": {
        "display_name": "Urinary Tract Infection",
        "animal": "cat",
        "description": "Feline lower urinary tract disease (FLUTD) includes UTIs, bladder stones, and urethral blockages. Male cats are at higher risk for life-threatening blockages.",
        "symptoms": [
            "Frequent urination attempts with little output",
            "Crying or straining while urinating",
            "Blood in urine",
            "Urinating outside the litter box",
            "Excessive licking of genital area",
            "Complete inability to urinate (EMERGENCY)"
        ],
        "treatment": [
            "Urinalysis and culture for diagnosis",
            "Antibiotics for bacterial infections",
            "Pain management",
            "Increased water intake encouragement",
            "Prescription urinary diet",
            "Emergency catheterization if blocked"
        ],
        "urgency": "high",
        "appointment_required": True,
        "home_care": "If cat cannot urinate at all, seek EMERGENCY care immediately. Ensure fresh water is available."
    },
    "worm_infection_cat": {
        "display_name": "Worm Infection",
        "animal": "cat",
        "description": "Intestinal parasites in cats include roundworms, tapeworms, hookworms, and whipworms. Common in outdoor cats and kittens. Some can spread to humans.",
        "symptoms": [
            "Visible worms in stool or around anus",
            "Pot-bellied appearance (especially kittens)",
            "Weight loss despite normal appetite",
            "Vomiting (sometimes containing worms)",
            "Diarrhea (may be bloody)",
            "Dull coat and poor body condition"
        ],
        "treatment": [
            "Deworming medication (specific to worm type)",
            "Fecal examination for diagnosis",
            "Repeat treatment in 2-4 weeks",
            "Regular preventative deworming schedule",
            "Flea control (tapeworms spread via fleas)"
        ],
        "urgency": "moderate",
        "appointment_required": True,
        "home_care": "Practice good hygiene. Clean litter box daily. Wash hands after handling."
    },

    # ===========================================================
    # DOG DISEASES
    # ===========================================================
    "dental_disease_dog": {
        "display_name": "Dental Disease",
        "animal": "dog",
        "description": "Periodontal disease is the most common health condition in dogs. Caused by bacterial buildup, it can lead to tooth loss, pain, and systemic organ damage.",
        "symptoms": [
            "Bad breath",
            "Yellow or brown tartar on teeth",
            "Red, swollen, or bleeding gums",
            "Difficulty chewing or dropping food",
            "Loose or missing teeth",
            "Facial swelling"
        ],
        "treatment": [
            "Professional dental cleaning under anesthesia",
            "Tooth extractions if necessary",
            "Antibiotics for infection",
            "Pain management",
            "Regular dental care routine at home"
        ],
        "urgency": "moderate",
        "appointment_required": True,
        "home_care": "Offer soft food. Begin regular tooth brushing with dog-safe toothpaste after treatment."
    },
    "distemper_dog": {
        "display_name": "Canine Distemper",
        "animal": "dog",
        "description": "A serious, highly contagious viral disease affecting the respiratory, gastrointestinal, and nervous systems. Often fatal, especially in puppies. Prevented by vaccination.",
        "symptoms": [
            "High fever",
            "Nasal and eye discharge",
            "Coughing and difficulty breathing",
            "Vomiting and diarrhea",
            "Lethargy and loss of appetite",
            "Seizures and neurological signs (later stages)",
            "Hardening of nose and foot pads"
        ],
        "treatment": [
            "Immediate veterinary hospitalization",
            "Supportive care (IV fluids, nutrition)",
            "Anti-seizure medication if needed",
            "Antibiotics for secondary infections",
            "No cure — prevention through vaccination is critical"
        ],
        "urgency": "critical",
        "appointment_required": True,
        "home_care": "Seek emergency vet care immediately. Isolate from other dogs."
    },
    "eye_infection_dog": {
        "display_name": "Eye Infection",
        "animal": "dog",
        "description": "Canine eye infections may be caused by bacteria, allergies, foreign bodies, or underlying conditions like dry eye. Certain breeds are more susceptible.",
        "symptoms": [
            "Redness of the eye",
            "Discharge (clear, yellow, or green)",
            "Squinting or excessive blinking",
            "Pawing at the eye",
            "Swollen eyelids",
            "Cloudiness in the eye"
        ],
        "treatment": [
            "Antibiotic or medicated eye drops",
            "Anti-inflammatory eye medication",
            "Warm compress for cleaning",
            "E-collar to prevent rubbing",
            "Treatment of underlying cause"
        ],
        "urgency": "moderate",
        "appointment_required": True,
        "home_care": "Clean discharge gently with warm damp cloth. Prevent rubbing with e-collar."
    },
    "fungal_infection_dog": {
        "display_name": "Fungal Infection",
        "animal": "dog",
        "description": "Fungal skin infections in dogs can be caused by ringworm, yeast (Malassezia), or systemic fungi. Often secondary to allergies or immune suppression.",
        "symptoms": [
            "Circular patches of hair loss",
            "Flaky, crusty skin",
            "Musty or yeasty odor",
            "Greasy or thickened skin",
            "Itching and redness",
            "Darkened skin (hyperpigmentation)"
        ],
        "treatment": [
            "Topical antifungal cream or medicated shampoo",
            "Oral antifungal medication",
            "Treatment of underlying allergies",
            "Regular medicated baths",
            "Environmental decontamination for ringworm"
        ],
        "urgency": "moderate",
        "appointment_required": True,
        "home_care": "Bathe with medicated shampoo as directed. Wash bedding in hot water."
    },
    "hot_spots_dog": {
        "display_name": "Hot Spots (Acute Moist Dermatitis)",
        "animal": "dog",
        "description": "Hot spots are localized areas of inflamed, infected skin that appear suddenly and spread rapidly. Common in humid weather and in breeds with thick coats.",
        "symptoms": [
            "Red, moist, oozing skin lesion",
            "Sudden onset of intense itching",
            "Pain at the affected area",
            "Hair loss around the lesion",
            "Foul smell from the area",
            "Rapid spreading if untreated"
        ],
        "treatment": [
            "Clip hair around the lesion",
            "Clean with antiseptic solution",
            "Topical antibiotic/steroid spray or cream",
            "Oral antibiotics for severe cases",
            "E-collar to prevent licking",
            "Address underlying cause (allergies, fleas)"
        ],
        "urgency": "moderate",
        "appointment_required": True,
        "home_care": "Keep area clean and dry. Prevent licking with e-collar. Monitor for spreading."
    },
    "kennel_cough_dog": {
        "display_name": "Kennel Cough (Infectious Tracheobronchitis)",
        "animal": "dog",
        "description": "A highly contagious upper respiratory infection caused by Bordetella bacteria and/or parainfluenza virus. Common in dogs from shelters, boarding, or dog parks.",
        "symptoms": [
            "Persistent, forceful dry cough (honking sound)",
            "Retching or gagging after coughing",
            "Nasal discharge",
            "Mild lethargy",
            "Reduced appetite",
            "Low-grade fever"
        ],
        "treatment": [
            "Often self-limiting in healthy dogs (1-3 weeks)",
            "Cough suppressants for comfort",
            "Antibiotics if bacterial component suspected",
            "Rest and isolation from other dogs",
            "Humidifier or steam to ease breathing",
            "Bordetella vaccination for prevention"
        ],
        "urgency": "low",
        "appointment_required": True,
        "home_care": "Isolate from other dogs. Use harness instead of collar. Provide humid air."
    },
    "mange_dog": {
        "display_name": "Mange (Demodectic/Sarcoptic)",
        "animal": "dog",
        "description": "Mange is caused by mites. Demodectic mange (Demodex) is not contagious and often linked to immune issues. Sarcoptic mange (scabies) is highly contagious and zoonotic.",
        "symptoms": [
            "Hair loss (patchy or generalized)",
            "Intense itching (sarcoptic) or mild itching (demodectic)",
            "Red, crusty, or scaly skin",
            "Thickened skin",
            "Secondary bacterial infections",
            "Sores from scratching"
        ],
        "treatment": [
            "Skin scraping for diagnosis",
            "Oral anti-parasitic medication (ivermectin, afoxolaner)",
            "Medicated baths or dips",
            "Antibiotics for secondary infections",
            "Immune support for demodectic mange",
            "Treatment of all dogs in household for sarcoptic"
        ],
        "urgency": "high",
        "appointment_required": True,
        "home_care": "Isolate if sarcoptic mange is suspected. Wash all bedding. Wear gloves for handling."
    },
    "parvovirus_dog": {
        "display_name": "Parvovirus (Parvo)",
        "animal": "dog",
        "description": "Canine parvovirus is an extremely contagious and often fatal viral disease that attacks the gastrointestinal tract. Most dangerous for unvaccinated puppies.",
        "symptoms": [
            "Severe, bloody diarrhea",
            "Profuse vomiting",
            "Extreme lethargy and weakness",
            "Complete loss of appetite",
            "High fever or hypothermia",
            "Rapid dehydration"
        ],
        "treatment": [
            "EMERGENCY veterinary hospitalization",
            "Aggressive IV fluid therapy",
            "Anti-nausea medication",
            "Antibiotics for secondary infections",
            "Nutritional support",
            "Survival rate improves significantly with early treatment"
        ],
        "urgency": "critical",
        "appointment_required": True,
        "home_care": "Seek emergency vet care IMMEDIATELY. Time is critical. Isolate from all other dogs."
    },
    "skin_allergy_dog": {
        "display_name": "Skin Allergy (Atopic Dermatitis)",
        "animal": "dog",
        "description": "Canine allergic dermatitis can be caused by environmental allergens, food, or flea bites. It is one of the most common reasons for veterinary visits.",
        "symptoms": [
            "Persistent itching and scratching",
            "Red, inflamed skin (especially paws, ears, belly)",
            "Recurring ear infections",
            "Licking or chewing at paws",
            "Hair loss in affected areas",
            "Skin darkening and thickening over time"
        ],
        "treatment": [
            "Identify and avoid allergens",
            "Antihistamines or apoquel (oclacitinib)",
            "Cytopoint injections for long-term relief",
            "Hypoallergenic diet trial",
            "Medicated shampoo therapy",
            "Omega-3 fatty acid supplements"
        ],
        "urgency": "low",
        "appointment_required": True,
        "home_care": "Regular flea prevention. Wipe paws after walks. Frequent baths with oatmeal shampoo."
    },
    "tick_infestation_dog": {
        "display_name": "Tick Infestation",
        "animal": "dog",
        "description": "Tick infestations can transmit serious diseases including Lyme disease, ehrlichiosis, and anaplasmosis. Ticks attach and feed on blood for days.",
        "symptoms": [
            "Visible ticks on skin (especially ears, neck, paws)",
            "Localized redness or swelling at bite sites",
            "Fever and lethargy (if disease transmitted)",
            "Loss of appetite",
            "Joint pain or lameness (Lyme disease)",
            "Anemia in severe infestations"
        ],
        "treatment": [
            "Careful tick removal with fine-tipped tweezers",
            "Topical or oral tick prevention medication",
            "Tick-borne disease testing (blood panel)",
            "Antibiotics if tick-borne disease diagnosed",
            "Environmental tick treatment (yard, bedding)"
        ],
        "urgency": "moderate",
        "appointment_required": True,
        "home_care": "Remove ticks carefully. Save tick for identification. Start tick prevention treatment."
    },
    "worm_infection_dog": {
        "display_name": "Worm Infection",
        "animal": "dog",
        "description": "Common intestinal parasites in dogs include roundworms, hookworms, tapeworms, and whipworms. Heartworm is transmitted by mosquitoes and affects the heart and lungs.",
        "symptoms": [
            "Worms visible in stool or vomit",
            "Scooting (dragging rear on ground)",
            "Pot-bellied appearance (puppies)",
            "Weight loss",
            "Diarrhea (may contain blood or mucus)",
            "Dull coat and low energy"
        ],
        "treatment": [
            "Deworming medication (type-specific)",
            "Fecal test for accurate diagnosis",
            "Repeat deworming in 2-4 weeks",
            "Monthly heartworm prevention",
            "Regular preventative deworming schedule"
        ],
        "urgency": "moderate",
        "appointment_required": True,
        "home_care": "Pick up stool promptly. Practice good hygiene. Keep up with preventative treatments."
    },

    # ===========================================================
    # CATTLE DISEASES
    # ===========================================================
    "healthy": {
        "display_name": "Healthy",
        "animal": "cattle",
        "description": "No visible signs of disease detected. The animal appears to be in normal health based on the image analysis.",
        "symptoms": [],
        "treatment": [
            "Continue routine health monitoring",
            "Maintain vaccination schedule",
            "Regular deworming program",
            "Balanced nutrition and clean water"
        ],
        "urgency": "none",
        "appointment_required": False,
        "home_care": "Continue standard care practices. Schedule routine health checkups."
    },
    "lumpy_skin": {
        "display_name": "Lumpy Skin Disease (LSD)",
        "animal": "cattle",
        "description": "Lumpy Skin Disease is a viral infection caused by the Lumpy Skin Disease Virus (LSDV). Transmitted by biting insects. Causes significant economic losses.",
        "symptoms": [
            "Firm, round skin nodules (2-5cm diameter)",
            "Nodules on head, neck, limbs, and udder",
            "Fever and depression",
            "Swollen lymph nodes",
            "Reduced milk production",
            "Nasal and eye discharge",
            "Weight loss and poor appetite"
        ],
        "treatment": [
            "No specific antiviral treatment available",
            "Supportive care and wound management",
            "Antibiotics for secondary bacterial infections",
            "Anti-inflammatory medication",
            "Insect control measures",
            "Vaccination for prevention",
            "Quarantine of affected animals"
        ],
        "urgency": "high",
        "appointment_required": True,
        "home_care": "Isolate affected animals. Control biting insects. Report to veterinary authorities."
    },
}


# Healthy class entries for pet multi-class models (some datasets include a healthy class)
DISEASE_DATABASE["healthy_cat"] = {
    "display_name": "Healthy",
    "animal": "cat",
    "description": "No visible signs of skin disease detected. Your cat appears healthy based on the image analysis.",
    "symptoms": [],
    "treatment": [
        "Continue regular health monitoring",
        "Maintain vaccination schedule",
        "Regular flea and worm prevention"
    ],
    "urgency": "none",
    "appointment_required": False,
    "home_care": "Continue standard care. Schedule regular veterinary checkups."
}

DISEASE_DATABASE["healthy_dog"] = {
    "display_name": "Healthy",
    "animal": "dog",
    "description": "No visible signs of skin disease detected. Your dog appears healthy based on the image analysis.",
    "symptoms": [],
    "treatment": [
        "Continue regular health monitoring",
        "Maintain vaccination schedule",
        "Regular flea, tick, and worm prevention"
    ],
    "urgency": "none",
    "appointment_required": False,
    "home_care": "Continue standard care. Schedule regular veterinary checkups."
}


def get_disease_report(disease_key, animal_type, confidence):
    """
    Generate a disease-specific diagnosis report.

    Args:
        disease_key: The class name from the model (e.g., 'fungal_infection_cat')
        animal_type: 'cat', 'dog', or 'cattle'
        confidence: Prediction confidence (0-100)

    Returns:
        dict: Detailed disease report
    """
    disease_key = disease_key.lower().strip()

    # Look up in database
    info = DISEASE_DATABASE.get(disease_key)

    if info is None:
        # Fallback - generate generic report
        return _generic_report(disease_key, animal_type, confidence)

    is_healthy = info["urgency"] == "none"

    # Adjust urgency based on confidence
    urgency = info["urgency"]
    if not is_healthy and confidence < 50:
        urgency = "low"

    return {
        "disease_name": info["display_name"],
        "disease_key": disease_key,
        "animal_type": animal_type,
        "description": info["description"],
        "symptoms": info["symptoms"],
        "treatment": info["treatment"],
        "urgency": urgency,
        "appointment_required": info["appointment_required"],
        "home_care": info.get("home_care", ""),
        "is_healthy": is_healthy,
        "confidence": confidence
    }


def _generic_report(disease_key, animal_type, confidence):
    """Fallback report for unknown disease classes."""
    display_name = disease_key.replace("_", " ").title()
    is_healthy = "healthy" in disease_key.lower()

    return {
        "disease_name": display_name,
        "disease_key": disease_key,
        "animal_type": animal_type,
        "description": f"Detected condition: {display_name}. Please consult a veterinarian for a thorough examination.",
        "symptoms": ["Refer to veterinary professional for symptom assessment"],
        "treatment": ["Veterinary consultation recommended for proper diagnosis and treatment plan"],
        "urgency": "none" if is_healthy else "moderate",
        "appointment_required": not is_healthy,
        "home_care": "Monitor your pet closely and consult a veterinarian.",
        "is_healthy": is_healthy,
        "confidence": confidence
    }
