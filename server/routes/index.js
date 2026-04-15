// routes/index.js
// GET / — homepage with upcoming contests

const express        = require('express');
const router         = express.Router();
const { getUpcomingContests } = require('../services/contestServices');
const { getTrendingDevNews, getTrendingGitHub } = require('../services/trendingService');

router.get('/', async (req, res) => {
  try {
    const [contests, devNews, githubRepos] = await Promise.all([
      getUpcomingContests(),
      getTrendingDevNews(),
      getTrendingGitHub()
    ]);
    
    return res.render('home', {
      contests,
      devNews,
      githubRepos,
      user: req.user || null,
    });
  } catch (err) {
    console.error('[home] Fetch error:', err.message);
    // Still render homepage — just with empty data
    return res.render('home', {
      contests: [],
      devNews: [],
      githubRepos: [],
      user: req.user || null,
    });
  }
});

module.exports = router;