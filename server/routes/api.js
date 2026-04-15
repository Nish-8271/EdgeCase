const express = require('express');
const router = express.Router();
const { analyzeCode } = require('../services/analyzeService');
const aiRateLimiter = require('../middleware/aiRateLimiter');

// POST /api/analyze-code
router.post('/analyze-code', aiRateLimiter, async (req, res) => {
    // 1. Authentication check
    if (!req.user) {
        return res.status(401).json({ error: 'Please login to use Code Analyzer' });
    }

    const { code, language } = req.body;

    if (!code || !language) {
        return res.status(400).json({ error: 'Code and language are required fields' });
    }

    try {
        const analysis = await analyzeCode(code, language);
        return res.status(200).json({ analysis });
    } catch (err) {
        console.error('Error analyzing code:', err);
        return res.status(500).json({ error: 'Analysis failed. Try again.' });
    }
});

module.exports = router;
