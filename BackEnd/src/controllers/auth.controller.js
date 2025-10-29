// src/controllers/auth.controller.js
import { UserModel } from "../models/User.js";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  try {
    const { usuario, contraseña } = req.body;

    if (!usuario || !contraseña) {
      return res.status(400).json({ message: "Usuario y contraseña son requeridos." });
    }

    const userFound = await UserModel.findOne({ usuario });

    if (!userFound) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    const isMatch = await UserModel.comparePassword(contraseña, userFound.contraseña);

    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    // Crear token
    const token = jwt.sign({ id: userFound._id, rol: userFound.rol }, process.env.JWT_SECRET, {
      expiresIn: "1d", // El token expira en 1 día
    });

    res.json({
      token,
      message: "Inicio de sesión exitoso",
    });
  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

