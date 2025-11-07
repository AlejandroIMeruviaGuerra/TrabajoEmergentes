import mongoose from "mongoose";

const NoiseSchema = new mongoose.Schema({
  id: String,
  time: { type: Date, index: true },
  device: {
    devEui: { type: String, index: true },
    name: String,
    profile: String,
  },
  location: { lat: Number, lng: Number, address: String },
  radio: { sf: Number, bw: Number, dr: Number, rssi: [Number], snr: [Number] },
  measures: { laeq: Number, lai: Number, laimax: Number },
  battery: Number,
  status: String,
}, { timestamps: true, collection: "noises" });

NoiseSchema.index({ "device.devEui": 1, time: -1 });
NoiseSchema.index({ "location.address": 1, time: -1 });

export const NoiseModel = mongoose.model("Noise", NoiseSchema);
