// src/models/AirQuality.js
import mongoose from "mongoose";
export const AirQualitySchema = new mongoose.Schema({
  sensorId: { type: String, required: true },
  location: { type: String },
  pm25: { type: Number },
  pm10: { type: Number },
  co2: { type: Number },
  timestamp: { type: Date, default: Date.now },
});
export const AirQualityModel = mongoose.model("AirQuality", AirQualitySchema);

// Estructura MySQL (para referencia)
export const AirQualityTable = `
CREATE TABLE IF NOT EXISTS air_quality (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sensorId VARCHAR(50),
  location VARCHAR(100),
  pm25 FLOAT,
  pm10 FLOAT,
  co2 FLOAT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;
