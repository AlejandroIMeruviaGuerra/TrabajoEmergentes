import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export let pool;

export async function connectMySQL() {
  try {
    pool = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log("✅ Conectado a MySQL");
  } catch (error) {
    console.error("❌ Error al conectar a MySQL:", error.message);
  }
}
