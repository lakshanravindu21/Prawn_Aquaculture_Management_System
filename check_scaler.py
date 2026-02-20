import joblib
import numpy as np
import pandas as pd

def validate_scaler():
    try:
        # 1. Load the Scaler
        scaler = joblib.load('model/scaler.pkl')
        print("✅ Scaler loaded successfully!")

        # 2. Create a 'Perfect' Pond Sample (Optimal Conditions)
        # Order: temp, ph, do, ammonia, turbidity, salinity
        optimal_sample = np.array([[29.0, 8.0, 6.5, 0.02, 20.0, 18.0]])
        
        # 3. Create a 'Danger' Pond Sample (Extreme Conditions)
        danger_sample = np.array([[18.0, 6.0, 1.0, 5.0, 90.0, 35.0]])

        # 4. Transform the data
        scaled_optimal = scaler.transform(optimal_sample)
        scaled_danger = scaler.transform(danger_sample)

        print("\n--- Validation Results ---")
        print(f"Original Optimal: {optimal_sample[0]}")
        print(f"Scaled Optimal:   {scaled_optimal[0]}")
        print("\nOriginal Danger:  {danger_sample[0]}")
        print(f"Scaled Danger:    {scaled_danger[0]}")

        # Validation Logic: Scaled values should generally be between 0 and 1
        if np.all((scaled_optimal >= -0.5) & (scaled_optimal <= 1.5)):
            print("\n✅ SUCCESS: The scaler is transforming data into the correct range for the LSTM.")
        else:
            print("\n⚠️ WARNING: Scaled values are outside expected bounds. Recalibrate your scaler in Colab.")

    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    validate_scaler()