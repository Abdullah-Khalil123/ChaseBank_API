const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");

exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "You are not logged in. Please log in to access.",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!currentUser) {
      return res.status(401).json({
        status: "error",
        message: "The user belonging to this token no longer exists.",
      });
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Invalid token. Please log in again.",
    });
  }
};

// Admin middleware
exports.restrictTo = () => {
  return (req, res, next) => {
    if (!req.user.role) {
      return res.status(403).json({
        status: "error",
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};
