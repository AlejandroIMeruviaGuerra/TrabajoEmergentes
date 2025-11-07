import mongoose from "mongoose";

const UndergroundSchema = new mongoose.Schema({
  id: String,
  time: { type: Date, index: true },
  device: {
    devEui: { type: String, index: true },
    name: String,
    profile: String,
  },
  location: { lat: Number, lng: Number, address: String },
  radio: { sf: Number, bw: Number, dr: Number, rssi: [Number], snr: [Number] },
  measures: { distance: Number, unit: String },
  status: String,
  battery: Number,
}, { timestamps: true, collection: "undergrounds" });

UndergroundSchema.index({ "device.devEui": 1, time: -1 });
UndergroundSchema.index({ "location.address": 1, time: -1 });

export const UndergroundModel = mongoose.model("Underground", UndergroundSchema);
