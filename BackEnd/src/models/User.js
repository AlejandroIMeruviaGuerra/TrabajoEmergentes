// src/models/User.js
import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
  {
    nombres: { type: String, required: true },
    apellidos: { type: String, required: true },
    rol: { type: String, required: true },
    usuario: { type: String, required: true, unique: true },
    contraseña: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Método para comparar contraseñas
userSchema.statics.comparePassword = async (password, receivedPassword) => {
  return await bcrypt.compare(password, receivedPassword);
};

// El tercer argumento "users" especifica el nombre exacto de la colección
export const UserModel = model("User", userSchema, "users");

