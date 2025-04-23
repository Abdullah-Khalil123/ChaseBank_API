// prismaClient.js
const { PrismaClient } = require("@prisma/client");

let prisma;

if (!global.prisma) {
  global.prisma = new PrismaClient();
}

prisma = global.prisma;

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
    return prisma;
  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
  }
};

module.exports = { prisma, connectDB };
