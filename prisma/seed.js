// File: prisma/seed.js
const { prisma } = require("../config/db");
const bcrypt = require("bcryptjs");

// Configuration
const NUM_USERS = 50; // Number of regular users to create
const NUM_ADMINS = 5; // Number of admin users to create
const MIN_TRANSACTIONS = 10; // Minimum number of transactions per user
const MAX_TRANSACTIONS = 30; // Maximum number of transactions per user
const NUM_STATEMENTS = 12; // Number of statements per user (e.g., 12 months)
const STARTING_DATE = new Date("2024-01-01"); // Starting date for transactions

// Helper function to generate random number between min and max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate random float between min and max with 2 decimal places
function getRandomFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// Helper function to generate a random date between start and end
function getRandomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

// Helper function to add days to a date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper function to generate random account number
function generateAccountNumber() {
  return `...${getRandomInt(1000, 9999)}`;
}

// Helper function to generate transaction description
function generateTransactionDescription(type) {
  const descriptions = {
    credit: [
      "Customer Payment",
      "Direct Deposit",
      "Interest Payment",
      "Refund",
      "Invoice Payment",
      "Sales Revenue",
      "Contract Payment",
      "Rebate",
      "Deposit",
      "Transfer In",
    ],
    debit: [
      "Vendor Payment",
      "Utility Bill",
      "Rent Payment",
      "Equipment Purchase",
      "Office Supplies",
      "Insurance Premium",
      "Tax Payment",
      "Maintenance Fee",
      "Marketing Expense",
      "Payroll",
    ],
    fee: [
      "Monthly Service Fee",
      "Overdraft Fee",
      "Wire Transfer Fee",
      "Late Payment Fee",
      "ATM Fee",
      "Account Maintenance Fee",
      "Card Replacement Fee",
      "Foreign Transaction Fee",
      "Statement Fee",
      "Returned Check Fee",
    ],
    ach: [
      "ACH Payment",
      "ACH Transfer",
      "Direct Deposit",
      "Automated Payment",
      "Payroll Deposit",
      "Vendor ACH",
      "Supplier Payment",
      "Scheduled Transfer",
      "Subscription Payment",
      "Bill Payment",
    ],
    wire: [
      "Wire Transfer",
      "International Wire",
      "Domestic Wire",
      "Urgent Payment",
      "Large Purchase",
      "Escrow Payment",
      "Real Estate Transaction",
      "Investment Transfer",
      "Supplier Payment",
      "International Payment",
    ],
    other: [
      "Adjustment",
      "Balance Correction",
      "Account Reconciliation",
      "Miscellaneous Credit",
      "Miscellaneous Debit",
      "Special Transaction",
      "Manual Adjustment",
      "Credit Reversal",
      "Debit Reversal",
      "Bonus Payment",
    ],
  };

  return descriptions[type][
    Math.floor(Math.random() * descriptions[type].length)
  ];
}

