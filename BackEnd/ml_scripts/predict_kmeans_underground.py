#!/usr/bin/env python3
"""
predict_kmeans_underground.py - K-Means Prediction for Underground Sensors
Predice clusters para datos subterráneos usando modelo entrenado
"""

import os
import sys
import json
from pathlib import Path

import requests
import pickle
import numpy as np
import pandas as pd


def main():
    try:
        api_base = os.getenv("API_BASE", "http://localhost:4000")
        models_dir = os.getenv("ML_MODELS_DIR", "./ml_models")

        # Cargar modelo
        pkl_path = os.path.join(models_dir, "kmeans_underground.pkl")
        
        if not Path(pkl_path).exists():
            print(json.dumps({"status": "no_model"}))
            sys.exit(0)

        with open(pkl_path, "rb") as f:
            model_obj = pickle.load(f)

        model = model_obj["model"]
        scaler = model_obj["scaler"]
        features = model_obj["features"]
        n_clusters = model_obj["n_clusters"]
        silhouette = model_obj["silhouette"]

        # Obtener datos
        response = requests.get(f"{api_base}/api/reports/underground/overview")
        response.raise_for_status()
        data = response.json()

        por_sensor = data.get("porSensor", [])

        if not por_sensor:
            print(json.dumps({"status": "no_data"}))
            sys.exit(0)

        df = pd.DataFrame(por_sensor)

        missing = [f for f in features if f not in df.columns]
        if missing:
            print(json.dumps({"status": "error", "message": f"Columnas faltantes: {missing}"}))
            sys.exit(1)

        X_raw = df[features].fillna(0).values
        X = scaler.transform(X_raw)

        clusters = model.predict(X)

        centroids = scaler.inverse_transform(model.cluster_centers_)

        sample = []
        for idx, row in df.iterrows():
            sample.append({
                "devEui": row.get("devEui"),
                "location_name": row.get("location_name"),
                "moisture_mean": float(row.get("distance_mean", 0)),      # ⚠️ Underground solo tiene distance
                "temperature_mean": None,
                "ph_mean": None,
                "cluster": int(clusters[idx])
            })

        result = {
            "status": "success",
            "sensor_type": "underground",
            "n_clusters": n_clusters,
            "silhouette": float(silhouette),
            "centroids": centroids.tolist(),
            "sample": sample
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
