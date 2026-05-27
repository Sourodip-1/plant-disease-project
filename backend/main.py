from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Home route
@app.get("/")
def home():
    return {"message": "Backend is running"}

# Prediction route
@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    plant_type: str = Form(...),
    location: str = Form(...)
):

    # Disease database
    diseases = {
        "tomato": ["Early Blight", "Leaf Spot", "Healthy"],
        "potato": ["Late Blight", "Scab", "Healthy"],
        "citrus": ["Citrus Canker", "Leaf Miner", "Healthy"],
        "rice": ["Brown Spot", "Blast", "Healthy"],
        "apple": ["Apple Scab", "Black Rot", "Healthy"]
    }

    # Convert plant name to lowercase
    plant = plant_type.lower()

    # Check plant type
    if plant in diseases:
        prediction = random.choice(diseases[plant])
    else:
        prediction = random.choice([
            "Leaf Spot",
            "Rust",
            "Blight",
            "Healthy"
        ])

    # Confidence score
    confidence = round(random.uniform(82, 99), 2)

    # Symptom probabilities
    symptom_probabilities = {
        "Leaf Spot": random.randint(40, 100),
        "Rust": random.randint(10, 80),
        "Blight": random.randint(5, 70),
        "Scab": random.randint(1, 50)
    }

    # Weather data
    weather_data = {
        "temperature": f"{random.randint(24, 35)}°C",
        "humidity": f"{random.randint(40, 90)}%",
        "soil_moisture": random.choice([
            "Low",
            "Moderate",
            "High"
        ]),
        "rainfall": f"{random.randint(0, 100)} mm"
    }

    # Final response
    return {
        "success": True,
        "plant_type": plant_type,
        "location": location,
        "prediction": prediction,
        "confidence": confidence,
        "symptom_probabilities": symptom_probabilities,
        "weather": weather_data
    }