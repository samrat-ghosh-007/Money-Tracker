import express from "express";
import { addExpense,getExpenseList,updateExpense, addExpenseCategory, getMonthlyExpenseSummary } from "../controllers/expenseController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/add", authMiddleware, addExpense);
router.get("/", authMiddleware, getExpenseList);
router.patch("/:expenseId", authMiddleware, updateExpense);
router.post("/addMore", authMiddleware, addExpenseCategory);
router.get("/monthly", authMiddleware, getMonthlyExpenseSummary);



export default router;
