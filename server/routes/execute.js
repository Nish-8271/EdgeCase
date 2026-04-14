// routes/execute.js
// POST /execute — available to all users (guest + logged in)

const express         = require('express');
const router          = express.Router();
const { executeCode } = require('../services/codeExecutor');

const SUPPORTED = ['cpp', 'python', 'java', 'c', 'rust'];

router.post('/', async (req, res) => {
  const { code, language, input = '' } = req.body;

  // ── Validation ────────────────────────────────────────────
  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'No code provided.' });
  }

  if (!SUPPORTED.includes(language)) {
    return res.status(400).json({ error: `Unsupported language: ${language}` });
  }

  if (code.length > 50_000) {
    return res.status(400).json({ error: 'Code exceeds 50KB limit.' });
  }

  // ── Execute ───────────────────────────────────────────────
  try {
    const result = await executeCode({ code, language, input });

    if (result.timedOut) {
      return res.json({
        stdout:        '',
        stderr:        'Time Limit Exceeded (10s)',
        compileError:  null,
        timedOut:      true,
        executionTime: null,
      });
    }

    return res.json({
      stdout:        result.stdout,
      stderr:        result.stderr,
      compileError:  result.compileError,
      timedOut:      false,
      exitCode:      result.exitCode,
      executionTime: result.executionTime,
    });

  } catch (err) {
    console.error('[execute] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Execution service unavailable. Is Docker running?' });
  }
});

module.exports = router;