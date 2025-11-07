import mongoose from "mongoose";

const AirQualitySchema = new mongoose.Schema({
  id: String,
  time: { type: Date, index: true },
  device: {
    devEui: { type: String, index: true },
    name: String,
    profile: String,
    tenant: String,
    application: String,
  },
  location: { lat: Number, lng: Number, address: String },
  radio: { sf: Number, bw: Number, dr: Number, rssi: [Number], snr: [Number] },
  measures: { co2: Number, temperature: Number, humidity: Number, pressure: Number },
  labels: {
    co2_status: String,
    co2_message: String,
    temperature_message: String,
    humidity_message: String,
    pressure_status: String,
  },
}, { timestamps: true, collection: "airqualities" });

// Índices compuestos útiles para dashboards
AirQualitySchema.index({ "device.devEui": 1, time: -1 });
AirQualitySchema.index({ "location.address": 1, time: -1 });

export const AirQualityModel = mongoose.model("AirQuality", AirQualitySchema);
