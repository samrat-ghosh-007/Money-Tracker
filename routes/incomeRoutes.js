import express from "express";
import { addIncome, addIncomeCategory, getIncomes,updateIncomeName, getMonthlyIncomeSummary } from "../controllers/incomeController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, addIncome);
router.post("/addMore",authMiddleware, addIncomeCategory);
router.get("/", authMiddleware, getIncomes);
router.patch("/:incomeId", authMiddleware, updateIncomeName);
router.get("/monthly", authMiddleware, getMonthlyIncomeSummary);


export default router;