// Helper function to generate a random company name
function generateCompanyName() {
  const prefixes = [
    "Alpha",
    "Beta",
    "Delta",
    "Echo",
    "Global",
    "Infinite",
    "Mega",
    "Nova",
    "Omega",
    "Prime",
    "Royal",
    "Silver",
    "Summit",
    "Titan",
    "United",
    "Vanguard",
    "Vertex",
    "Zenith",
    "Pioneer",
    "Elite",
  ];

  const industries = [
    "Tech",
    "Solutions",
    "Industries",
    "Enterprises",
    "Corp",
    "Group",
    "Partners",
    "Associates",
    "International",
    "Holdings",
    "Systems",
    "Services",
    "Logistics",
    "Ventures",
    "Innovations",
  ];

  const suffix =
    Math.random() > 0.7 ? " LLC" : Math.random() > 0.5 ? " Inc." : " Co.";

  return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${
    industries[Math.floor(Math.random() * industries.length)]
  }${suffix}`;
}

// Helper function to generate a random account type
function generateAccountType() {
  const types = [
    "BUS COMPLETE CHK",
    "PREMIUM BUSINESS CHK",
    "SMALL BUSINESS CHK",
    "BUSINESS ADVANTAGE",
    "CORPORATE EXEC",
    "PLATINUM BUSINESS",
    "BUSINESS INTEREST",
    "BUSINESS CHECKING PLUS",
    "ENTERPRISE ACCOUNT",
    "MERCHANT SERVICES",
  ];

  return types[Math.floor(Math.random() * types.length)];
}

// Helper function to generate user data
function generateUser(isAdmin = false) {
  const firstName = [
    "James",
    "John",
    "Robert",
    "Michael",
    "William",
    "David",
    "Richard",
    "Joseph",
    "Thomas",
    "Charles",
    "Mary",
    "Patricia",
    "Jennifer",
    "Linda",
    "Elizabeth",
    "Barbara",
    "Susan",
    "Jessica",
    "Sarah",
    "Karen",
  ][getRandomInt(0, 19)];

  const lastName = [
    "Smith",
    "Johnson",
    "Williams",
    "Jones",
    "Brown",
    "Davis",
    "Miller",
    "Wilson",
    "Moore",
    "Taylor",
    "Anderson",
    "Thomas",
    "Jackson",
    "White",
    "Harris",
    "Martin",
    "Thompson",
    "Garcia",
    "Martinez",
    "Robinson",
  ][getRandomInt(0, 19)];

  return {
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomInt(
      1,
      999
    )}@example.com`,
    password: bcrypt.hashSync("password123", 10),
    phone: `(${getRandomInt(100, 999)}) ${getRandomInt(
      100,
      999
    )}-${getRandomInt(1000, 9999)}`,
    address: `${getRandomInt(100, 9999)} ${
      [
        "Main",
        "Oak",
        "Maple",
        "Washington",
        "Franklin",
        "Highland",
        "Park",
        "Cedar",
        "Pine",
        "Elm",
      ][getRandomInt(0, 9)]
    } ${
      ["St", "Ave", "Blvd", "Rd", "Ln", "Dr", "Way", "Pl", "Ct", "Ter"][
        getRandomInt(0, 9)
      ]
    }, ${
      [
        "New York",
        "Los Angeles",
        "Chicago",
        "Houston",
        "Phoenix",
        "Philadelphia",
        "San Antonio",
        "San Diego",
        "Dallas",
        "San Jose",
      ][getRandomInt(0, 9)]
    }, ${
      ["NY", "CA", "IL", "TX", "AZ", "PA", "TX", "CA", "TX", "CA"][
        getRandomInt(0, 9)
      ]
    } ${getRandomInt(10000, 99999)}`,
    accountName: isAdmin ? "Admin Account" : generateCompanyName(),
    accountType: generateAccountType(),
    accountNumber: generateAccountNumber(),
    role: isAdmin,
    balance: getRandomFloat(5000, 100000),
    availableCredit: getRandomFloat(10000, 50000),
  };
}

