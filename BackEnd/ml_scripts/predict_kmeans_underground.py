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
            print(json.dumps({
                "status": "no_model",
                "message": "Modelo no entrenado. Ejecuta ENTRENAR primero."
            }))
            sys.exit(0)

        with open(pkl_path, "rb") as f:
            model_obj = pickle.load(f)

        model = model_obj["model"]
        scaler = model_obj["scaler"]
        features = model_obj["features"]
        n_clusters = model_obj["n_clusters"]
        silhouette = model_obj["silhouette"]

        # Obtener datos actuales
        response = requests.get(f"{api_base}/api/reports/underground/overview", timeout=30)
        response.raise_for_status()
        data = response.json()

        if not data or "data" not in data:
            print(json.dumps({"status": "no_data"}))
            sys.exit(0)

        df = pd.DataFrame(data["data"])
        
        # Validar features
        missing = [f for f in features if f not in df.columns]
        if missing:
            print(json.dumps({"status": "error", "message": f"Columnas faltantes: {missing}"}))
            sys.exit(1)

        # Preparar datos
        X_raw = df[features].fillna(0).values
        X = scaler.transform(X_raw)

        # Predecir
        clusters = model.predict(X)
        
        # Centroides
        centroids_scaled = model.cluster_centers_
        centroids = scaler.inverse_transform(centroids_scaled)

        # Construir respuesta
        sample_list = []
        for idx, row in df.iterrows():
            sample_list.append({
                "devEui": row.get("devEui", "unknown"),
                "location": row.get("location_name", "N/A"),
                "moisture_mean": float(row.get("moisture_mean", 0)),
                "temperature_mean": float(row.get("temperature_mean", 0)),
                "ph_mean": float(row.get("ph_mean", 0)),
                "cluster": int(clusters[idx])
            })

        result = {
            "status": "success",
            "sensor_type": "underground",
            "n_clusters": n_clusters,
            "silhouette": float(silhouette),
            "centroids": [
                {
                    "cluster": i,
                    "moisture": float(centroids[i][0]),
                    "temperature": float(centroids[i][1]),
                    "ph": float(centroids[i][2])
                }
                for i in range(n_clusters)
            ],
            "sample": sample_list
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
