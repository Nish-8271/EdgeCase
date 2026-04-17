const express = require('express');
const router  = express.Router();
const admin   = require('../config/firebase');

// Called after Firebase login — saves token as a cookie
router.post('/session', async (req, res) => {
  const { token } = req.body;

  try {
    // Verify the token is legitimate before trusting it
    await admin.auth().verifyIdToken(token);

    res.cookie('token', token, {
      httpOnly: true,     // JS can't read it — XSS protection
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 5 * 1000,  // 5 days in ms
    });

    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/user/login');
});

module.exports = router;