import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

export const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user; // from JWT middleware
    const { accountId, type, startDate, endDate } = req.query;

    const query = { userId };

    if (accountId) query.accountId = accountId;
    if (type) query.type = type; // income / expense / transfer
    if (startDate && endDate)
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };

    const transactions = await Transaction.find(query)
      .populate("accountId", "name")
      .populate("sourceId", "name")
      .populate("destinationId", "name") // show account name
      .populate("fromAccountId", "name") // show account name
      .populate("toAccountId", "name") // show account name
      .sort({ date: -1 }); // latest first


  

    res.status(200).json({ transactions });
  } catch (error) {
    console.error("Get Transactions Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getMonthlyIncomeVsExpense = async (req, res) => {
  try {
    const userId = req.user; // from JWT middleware
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({
        message: "Month query is required (e.g., ?month=2025-10)",
      });
    }

    const [year, monthNumber] = month.split("-").map(Number);
    const startDate = new Date(year, monthNumber - 1, 1);
    const endDate = new Date(year, monthNumber, 1);

    // Fetch transactions for the given month
    const transactions = await Transaction.find({
      userId,
      date: { $gte: startDate, $lt: endDate },
    }).lean();

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx) => {
      if (tx.type === "income") totalIncome += tx.amount;
      else if (tx.type === "expense") totalExpense += tx.amount;
    });

    res.status(200).json({
      month,
      totalIncome,
      totalExpense,
      profit: totalIncome - totalExpense,
    });
  } catch (error) {
    console.error("Error fetching monthly income vs expense:", error);
    res.status(500).json({ message: "Server error", error });
  }
};



export const getDailySummary = async (req, res) => {
  try {
    const userId = req.user; // from JWT
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({
        message: "Month query is required (e.g., ?month=2025-10)",
      });
    }

    const [year, monthNumber] = month.split("-").map(Number);
    const startDate = new Date(year, monthNumber - 1, 1);
    const endDate = new Date(year, monthNumber, 1);

    // Fetch all transactions for the given month
    const transactions = await Transaction.find({
      userId,
      date: { $gte: startDate, $lt: endDate },
    }).lean();

    // If no data found
    if (transactions.length === 0) {
      return res.status(200).json({
        month,
        data: [],
        message: "No transactions found for this month.",
      });
    }

    // Initialize all days
    const daysInMonth = new Date(year, monthNumber, 0).getDate();
    const dailyData = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      dailyData[dateKey] = { totalIncome: 0, totalExpense: 0 };
    }

    // Calculate daily totals
    transactions.forEach((tx) => {
      const dateKey = tx.date.toISOString().split("T")[0];
      if (!dailyData[dateKey]) return; // skip if not in current month
      if (tx.type === "income") dailyData[dateKey].totalIncome += tx.amount;
      if (tx.type === "expense") dailyData[dateKey].totalExpense += tx.amount;
    });

    // Convert object → array
    const dailySummary = Object.keys(dailyData)
      .sort()
      .map((date) => ({
        date,
        totalIncome: dailyData[date].totalIncome,
        totalExpense: dailyData[date].totalExpense,
      }));

    res.status(200).json({
      month,
      data: dailySummary,
    });
  } catch (error) {
    console.error("Error fetching daily summary:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
