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
  const { email, description, amount, type, date, isPending, balance } =
    req.body;

  // Only email is required now
  if (!email) {
    return res.status(400).json({
      status: "error",
      message: "Email is required",
    });
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Prepare transaction data with defaults for missing values
    const transactionData = {
      userId: user.id,
      description: description || "Unnamed transaction", // Default description
      amount: amount ? parseFloat(amount) : 0, // Default amount
      type: type || "misc_credit", // Default type
      date: date ? new Date(date) : new Date(), // Default to current date
      isPending: isPending !== undefined ? Boolean(isPending) : false, // Default to false
      updatedBalance: balance ? parseFloat(balance) : 0, // Just use the transaction amount
    };

    // Validate amount if provided
    if (amount !== undefined && isNaN(parseFloat(amount))) {
      return res.status(400).json({
        status: "error",
        message: "Invalid amount format",
      });
    }

    // Validate type if provided
    if (
      type &&
      ![...creditTypes, ...debitTypes, ...otherTypes].includes(type)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid transaction type",
      });
    }

    // Create transaction with prepared data
    const newTransaction = await prisma.transaction.create({
      data: transactionData,
    });

    res.status(201).json({
      status: "success",
      data: {
        transaction: newTransaction,
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
    const { description, amount, type, date, isPending } = req.body;

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

    // Prepare update data - only include fields that were provided
    const updateData = {};

    if (description !== undefined) updateData.description = description;

    if (amount !== undefined) {
      const updatedAmount = parseFloat(amount);
      if (isNaN(updatedAmount)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid amount format",
        });
      }
      updateData.amount = updatedAmount;
    }

    if (type !== undefined) {
      if (
        type &&
        ![...creditTypes, ...debitTypes, ...otherTypes].includes(type)
      ) {
        return res.status(400).json({
          status: "error",
          message: "Invalid transaction type",
        });
      }
      updateData.type = type;
    }

    if (date !== undefined) {
      try {
        updateData.date = new Date(date);
      } catch (error) {
        return res.status(400).json({
          status: "error",
          message: "Invalid date format",
        });
      }
    }

    if (isPending !== undefined) {
      updateData.isPending = Boolean(isPending);
    }

    // Update the transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      status: "success",
      message: "Transaction updated",
      data: { transaction: updatedTransaction },
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

    // Delete transaction
    await prisma.transaction.delete({
      where: { id },
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
