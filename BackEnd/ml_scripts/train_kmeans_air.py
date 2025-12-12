import argparse
import json
import os
import sys
import time

import joblib
import numpy as np
import pandas as pd
import requests
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

API_BASE = os.getenv("API_BASE", "http://localhost:4000")


def emit_progress(pct, msg=""):
  sys.stdout.write(f"PROGRESS:{pct}:{msg}\n")
  sys.stdout.flush()


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument("--n_clusters", type=int, default=4)
  parser.add_argument("--models_dir", type=str, default="./ml_models")
  args = parser.parse_args()

  os.makedirs(args.models_dir, exist_ok=True)

  emit_progress(5, "Descargando datos de /api/reports/air/overview")

  # 1) pedir datos al backend
  url = f"{API_BASE}/api/reports/air/overview"
  resp = requests.get(url, timeout=60)
  resp.raise_for_status()
  data = resp.json()
  por_sensor = data.get("porSensor", [])

  if not por_sensor:
    emit_progress(100, "Sin datos para entrenar")
    print(json.dumps({"status": "empty"}))
    return

  df = pd.DataFrame(por_sensor)

  # Features para clustering de aire
  cols = ["co2_mean", "temperature_mean", "humidity_mean"]
  df = df.dropna(subset=cols)

  X_raw = df[cols].to_numpy()

  emit_progress(20, f"Datos cargados: {X_raw.shape[0]} muestras")

  # 2) escalar
  scaler = StandardScaler()
  X = scaler.fit_transform(X_raw)

  emit_progress(40, "Entrenando modelo KMeans")

  # 3) entrenar KMeans
  model = KMeans(
    n_clusters=args.n_clusters,
    random_state=42,
    n_init=10,
  )
  model.fit(X)

  emit_progress(80, "Calculando métricas")

  # 4) métrica de calidad (silhouette)
  sil = None
  if len(X) > args.n_clusters:
    sil = float(silhouette_score(X, model.labels_))

  # 5) guardar modelo + scaler
  model_obj = {
    "model": model,
    "scaler": scaler,
    "features": cols,
    "n_clusters": args.n_clusters,
    "trained_at": time.time(),
    "silhouette": sil,
  }

  out_path = os.path.join(args.models_dir, "kmeans_air.pkl")
  joblib.dump(model_obj, out_path)

  emit_progress(100, "Entrenamiento finalizado")

  print(json.dumps({
    "status": "ok",
    "model_path": out_path,
    "n_clusters": args.n_clusters,
    "silhouette": sil,
    "samples": int(X.shape[0]),
  }))


if __name__ == "__main__":
  main()
