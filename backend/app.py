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

app = Flask(__name__)
CORS(app)  # Enables communication with your Frontend/Node.js

# ==========================================
# 1. LOAD AI BRAIN (LSTM & SCALER)
# ==========================================
# Use the filenames we generated in Colab
SENSOR_MODEL_PATH = 'model/prawn_master_model.h5'
SCALER_PATH = 'model/scaler.pkl'
VISION_MODEL_PATH = 'model/prawn_vision.h5'

# Load Sensor Model
try:
    sensor_model = load_model(SENSOR_MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    print("✅ Prawn Master Model (LSTM) Loaded Successfully!")
except Exception as e:
    print(f"⚠️ Sensor Model Error: {e}. Check if files exist in /model folder.")

# Load Vision Model
vision_model = None
if os.path.exists(VISION_MODEL_PATH):
    vision_model = load_model(VISION_MODEL_PATH)
    print("✅ Prawn Vision Brain (CNN) Ready!")

# ==========================================
# 🔮 ROUTE 1: REAL-TIME WATER QUALITY ANALYSIS
# ==========================================
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        # The new LSTM needs a window of 10 readings
        readings = data.get('readings', [])

        if len(readings) < 10:
            return jsonify({'status': 'Collecting Data...', 'needed': 10 - len(readings)}), 202

        # 1. Feature Engineering (Match the exact order of our Master Dataset)
        feature_order = ['temp', 'ph', 'do', 'ammonia', 'turbidity', 'salinity']
        df = pd.DataFrame(readings[-10:]) # Take the last 10 readings
        df = df[feature_order]

        # 2. Scale and Reshape for LSTM
        input_scaled = scaler.transform(df)
        input_reshaped = np.array([input_scaled]) # Shape: (1, 10, 6)

        # 3. Predict Quality
        prediction = sensor_model.predict(input_reshaped)
        confidence = float(prediction[0][0])
        
        # 4. Logic for Web App Status
        # Since it's a sigmoid output: > 0.5 is Good, < 0.5 is Danger
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
# 🦠 ROUTE 2: DISEASE DETECTION
# ==========================================
@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    try:
        data = request.json
        img_path = data.get('imagePath')
        
        if not vision_model:
            # Simulation mode if you haven't trained the CNN yet
            return jsonify({
                'condition': 'Healthy (Simulated)',
                'confidence': 95.5,
                'advice': 'Regular checkup completed. Maintain DO levels.'
            })

        # Preprocess for CNN
        img = image.load_img(img_path, target_size=(224, 224))
        img_array = image.img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        pred = vision_model.predict(img_array)
        # Add your classes here
        classes = ['Black Gill', 'Healthy', 'White Spot']
        result_idx = np.argmax(pred)
        
        return jsonify({
            'condition': classes[result_idx],
            'confidence': float(np.max(pred) * 100),
            'status': 'healthy' if classes[result_idx] == 'Healthy' else 'infected'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)