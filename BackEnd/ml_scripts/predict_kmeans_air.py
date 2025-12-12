import json
import os
import sys
import time

import joblib
import numpy as np
import pandas as pd
import requests

API_BASE = os.getenv("API_BASE", "http://localhost:4000")
MODELS_DIR = os.getenv("ML_MODELS_DIR", "./ml_models")


def main():
  model_path = os.path.join(MODELS_DIR, "kmeans_air.pkl")
  if not os.path.exists(model_path):
    print(json.dumps({"status": "no_model"}))
    return

  model_obj = joblib.load(model_path)
  model = model_obj["model"]
  scaler = model_obj["scaler"]
  features = model_obj["features"]
  n_clusters = model_obj["n_clusters"]
  silhouette = model_obj["silhouette"]

  # 1) obtener últimos datos de /overview
  url = f"{API_BASE}/api/reports/air/overview"
  resp = requests.get(url, timeout=60)
  resp.raise_for_status()
  data = resp.json()
  por_sensor = data.get("porSensor", [])

  if not por_sensor:
    print(json.dumps({"status": "empty"}))
    return

  df = pd.DataFrame(por_sensor)

  # Mantenemos devEui y location_name para mostrar en front
  id_cols = ["devEui", "location_name"]
  for c in id_cols:
    if c not in df.columns:
      df[c] = None

  df = df.dropna(subset=features)
  X_raw = df[features].to_numpy()
  X = scaler.transform(X_raw)

  labels = model.predict(X)
  centroids = scaler.inverse_transform(model.cluster_centers_)

  # armamos muestra
  sample = []
  for i, row in df.iterrows():
    sample.append({
      "devEui": row["devEui"],
      "location_name": row["location_name"],
      "co2_mean": float(row.get("co2_mean", 0)),
      "temperature_mean": float(row.get("temperature_mean", 0)),
      "humidity_mean": float(row.get("humidity_mean", 0)),
      "cluster": int(labels[len(sample)]),
    })

  result = {
    "status": "ok",
    "sensor": "air",
    "n_clusters": int(n_clusters),
    "silhouette": silhouette,
    "centroids": centroids.tolist(),
    "sample": sample,
  }

  print(json.dumps(result))


if __name__ == "__main__":
  main()
