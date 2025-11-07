// src/config/db_mongo.js
import mongoose from "mongoose";

export async function connectMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI no definido en .env");
    process.exit(1);
  }

  const maxPoolSize = Number(process.env.MONGO_MAX_POOL || 30);
  const minPoolSize = Number(process.env.MONGO_MIN_POOL || 5);
  const sstm = Number(process.env.MONGO_SSTM_MS || 10000);
  const w = process.env.MONGO_W || 1; // 1 | majority

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: sstm,
      maxPoolSize,
      minPoolSize,
      retryWrites: true,
      w,
    });
    console.log("✅ Conectado a MongoDB Atlas");
  } catch (err) {
    console.error("❌ Error al conectar a MongoDB:", err.message);
    console.error("   Sugerencia: revisa IP allowlist y credenciales en Atlas.");
    process.exit(1);
  }
}
