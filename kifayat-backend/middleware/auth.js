const User = require("../models/User");
const Session = require("../models/Session");
const { verifyToken } = require("../utils/jwt");
const { COOKIE_NAME, clearAuthCookie } = require("../utils/cookies");
const { touchLastActive } = require("../utils/loginLogger");

const sendUnauthorized = (res, message) => {
  clearAuthCookie(res);
  return res.status(401).json({ success: false, message });
};

// Shared session verification used by both the HTTP protect middleware and
// the Socket.IO handshake middleware. Returns the verified user document,
// or null when the token/session is invalid.
const verifySessionToken = async (token) => {
  if (!token) return null;

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return null;
  }

  const session = await Session.findOne({ token, user: decoded.userId });
  if (!session) return null;

  const user = await User.findById(decoded.userId);
  if (!user || !user.isVerified) return null;

  return user;
};

const protect = async (req, res, next) => {
  try {
    const token = req.cookies[COOKIE_NAME];

    if (!token) {
      console.log("🔐 No token found.");
      return sendUnauthorized(res, "Not authenticated. Please log in.");
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      console.error("🔐 Token verification error:", err);
      if (err.name === "TokenExpiredError") {
        // Clean up expired session
        await Session.deleteOne({ token });
        return sendUnauthorized(res, "Session expired. Please log in again.");
      }
      return sendUnauthorized(res, "Invalid token. Please log in again.");
    }

    const session = await Session.findOne({ token, user: decoded.userId });
    if (!session) {
      return sendUnauthorized(res, "Session invalidated. Please log in again.");
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return sendUnauthorized(res, "User not found. Please log in again.");
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ success: false, message: "Email not verified." });
    }

    req.user = user;
    await touchLastActive(user);
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Authentication failed." });
  }
};

module.exports = { protect, verifySessionToken };
