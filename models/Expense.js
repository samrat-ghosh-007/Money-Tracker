// models/Expense.js
import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
     isDefault: {
      type: Boolean,
      default: false, // true for system-created incomes
    },
    monthlyBudget: {
    type: Number,
    default: 0,
  },
  monthlyExpenses: {
    type: Number,
    default: 0,
  },
  overallExpenses: {
    type: Number,
    default: 0,
  },
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
