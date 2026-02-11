from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import joblib
import os

app = Flask(__name__)
CORS(app) # Allow Node.js to talk to us

# ==========================================
# 1. LOAD SENSOR MODEL (LSTM)
# ==========================================
print("⏳ Loading AI Models...")
SENSOR_MODEL_PATH = 'aqua_brain.h5'
SCALER_PATH = 'scaler.gz'

sensor_model = None
scaler = None

try:
    if os.path.exists(SENSOR_MODEL_PATH) and os.path.exists(SCALER_PATH):
        sensor_model = load_model(SENSOR_MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        print("✅ Sensor Brain (LSTM) Ready!")
    else:
        print("⚠️ Warning: 'aqua_brain.h5' or 'scaler.gz' not found. Sensor predictions will fail.")
except Exception as e:
    print(f"❌ Error loading sensor files: {e}")

# ==========================================
# 2. LOAD VISION MODEL (CNN)
# ==========================================
VISION_MODEL_PATH = 'prawn_vision.h5' 
vision_model = None

if os.path.exists(VISION_MODEL_PATH):
    try:
        vision_model = load_model(VISION_MODEL_PATH)
        print("✅ Vision Brain (CNN) Ready!")
    except Exception as e:
        print(f"⚠️ Vision Model Error: {e}")
else:
    print("ℹ️ No 'prawn_vision.h5' found. Using Simulation Mode for Health Analysis.")


# ==========================================
# 🔮 ROUTE 1: SENSOR PREDICTION
# ==========================================
@app.route('/predict', methods=['POST'])
def predict():
    try:
        if not sensor_model:
            return jsonify({'error': 'Sensor model is not loaded.'}), 503

        data = request.json
        readings = data.get('readings', [])

        # We need exactly 60 past readings to predict the future
        if len(readings) < 60:
            return jsonify({'error': f'Need 60 readings, got {len(readings)}'}), 400

        # Convert JSON to DataFrame
        # Ensure columns are in the EXACT order we trained on
        feature_order = ['do', 'ph', 'temp', 'turbidity', 'ammonia', 'salinity']
        df = pd.DataFrame(readings)
        df = df[feature_order] 

        # Scale the data (0 to 1)
        # We only take the last 60 rows
        input_data = df.values[-60:]
        input_scaled = scaler.transform(input_data)

        # Reshape for LSTM (1 sample, 60 time steps, 6 features)
        input_reshaped = np.array([input_scaled])

        # Predict
        prediction_scaled = sensor_model.predict(input_reshaped)
        
        # Un-scale (Convert back to real numbers)
        prediction_actual = scaler.inverse_transform(prediction_scaled)

        # Send back the result
        result = {
            'do': float(prediction_actual[0][0]),
            'ph': float(prediction_actual[0][1]),
            'temp': float(prediction_actual[0][2]),
            'turbidity': float(prediction_actual[0][3]),
            'ammonia': float(prediction_actual[0][4]),
            'salinity': float(prediction_actual[0][5])
        }
        print("🔮 Prediction sent:", result)
        return jsonify(result)

    except Exception as e:
        print("❌ Prediction Error:", e)
        return jsonify({'error': str(e)}), 500


# ==========================================
# 🦠 ROUTE 2: DISEASE DETECTION (NEW)
# ==========================================
@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    try:
        data = request.json
        img_path = data.get('imagePath')
        
        if not img_path or not os.path.exists(img_path):
            return jsonify({'error': 'Image file not found'}), 400

        # A. REAL AI MODE (If model exists)
        if vision_model:
            # Load and Preprocess Image
            img = image.load_img(img_path, target_size=(224, 224)) # Standard size
            img_array = image.img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0) / 255.0 # Normalize

            predictions = vision_model.predict(img_array)
            # Assuming classes: [0: Black Gill, 1: Healthy, 2: White Spot]
            # You will update this list based on your actual training later
            class_names = ['Black Gill Disease', 'Healthy', 'White Spot Syndrome']
            
            predicted_index = np.argmax(predictions)
            predicted_class = class_names[predicted_index]
            confidence = float(np.max(predictions) * 100)
            
            # Simple advice logic based on detection
            advice_map = {
                'Healthy': 'Specimen appears healthy. Maintain water quality.',
                'White Spot Syndrome': 'CRITICAL: Isolate affected stock immediately. Check pH and temperature stability.',
                'Black Gill Disease': 'WARNING: High organic load detected. Clean pond bottom and check filtration.'
            }

            return jsonify({
                'condition': predicted_class,
                'confidence': round(confidence, 2),
                'status': 'healthy' if predicted_class == 'Healthy' else 'infected',
                'advice': advice_map.get(predicted_class, 'Consult a specialist.')
            })

        # B. SIMULATION MODE (For Testing UI without trained model)
        else:
            import random
            print(f"ℹ️ Simulating analysis for: {img_path}")
            
            # Randomly pick a result for demonstration
            conditions = [
                {'name': 'Healthy', 'status': 'healthy', 'advice': 'Specimen appears healthy. Continue regular monitoring.'},
                {'name': 'White Spot Syndrome', 'status': 'infected', 'advice': 'CRITICAL: Isolate affected stock. Increase aeration and check pH levels immediately.'},
                {'name': 'Black Gill Disease', 'status': 'infected', 'advice': 'WARNING: Indication of poor bottom quality. Reduce feeding and clean pond floor.'}
            ]
            
            result = random.choice(conditions)
            
            return jsonify({
                'condition': result['name'],
                'confidence': round(random.uniform(88.0, 99.5), 2),
                'status': result['status'],
                'advice': result['advice']
            })

    except Exception as e:
        print("❌ Vision Error:", e)
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Run on Port 5000
    app.run(port=5000, debug=True)