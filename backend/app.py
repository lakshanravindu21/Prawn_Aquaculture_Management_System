from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import joblib
import os
from datetime import datetime
from PIL import Image

app = Flask(__name__)
CORS(app)  # Enables communication with your Frontend/Node.js

# ==========================================
# 1. LOAD AI BRAIN (LSTM, SCALER & CNN)
# ==========================================
SENSOR_MODEL_PATH = 'model/prawn_master_model.h5'
SCALER_PATH = 'model/scaler.pkl'
VISION_MODEL_PATH = 'model/prawn_disease_model.h5' 

# Load Sensor Model (LSTM)
try:
    sensor_model = load_model(SENSOR_MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    print("✅ Prawn Master Model (LSTM) Loaded Successfully!")
except Exception as e:
    print(f"⚠️ Sensor Model Error: {e}. Check if files exist in /model folder.")

# Load Vision Model (CNN)
vision_model = None
if os.path.exists(VISION_MODEL_PATH):
    try:
        vision_model = load_model(VISION_MODEL_PATH)
        print("✅ Prawn Vision Brain (CNN) Ready!")
    except Exception as e:
        print(f"⚠️ Vision Model Error: {e}")

# ==========================================
# 🏥 HEALTH CHECK ROUTE (FIXES "OFFLINE" ERROR)
# ==========================================
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online",
        "message": "AquaSmart AI Engine is running",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }), 200

@app.route('/favicon.ico')
def favicon():
    return '', 204

# ==========================================
# 🔮 ROUTE 1: REAL-TIME WATER QUALITY ANALYSIS
# ==========================================
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        readings = data.get('readings', [])

        if len(readings) < 10:
            return jsonify({'status': 'Collecting Data...', 'needed': 10 - len(readings)}), 202

        feature_order = ['temp', 'ph', 'do', 'ammonia', 'turbidity', 'salinity']
        df = pd.DataFrame(readings[-10:]) 
        df = df[feature_order]

        input_scaled = scaler.transform(df)
        input_reshaped = np.array([input_scaled]) 

        prediction = sensor_model.predict(input_reshaped)
        confidence = float(prediction[0][0])
        
        status = "Optimal" if confidence > 0.5 else "Danger"
        css_class = "success" if status == "Optimal" else "danger"

        return jsonify({
            'status': status,
            'confidence': round(confidence * 100, 2),
            'alert_class': css_class,
            'timestamp': datetime.now().strftime("%H:%M:%S")
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==========================================
# 🦠 ROUTE 2: DISEASE DETECTION (Neural Analysis)
# ==========================================
@app.route('/api/analyze-health', methods=['POST'])
def analyze_health():
    try:
        # Handle file upload from Node.js Bridge
        if 'prawnImage' in request.files:
            file = request.files['prawnImage']
            img = Image.open(file.stream).convert('RGB')
        # Handle direct path (if applicable)
        elif request.is_json and 'imagePath' in request.json:
            img_path = request.json.get('imagePath')
            if not os.path.exists(img_path):
                return jsonify({'error': 'Image file not found on server'}), 400
            img = Image.open(img_path).convert('RGB')
        else:
            return jsonify({'error': 'No image data provided'}), 400

        if not vision_model:
             return jsonify({'error': 'Vision Model not initialized on backend'}), 503

        # 1. Preprocess for MobileNetV2 (224x224)
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        # 2. Execute Neural Prediction
        pred = vision_model.predict(img_array)
        result_idx = np.argmax(pred)
        confidence_val = round(float(np.max(pred) * 100), 2)
        
        # 3. FIX: Alphabetical Class Mapping (Standard Keras order for your dataset)
        # Folders: BG, Healthy, WSSV, WSSV_BG -> Alphabetical indices: 0, 1, 2, 3
        classes = ['Black Gill Disease', 'Healthy', 'White Spot Syndrome', 'BG & WSSV Coinfection']
        
        # 4. CONFIDENCE GUARD: If confidence is too low (< 60%), don't give a potentially wrong answer
        if confidence_val < 60.0:
            return jsonify({
                'condition': 'Analysis Inconclusive',
                'confidence': confidence_val,
                'status': 'unhealthy',
                'advice': "The AI is unsure. Please provide a clearer image with better lighting for a more accurate diagnosis."
            })

        condition = classes[result_idx]
        
        # 5. Proactive Advisories
        advisories = {
            'Healthy': "Specimen appears healthy. Translucency and gill color are within optimal research parameters.",
            'White Spot Syndrome': "CRITICAL: Calcium deposits detected on carapace. Immediate quarantine and suspension of water exchange required.",
            'Black Gill Disease': "WARNING: Melanin accumulation in gills found. Increase aeration and inspect bottom soil quality.",
            'BG & WSSV Coinfection': "EMERGENCY: Multiple pathological markers detected. High risk of mass mortality; notify biosecurity immediately."
        }

        return jsonify({
            'condition': condition,
            'confidence': confidence_val,
            'status': 'healthy' if condition == 'Healthy' else 'unhealthy',
            'advice': advisories.get(condition, "Pathology unclear. Please rescan with better lighting.")
        })

    except Exception as e:
        print(f"❌ AI Prediction Error: {str(e)}")
        return jsonify({'error': 'Neural analysis failed internally'}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)