const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    // Check if token exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

 // Normalize user ID
    const userId = decoded._id || decoded.id;

    // Ensure a valid user ID exists in the token
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    // Normalize user id: some tokens sign it as "id", others as "_id".
    // The rest of the app (candidateController etc.) reads req.user._id,
    // so make sure that field is always present regardless of how the
    // token was signed at login.
    req.user = {
      ...decoded,
      id: userId,
      _id: userId,
    };

    // Continue to next function
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;