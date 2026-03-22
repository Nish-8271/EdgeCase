const admin = require('../config/firebase');

async function authMiddleware(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;   // { uid, email, name, ... }
  } catch (err) {
    req.user = null;
    res.clearCookie('token');
  }

  next();
}

module.exports = authMiddleware;