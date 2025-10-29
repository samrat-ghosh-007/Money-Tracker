import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Expense from "../models/Expense.js";
import User from "../models/User.js";

// __define-ocg__ Expense addition logic
export const addExpense = async (req, res) => {
  try {
    const userId = req.user; // from JWT middleware
    const { accountId, destinationId, amount } = req.body;

    if (!accountId || !destinationId || !amount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find the account
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }


    const destination = await Expense.findOne({ _id: destinationId, userId });
    if (!destination) {
      return res.status(404).json({ message: "Destination not found" });
    }
    
    // Deduct balance
    account.balance -= Number(amount);
    await account.save();
    destination.monthlyExpenses += Number(amount);
    destination.overallExpenses += Number(amount);
    await destination.save();

    const accounts = await Account.find({ userId });
    const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);
        
    // Update user's overall balance
    await User.findByIdAndUpdate(userId, { overallBalance: total });

    // Create expense transaction
    const varOcg = await Transaction.create({
      userId,
      accountId,
      title: `Expense - ${destinationId}`,
      amount,
      type: "expense",
      destinationId,
      date: new Date(),
    });

    return res.status(200).json({
      message: "Expense added successfully",
      account,
      transaction: varOcg,
    });
  } catch (error) {
    console.error("Error adding expense:", error);
    return res.status(500).json({ message: "Server error" });
  }
};




export const addExpenseCategory = async (req, res) => {
  try {
    const userId = req.user;
    const { name } = req.body;

    const existing = await Expense.findOne({ userId, name });
    if (existing) {
      return res.status(400).json({ message: "Expense category already exists" });
    }

    const newExpense = await Expense.create({
      userId,
      name,
      isDefault: false,
    });

    res.status(201).json({
      message: "Custom expense category added successfully",
      expense: newExpense,
    });
  } catch (error) {
    console.error("Add expense error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// Get all expenses and those with a budget > 0
export const getExpenseList = async (req, res) => {
  try {
    const userId = req.user; // from JWT middleware

    // Get all expenses
    const allExpenses = await Expense.find({ userId }).select(
      "name isDefault monthlyBudget monthlyExpenses overallExpenses"
    );

    // Get expenses with monthlyBudget > 0
    const budgetedExpenses = allExpenses.filter(
      (expense) => expense.monthlyBudget > 0
    );

    res.status(200).json({
      success: true,
      total: allExpenses.length,
      allExpenses,
      budgetedExpensesCount: budgetedExpenses.length,
      budgetedExpenses,
    });
  } catch (error) {
    console.error("Error fetching expense list:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Update expense name and/or monthly budget
export const updateExpense = async (req, res) => {
  try {
    const userId = req.user; // from JWT
    const { expenseId } = req.params;
    const { name, monthlyBudget } = req.body;

    // Validate at least one field
    if (!name && monthlyBudget === undefined) {
      return res.status(400).json({ message: "Provide name or monthlyBudget to update" });
    }

    const expense = await Expense.findOne({ _id: expenseId, userId });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (name) expense.name = name;
    if (monthlyBudget !== undefined) expense.monthlyBudget = monthlyBudget;

    await expense.save();

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    console.error("Update Expense Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



export const getMonthlyExpenseSummary = async (req, res) => {
  try {
    const userId = req.user; // from JWT middleware
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ message: "Month query is required (e.g., ?month=2025-10)" });
    }

    // Parse month to Date range
    const [year, monthNumber] = month.split("-").map(Number);
    const startDate = new Date(year, monthNumber - 1, 1);
    const endDate = new Date(year, monthNumber, 1);

    // Get expense transactions for the user in that month
    const expenses = await Transaction.find({
      userId,
      type: "expense",
      date: { $gte: startDate, $lt: endDate },
    })
      .populate("destinationId", "name") // category name
      .lean();

    if (expenses.length === 0) {
      return res.status(200).json({
        totalExpense: 0,
        categoryWise: [],
        message: "No expenses found for this month.",
      });
    }

    // Group by category
    const categoryMap = {};
    let totalExpense = 0;

    expenses.forEach((exp) => {
      const categoryName = exp.destinationId?.name || "Uncategorized";
      categoryMap[categoryName] = (categoryMap[categoryName] || 0) + exp.amount;
      totalExpense += exp.amount;
    });

    // Format result
    const categoryWise = Object.entries(categoryMap).map(([category, total]) => ({
      category,
      total,
    }));

    res.status(200).json({
      month,
      totalExpense,
      categoryWise,
    });
  } catch (error) {
    console.error("Error fetching monthly expenses:", error);
    res.status(500).json({ message: "Server error", error });
  }
};



