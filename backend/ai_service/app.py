from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
import joblib
import os

app = Flask(__name__)
CORS(app) # Allow Node.js to talk to us

# 1. LOAD THE BRAIN
print("⏳ Loading AI Model & Scaler...")
try:
    model = load_model('aqua_brain.h5')
    scaler = joblib.load('scaler.gz')
    print("✅ AI Brain is Ready!")
except Exception as e:
    print(f"❌ Error loading files: {e}")
    print("👉 Make sure aqua_brain.h5 and scaler.gz are in this folder.")
    exit(1)

@app.route('/predict', methods=['POST'])
def predict():
    try:
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
        prediction_scaled = model.predict(input_reshaped)
        
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

if __name__ == '__main__':
    # Run on Port 5000
    app.run(port=5000, debug=True)