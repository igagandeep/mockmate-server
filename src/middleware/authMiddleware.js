const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Get token from headers
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Extract token string
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user info to request
    req.user = { id: decoded.id };

    // Continue to next middleware or controller
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
