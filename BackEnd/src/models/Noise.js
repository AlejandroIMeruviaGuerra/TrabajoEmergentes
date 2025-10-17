import mongoose from "mongoose";
export const NoiseSchema = new mongoose.Schema({
  sensorId: { type: String, required: true },
  location: { type: String },
  decibels: { type: Number },
  timestamp: { type: Date, default: Date.now },
});
export const NoiseModel = mongoose.model("Noise", NoiseSchema);

export const NoiseTable = `
CREATE TABLE IF NOT EXISTS noise (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sensorId VARCHAR(50),
  location VARCHAR(100),
  decibels FLOAT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;
