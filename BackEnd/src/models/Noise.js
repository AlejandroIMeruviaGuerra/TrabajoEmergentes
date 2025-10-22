import mongoose from "mongoose";

const NoiseSchema = new mongoose.Schema({
  id: String,
  time: Date,
  device: {
    devEui: String,
    name: String,
    profile: String,
  },
  location: { lat: Number, lng: Number, address: String },
  radio: { sf: Number, bw: Number, dr: Number, rssi: [Number], snr: [Number] },
  measures: { laeq: Number, lai: Number, laimax: Number },
  battery: Number,
  status: String,
}, { timestamps: true });

export const NoiseModel = mongoose.model("Noise", NoiseSchema);
