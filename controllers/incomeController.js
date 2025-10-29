import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import Income from "../models/Income.js";

export const addIncome = async (req, res) => {
  try {
    const userId = req.user; 
    const { accountId, sourceId, amount } = req.body;

    if (!accountId || !sourceId || !amount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find the account
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const source = await Income.findOne({ _id: sourceId, userId });
    if (!source) {
      return res.status(404).json({ message: "Source not found" });
    }

    // Update balance
    account.balance += Number(amount);
    await account.save();

    const accounts = await Account.find({ userId });
    const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    
    // Update user's overall balance
    await User.findByIdAndUpdate(userId, { overallBalance: total });

    // Record transaction
    const varOcg = await Transaction.create({
      userId,
      accountId,
      title: `Income - ${sourceId}`,
      amount,
      type: "income",
      sourceId,
      date: new Date(),
    });

    return res.status(200).json({
      message: "Income added successfully",
      account,
      transaction: varOcg,
    });
  } catch (error) {
    console.error("Error adding income:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// controllers/incomeController.js


export const addIncomeCategory = async (req, res) => {
  try {
    const userId = req.user; // from JWT
    const { name } = req.body;

    const existing = await Income.findOne({ userId, name });
    if (existing) {
      return res.status(400).json({ message: "Income category already exists" });
    }

    const newIncome = await Income.create({
      userId,
      name,
      isDefault: false,
    });

    res.status(201).json({
      message: "Custom income added successfully",
      income: newIncome,
    });
  } catch (error) {
    console.error("Add income error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getIncomes = async (req, res) => {
  try {
    const userId = req.user; // from JWT middleware

    const incomes = await Income.find({ userId }).select("name");

    res.status(200).json({
      success: true,
      count: incomes.length,
      incomes,
    });
  } catch (error) {
    console.error("Error fetching incomes:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const updateIncomeName = async (req, res) => {
  try {
    const userId = req.user; // from JWT
    const { incomeId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const income = await Income.findOne({ _id: incomeId, userId });
    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }

    income.name = name;
    await income.save();

    res.status(200).json({
      success: true,
      message: "Income name updated successfully",
      income,
    });
  } catch (error) {
    console.error("Update Income Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



export const getMonthlyIncomeSummary = async (req, res) => {
  try {
    const userId = req.user; // from JWT middleware
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ message: "Month query is required (e.g., ?month=2025-10)" });
    }

    const [year, monthNumber] = month.split("-").map(Number);
    const startDate = new Date(year, monthNumber - 1, 1);
    const endDate = new Date(year, monthNumber, 1);

    // Fetch income transactions
    const incomes = await Transaction.find({
      userId,
      type: "income",
      date: { $gte: startDate, $lt: endDate },
    })
      .populate("sourceId", "name") // populate the Income name
      .lean();

    if (incomes.length === 0) {
      return res.status(200).json({
        month,
        totalIncome: 0,
        sourceWise: [],
        message: "No income records found for this month.",
      });
    }

    // Group by income category/source
    const sourceMap = {};
    let totalIncome = 0;

    incomes.forEach((inc) => {
      const sourceName = inc.sourceId?.name || "Uncategorized";
      sourceMap[sourceName] = (sourceMap[sourceName] || 0) + inc.amount;
      totalIncome += inc.amount;
    });

    const sourceWise = Object.entries(sourceMap).map(([source, total]) => ({
      source,
      total,
    }));

    res.status(200).json({
      month,
      totalIncome,
      sourceWise,
    });
  } catch (error) {
    console.error("Error fetching monthly income summary:", error);
    res.status(500).json({ message: "Server error", error });
  }
};



