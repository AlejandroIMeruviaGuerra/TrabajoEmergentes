import mongoose from "mongoose";

const UndergroundSchema = new mongoose.Schema({
  id: String,
  time: Date,
  device: {
    devEui: String,
    name: String,
    profile: String,
  },
  location: { lat: Number, lng: Number, address: String },
  radio: { sf: Number, bw: Number, dr: Number, rssi: [Number], snr: [Number] },
  measures: { distance: Number, unit: String },
  status: String,
  battery: Number,
}, { timestamps: true });

export const UndergroundModel = mongoose.model("Underground", UndergroundSchema);
