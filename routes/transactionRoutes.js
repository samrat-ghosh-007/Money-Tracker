// routes/transactionRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getUserTransactions, getMonthlyIncomeVsExpense, getDailySummary } from "../controllers/transactionController.js";

const router = express.Router();


// Get all or filtered transactions
router.get("/", authMiddleware, getUserTransactions);
router.get("/summary", authMiddleware, getMonthlyIncomeVsExpense);
router.get("/daily-summary", authMiddleware, getDailySummary );


export default router;
