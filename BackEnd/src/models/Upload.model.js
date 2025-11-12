// src/models/Upload.model.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const UploadSchema = new Schema({
  uploadId: { type: String, required: true, unique: true },
  filename: { type: String, required: true },
  size: { type: Number, required: true },
  chunkSize: { type: Number, required: true },
  totalChunks: { type: Number, required: true },
  receivedChunks: { type: [Number], default: [] },
  status: {
    type: String,
    enum: ['init', 'in_progress', 'completed', 'failed'],
    default: 'init'
  },
  md5: { type: String, default: null },
  filePath: { type: String, default: null },
  meta: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UploadSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

UploadSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Upload = mongoose.model('Upload', UploadSchema);
export default Upload;