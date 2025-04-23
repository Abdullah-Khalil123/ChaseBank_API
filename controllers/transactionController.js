const { prisma } = require("../config/db");

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await prisma.transaction.findMany({
      orderBy: { date: "desc" },
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            accountName: true,
            accountNumber: true,
          },
        },
      },
    });

    // Get total count
    const totalCount = await prisma.transaction.count();

    res.status(200).json({
      status: "success",
      results: transactions.length,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        transactions,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching transactions",
      error: error.message,
    });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            accountName: true,
            accountNumber: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        status: "error",
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        transaction,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching transaction",
      error: error.message,
    });
  }
};

// Create new transaction
exports.createTransaction = async (req, res) => {
  const { email, description, amount, type, date } = req.body;

  // Validate required fields
  if (!email || !type) {
    return res.status(400).json({
      status: "error",
      message: "Email and transaction type are required",
    });
  }

  try {
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Validate and parse amount
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue)) {
        throw new Error("Invalid amount");
      }

      // Calculate updated balance
      let updatedBalance = user.balance;
      switch (type) {
        case "credit":
        case "ach":
        case "wire":
          updatedBalance += amountValue;
          break;
        case "debit":
        case "fee":
          updatedBalance -= amountValue;
          break;
        case "other":
          updatedBalance += amountValue; // amount can be positive or negative
          break;
        default:
          throw new Error("Invalid transaction type");
      }

      // Create transaction
      const newTransaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          description,
          amount: amountValue,
          type,
          date: date ? new Date(date) : new Date(),
          updatedBalance,
        },
      });

      // Update user balance
      await prisma.user.update({
        where: { id: user.id },
        data: { balance: updatedBalance },
      });

      return { newTransaction, updatedBalance };
    });

    res.status(201).json({
      status: "success",
      data: {
        transaction: result.newTransaction,
        updatedBalance: result.updatedBalance,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error creating transaction",
      error: error.message,
    });
  }
};

// Update transaction
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, type, date } = req.body;

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({
        status: "error",
        message: "Transaction not found",
      });
    }

    // For simplicity, we're not recalculating all balances
    // In a real-world app, you would need to recalculate all subsequent transactions
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        description,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        type,
        date: date ? new Date(date) : undefined,
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        transaction: updatedTransaction,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error updating transaction",
      error: error.message,
    });
  }
};

// Delete transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({
        status: "error",
        message: "Transaction not found",
      });
    }

    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (prisma) => {
      // Find user
      const user = await prisma.user.findUnique({
        where: { id: transaction.userId },
      });

      // Calculate updated balance
      let updatedBalance = user.balance;

      // Reverse the transaction effect
      if (
        transaction.type === "credit" ||
        transaction.type === "ach" ||
        transaction.type === "wire"
      ) {
        updatedBalance -= transaction.amount;
      } else if (transaction.type === "debit" || transaction.type === "fee") {
        updatedBalance += transaction.amount;
      } else {
        // For type 'other', reverse the effect
        updatedBalance -= transaction.amount;
      }

      // Delete transaction
      await prisma.transaction.delete({
        where: { id },
      });

      // Update user balance
      await prisma.user.update({
        where: { id: transaction.userId },
        data: { balance: updatedBalance },
      });
    });

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error deleting transaction",
      error: error.message,
    });
  }
};

// Get transactions by user ID
exports.getTransactionsByUserId = async (req, res) => {
  try {
    const userId = req.params.id;
    const { limit = 10, page = 1 } = req.query;

    console.log("User ID:", req.params);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
      },
      orderBy: { date: "desc" },
      skip,
      take: parseInt(limit),
    });

    // console.log("Transactions:", transactions);

    // Get total count for pagination
    const totalCount = await prisma.transaction.count({
      where: {
        userId: userId,
      },
    });

    res.status(200).json({
      status: "success",
      results: transactions.length,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        transactions,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching user transactions",
      error: error.message,
    });
  }
};
