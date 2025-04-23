const { prisma } = require("../config/db");

const creditTypes = [
  "ach_credit",
  "ach_employee_payment",
  "ach_vendor_payment",
  "deposit",
  "incoming_wire_transfer",
  "misc_credit",
  "refund",
  "zelle_credit",
];

const debitTypes = [
  "ach_debit",
  "atm_transaction",
  "bill_payment",
  "card",
  "loan_payment",
  "misc_debit",
  "outgoing_wire_transfer",
  "overnight_check",
  "tax_payment",
  "egift_debit",
  "zelle_debit",
];

const otherTypes = [
  "account_transfer",
  "adjustment_or_reversal",
  "returned_deposit_item",
  "checks_under_2_years",
  "checks_over_2_years",
];

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

      if (creditTypes.includes(type)) {
        updatedBalance += amountValue;
      } else if (debitTypes.includes(type)) {
        updatedBalance -= amountValue;
      } else if (otherTypes.includes(type)) {
        updatedBalance += amountValue; // Could handle differently if needed
      } else {
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

      return { newTransaction, updatedBalance, userId: user.id };
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

    // Find the transaction to update
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({
        status: "error",
        message: "Transaction not found",
      });
    }

    // Get the user associated with the transaction
    const user = await prisma.user.findUnique({
      where: { id: transaction.userId },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Recalculate balance for this specific transaction
    let newBalance = user.balance;

    // Check if the transaction is being updated and adjust the balance
    if (amount !== undefined) {
      const updatedAmount = parseFloat(amount);
      const updatedType = type || transaction.type; // Keep the same type if not updated
      const updatedDate = date ? new Date(date) : transaction.date;

      // Remove the old transaction amount from the balance first
      if (creditTypes.includes(transaction.type)) {
        newBalance -= transaction.amount;
      } else if (debitTypes.includes(transaction.type)) {
        newBalance += transaction.amount;
      } else if (otherTypes.includes(transaction.type)) {
        newBalance -= transaction.amount;
      }

      // Now, add the new transaction amount to the balance
      if (creditTypes.includes(updatedType)) {
        newBalance += updatedAmount;
      } else if (debitTypes.includes(updatedType)) {
        newBalance -= updatedAmount;
      } else if (otherTypes.includes(updatedType)) {
        newBalance += updatedAmount; // Adjust according to custom logic
      }

      // Update the transaction
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          description: description || transaction.description,
          amount: updatedAmount,
          type: updatedType,
          date: updatedDate,
          updatedBalance: newBalance, // Update balance for this transaction
        },
      });

      // Update user's balance with the new balance
      await prisma.user.update({
        where: { id: user.id },
        data: { balance: newBalance },
      });

      res.status(200).json({
        status: "success",
        message: "Transaction updated and balance recalculated",
        data: { transactionId: id, updatedBalance: newBalance },
      });
    } else {
      res.status(400).json({
        status: "error",
        message: "Amount is required for update",
      });
    }
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
      if (creditTypes.includes(transaction.type)) {
        updatedBalance -= transaction.amount;
      } else if (debitTypes.includes(transaction.type)) {
        updatedBalance += transaction.amount;
      } else if (otherTypes.includes(transaction.type)) {
        updatedBalance -= transaction.amount;
      } else {
        throw new Error("Invalid transaction type");
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
