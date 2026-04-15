// routes/problems.js

const express        = require('express');
const router         = express.Router();
const problemService = require('../services/problemServices');

// ─── Problem list ─────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const {
      tags     = [],
      minRating,
      maxRating,
      page     = 1,
    } = req.query;

    // tags can come as ?tags=dp&tags=greedy → always array
    const tagsArr = Array.isArray(tags) ? tags : tags ? [tags] : [];
    // console.log('Received query:', { tags: tagsArr, minRating, maxRating, page });
    const { problems, total, totalPages } = await problemService.getAllProblems({
      tags:      tagsArr,
      minRating,
      maxRating,
      page:      parseInt(page),
      limit:     50,
    });

    const allTags = await problemService.getAllTags();

    return res.render('problems', {
      problems,
      allTags,
      total,
      totalPages,
      currentPage:  parseInt(page),
      selectedTags: tagsArr,
      minRating:    minRating || '',
      maxRating:    maxRating || '',
      user:         req.user || null,
    });

  } catch (err) {
    console.error('[problems] Error:', err.message);
    return res.status(500).send('error', {
      message: 'Could not fetch problems. Codeforces may be down.',
      user: req.user || null,
    });
  }
});

// ─── Single problem + editor ──────────────────────────────────────────────────

router.get('/:problemId', async (req, res) => {
  try {
    const problemId = req.params.problemId.replace('-',''); // Convert "1234-A" to "1234/A"
    const problem = await problemService.getProblemById(problemId);
    return res.render('editor', {
      problem,
      user: req.user || null,
    });

  } catch (err) {
    console.error('[problems/:id] Error:', err.message);
    return res.status(404).send('error', {
      message: `Problem "${req.params.problemId}" not found.`,
      user: req.user || null,
    });
  }
});


module.exports = router;