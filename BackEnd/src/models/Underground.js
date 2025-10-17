import mongoose from "mongoose";
export const UndergroundSchema = new mongoose.Schema({
  sensorId: { type: String, required: true },
  location: { type: String },
  humidity: { type: Number },
  temperature: { type: Number },
  timestamp: { type: Date, default: Date.now },
});
export const UndergroundModel = mongoose.model("Underground", UndergroundSchema);

export const UndergroundTable = `
CREATE TABLE IF NOT EXISTS underground (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sensorId VARCHAR(50),
  location VARCHAR(100),
  humidity FLOAT,
  temperature FLOAT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;
