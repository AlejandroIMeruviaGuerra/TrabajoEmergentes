// src/routes/auth.routes.js
import { Router } from "express";
import { login } from "../controllers/auth.controller.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Aplicar rate limiting estricto a login (máximo 5 intentos por 15 min)
router.post("/login", authLimiter, login);

export default router;