// Main seeding function
async function main() {
  console.log("Starting database seeding...");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.statement.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.user.deleteMany({});

  // Create admin users
  console.log(`Creating ${NUM_ADMINS} admin users...`);
  const adminUsers = [];
  for (let i = 0; i < NUM_ADMINS; i++) {
    const adminUser = await prisma.user.create({
      data: generateUser(true),
    });
    adminUsers.push(adminUser);
  }

  // Create one specific admin user for easy login
  console.log("Creating a specific admin user...");
  const mainAdmin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: bcrypt.hashSync("admin123", 10),
      phone: "(555) 555-5555",
      address: "123 Admin St, Admin City, AC 12345",
      accountName: "System Administrator",
      accountType: "ADMIN ACCOUNT",
      accountNumber: "...0000",
      role: true,
      balance: 1000000,
      availableCredit: 100000,
    },
  });
  adminUsers.push(mainAdmin);

  // Create regular users with transactions and statements
  console.log(
    `Creating ${NUM_USERS} regular users with transactions and statements...`
  );
  const regularUsers = [];

  for (let i = 0; i < NUM_USERS; i++) {
    // Create user
    const userData = generateUser(false);
    const user = await prisma.user.create({
      data: userData,
    });
    regularUsers.push(user);

    console.log(`Created user ${i + 1}/${NUM_USERS}: ${user.name}`);

    // Generate transactions
    const numTransactions = getRandomInt(MIN_TRANSACTIONS, MAX_TRANSACTIONS);
    console.log(
      `  Generating ${numTransactions} transactions for ${user.name}...`
    );

    let currentBalance = userData.balance;
    let currentDate = new Date(STARTING_DATE);
    const endDate = new Date();

    const transactionTypes = ["credit", "debit", "fee", "ach", "wire", "other"];
    const transactions = [];

    for (let j = 0; j < numTransactions; j++) {
      // Ensure date progression
      currentDate = addDays(currentDate, getRandomInt(1, 15));
      if (currentDate > endDate) {
        currentDate = new Date(endDate);
      }

      // Generate transaction
      const type =
        transactionTypes[getRandomInt(0, transactionTypes.length - 1)];
      let amount;

      if (type === "credit" || type === "ach" || type === "wire") {
        amount = getRandomFloat(100, 10000);
        currentBalance += amount;
      } else if (type === "debit" || type === "fee") {
        amount = getRandomFloat(10, 2000);
        currentBalance -= amount;
      } else {
        // For 'other' type, could be positive or negative
        amount = getRandomFloat(-1000, 1000);
        currentBalance += amount;
      }

      const transaction = {
        userId: user.id,
        description: generateTransactionDescription(type),
        amount,
        type,
        date: new Date(currentDate),
        updatedBalance: currentBalance,
      };

      transactions.push(transaction);
    }

    // Sort transactions by date
    transactions.sort((a, b) => a.date - b.date);

    // Adjust balances to be accurate based on chronological order
    let runningBalance =
      userData.balance -
      transactions.reduce(
        (sum, t) =>
          sum +
          (t.type === "credit" || t.type === "ach" || t.type === "wire"
            ? t.amount
            : t.type === "debit" || t.type === "fee"
            ? -t.amount
            : t.amount),
        0
      );

    for (const transaction of transactions) {
      if (
        transaction.type === "credit" ||
        transaction.type === "ach" ||
        transaction.type === "wire"
      ) {
        runningBalance += transaction.amount;
      } else if (transaction.type === "debit" || transaction.type === "fee") {
        runningBalance -= transaction.amount;
      } else {
        runningBalance += transaction.amount;
      }
      transaction.updatedBalance = parseFloat(runningBalance.toFixed(2));
    }

    // Create transactions in database
    await prisma.transaction.createMany({
      data: transactions,
    });

    // Update user's final balance
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: runningBalance },
    });

    // Generate statements
    console.log(
      `  Generating ${NUM_STATEMENTS} statements for ${user.name}...`
    );
    const currentYear = new Date().getFullYear();
    const statements = [];

    for (let j = 0; j < NUM_STATEMENTS; j++) {
      const month = (((new Date().getMonth() - j) % 12) + 12) % 12; // Go back j months from current month
      const year = currentYear - Math.floor((new Date().getMonth() - j) / 12);

      // Find transactions for this month
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const monthTransactions = transactions.filter(
        (t) => t.date >= startDate && t.date <= endDate
      );

      // Calculate start and end balances
      const startBalance =
        monthTransactions.length > 0
          ? monthTransactions[0].updatedBalance -
            getAmountEffect(monthTransactions[0])
          : userData.balance;

      const endBalance =
        monthTransactions.length > 0
          ? monthTransactions[monthTransactions.length - 1].updatedBalance
          : startBalance;

      statements.push({
        userId: user.id,
        month: month + 1, // 1-12 for Jan-Dec
        year,
        startBalance,
        endBalance,
        statementUrl: `https://example.com/statements/${user.id}/${year}/${
          month + 1
        }.pdf`,
        generatedDate: new Date(year, month + 1, 5), // Statement generated on the 5th of next month
      });
    }

    // Create statements in database
    await prisma.statement.createMany({
      data: statements,
    });
  }

  // Create one specific regular user for easy login
  console.log("Creating a specific regular user...");
  const mainUser = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "user@example.com",
      password: bcrypt.hashSync("user123", 10),
      phone: "(555) 123-4567",
      address: "456 User Ave, User City, UC 54321",
      accountName: "Abdullah PRODUCTS LLC",
      accountType: "BUS COMPLETE CHK",
      accountNumber: "...6032",
      role: false,
      balance: 20249.75,
      availableCredit: 5000,
    },
  });
  regularUsers.push(mainUser);

  // Add specific transactions for the main user
  console.log("Adding specific transactions for the main user...");
  const mainUserTransactions = [
    {
      userId: mainUser.id,
      description: "Payment to Vendor",
      amount: 1250.0,
      type: "debit",
      date: new Date("2025-04-20"),
      updatedBalance: 20249.75,
    },
    {
      userId: mainUser.id,
      description: "Customer Payment",
      amount: 9500.0,
      type: "credit",
      date: new Date("2025-04-18"),
      updatedBalance: 21499.75,
    },
    {
      userId: mainUser.id,
      description: "Utility Bill",
      amount: 345.25,
      type: "debit",
      date: new Date("2025-04-15"),
      updatedBalance: 17999.75,
    },
  ];

  await prisma.transaction.createMany({
    data: mainUserTransactions,
  });

  console.log("Database seeding completed!");
  console.log("----------------------------------------");
  console.log("Admin login: admin@example.com / admin123");
  console.log("User login: user@example.com / user123");
  console.log("----------------------------------------");
}

// Helper function to determine how a transaction affects the balance
function getAmountEffect(transaction) {
  if (
    transaction.type === "credit" ||
    transaction.type === "ach" ||
    transaction.type === "wire"
  ) {
    return transaction.amount;
  } else if (transaction.type === "debit" || transaction.type === "fee") {
    return -transaction.amount;
  } else {
    return transaction.amount;
  }
}

// Execute the seeding
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
