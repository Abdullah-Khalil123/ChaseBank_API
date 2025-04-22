const validateUser = (userData) => {
  const errors = {};

  // Validate required fields
  if (!userData.name) errors.name = "Name is required";
  if (!userData.email) errors.email = "Email is required";
  if (!userData.password) errors.password = "Password is required";
  if (!userData.accountName) errors.accountName = "Account name is required";
  if (!userData.accountType) errors.accountType = "Account type is required";

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (userData.email && !emailRegex.test(userData.email)) {
    errors.email = "Invalid email format";
  }

  // Validate password strength
  if (userData.password && userData.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const validateTransaction = (transactionData) => {
  const errors = {};

  // Validate required fields
  if (!transactionData.userId) errors.userId = "User ID is required";
  if (!transactionData.description)
    errors.description = "Description is required";
  if (transactionData.amount === undefined)
    errors.amount = "Amount is required";
  if (!transactionData.type) errors.type = "Transaction type is required";

  // Validate amount is a number
  if (isNaN(parseFloat(transactionData.amount))) {
    errors.amount = "Amount must be a number";
  }

  // Validate transaction type
  const validTypes = ["credit", "debit", "fee", "ach", "wire", "other"];
  if (transactionData.type && !validTypes.includes(transactionData.type)) {
    errors.type = "Invalid transaction type";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  validateUser,
  validateTransaction,
};
