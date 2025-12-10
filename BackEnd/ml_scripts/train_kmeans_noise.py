#!/usr/bin/env python3
"""
train_kmeans_noise.py - K-Means Clustering for Noise Sensors
Entrena un modelo K-Means con datos de sensores de ruido
Features: decibeles_mean, frequency_mean, pressure_mean
"""

import os
import sys
import json
import pickle
from pathlib import Path
from datetime import datetime

import requests
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score


def emit_progress(percentage, message):
    """Emite progreso en formato que el backend puede parsear"""
    print(f"PROGRESS:{percentage}:{message}", flush=True)


def main():
    try:
        # Configuración
        api_base = os.getenv("API_BASE", "http://localhost:4000")
        models_dir = os.getenv("ML_MODELS_DIR", "./ml_models")
        Path(models_dir).mkdir(exist_ok=True)

        emit_progress(5, "Iniciando entrenamiento de K-Means para Noise...")

        # Obtener datos
        emit_progress(10, "Obteniendo datos de API...")
        response = requests.get(f"{api_base}/api/reports/noise/overview", timeout=30)
        response.raise_for_status()
        data = response.json()

        if not data or "data" not in data:
            print(json.dumps({"status": "error", "message": "No hay datos disponibles"}))
            sys.exit(1)

        emit_progress(20, "Procesando datos...")
        
        # Convertir a DataFrame
        df = pd.DataFrame(data["data"])
        
        # Validar columnas
        required_cols = ["decibeles_mean", "frequency_mean", "pressure_mean"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            print(json.dumps({
                "status": "error",
                "message": f"Columnas faltantes: {missing_cols}"
            }))
            sys.exit(1)

        emit_progress(30, f"Datos: {len(df)} registros cargados")

        # Seleccionar features
        X_raw = df[required_cols].fillna(0).values
        
        # Normalizar
        emit_progress(40, "Normalizando features...")
        scaler = StandardScaler()
        X = scaler.fit_transform(X_raw)

        # Entrenar K-Means
        emit_progress(50, "Entrenando K-Means (k=4)...")
        kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
        kmeans.fit(X)

        # Calcular métricas
        emit_progress(70, "Calculando métricas...")
        silhouette = silhouette_score(X, kmeans.labels_)

        emit_progress(80, f"Silhouette Score: {silhouette:.3f}")

        # Guardar modelo
        emit_progress(85, "Guardando modelo...")
        model_obj = {
            "model": kmeans,
            "scaler": scaler,
            "features": required_cols,
            "n_clusters": 4,
            "trained_at": datetime.now().isoformat(),
            "silhouette": silhouette,
            "n_samples": len(df)
        }

        pkl_path = os.path.join(models_dir, "kmeans_noise.pkl")
        with open(pkl_path, "wb") as f:
            pickle.dump(model_obj, f)

        emit_progress(95, f"Modelo guardado en {pkl_path}")

        # Resultado
        emit_progress(100, "Entrenamiento completado exitosamente")
        print(json.dumps({
            "status": "success",
            "message": "Modelo entrenado exitosamente",
            "n_clusters": 4,
            "silhouette": float(silhouette),
            "n_samples": len(df)
        }))

    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e)
        }), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
