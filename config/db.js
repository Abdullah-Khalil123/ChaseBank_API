const { PrismaClient } = require("@prisma/client");

let prisma;

if (process.env.NODE_ENV === "production") {
  // In production, we create one instance of PrismaClient
  prisma = new PrismaClient();
} else {
  // In development, use a global instance to avoid creating too many clients
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;

  prisma.$on("query", (e) => {
    console.log("Query: ", e.query);
  });
}

module.exports = { prisma };
