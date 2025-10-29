// routes/transactionRoutes.js
import express from "express";
import { transferMoney } from "../controllers/transferController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/add", authMiddleware, transferMoney);

export default router;
