const express = require('express');
const router  = express.Router();
const { generateEdgeCases } = require('../services/edgeCaseGenerator');
const aiRateLimiter = require('../middleware/aiRateLimiter');

// This route is just for testing the AI-generated edge cases feature
router.get('/', (req, res) => {
    console.log('Accessing /test route');
    if(!req.user){
        return res.redirect('/user/login');
    }
    return res.render('edgeCase',{ user: req.user || null,
      result: null,
      error: null });
});


router.post('/generate', aiRateLimiter, async (req, res) => {
    const problemStatement = req.body.problem ;
    try {
        
        const result= await generateEdgeCases(problemStatement);
        console.log('Generated edge cases:', result);
       return res.render('edgeCase',{ user: req.user || null,
      result: result,
      error: null});
    } catch (err) {
        console.error('Error generating edge cases:', err);
         return res.render('edgeCase',{ user: req.user || null,
                result: null,
                error: "Failed to generate test cases"});
    }
});

module.exports = router;