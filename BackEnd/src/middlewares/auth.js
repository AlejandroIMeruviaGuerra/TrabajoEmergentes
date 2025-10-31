// src/middlewares/auth.js
import jwt from "jsonwebtoken";
import { UserModel } from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];

    if (!token) return res.status(403).json({ message: "No se proporcionó un token." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;

    const user = await UserModel.findById(req.userId, { password: 0 });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token inválido." });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expirado." });
    }
    return res.status(500).json({ message: "Error interno al verificar el token." });
  }
};
