// routes/departmentQuizRoutes.js
const express = require('express');
const router = express.Router();

//TABLES FOR QUESTION SETS
// WAREHOUSE SEES ALL
// ACCOUNTING DOES NOT SEE: MANUAL-HANDLING AND WORKING-ON-HEIGHT
const departmentTables = {
  accounting: [
    { name: 'cyber_questions', category: 'cyber' },
    { name: 'perception_questions', category: 'perception' },
    { name: 'unsafe_acts_questions', category: 'unsafe'}
  ],
  warehouse: [
    { name: 'handling_questions', category: 'handling' },
    { name: 'height_questions', category: 'height' },
    { name: 'cyber_questions', category: 'cyber' },
    { name: 'perception_questions', category: 'perception' },
    { name: 'unsafe_acts_questions', category: 'unsafe'}
  ]
};

/**
 * GET /api/departmentquiz
 * Returns a department-specific quiz based on the user's department.
 */


////////////////////////////////////////// NO SUBMIT ENDPOINT HERE, SEE quizRoutes.js !!!!!!!!!!!!
router.get('/', (req, res) => {
  // Ensure the user is logged in
  if (!req.session.user || !req.session.user.department) {
    return res.status(401).json({ error: 'Unauthorized: Please log in to get a quiz' });
  }
  
  const department = req.session.user.department.toLowerCase();
  const tables = departmentTables[department];
  
  if (!tables) {
    return res.status(400).json({ error: 'No quiz available for your department' });
  }
  
  const numQuestionsPerTable = 10; // ADJUST IF NEEDED ( IF WE HAVE MORE QUESTIONS)
  const promises = tables.map(tableObj => {
    return new Promise((resolve, reject) => {
      req.db.all(
        `SELECT * FROM ${tableObj.name} ORDER BY RANDOM() LIMIT ?`, 
        [numQuestionsPerTable], 
        (err, rows) => {
          if (err) {
            return reject(err);
          }
          // ATTACH CATEGORY TO QUESTION FOR CLARITY
          rows = rows.map(q => ({ ...q, category: tableObj.category }));
          resolve(rows);
        }
      );
    });
  });
// SHUFFLE QUESTIONS
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  Promise.all(promises)
    .then(resultsArrays => {
      // Flatten the array of arrays
      const allQuestions = [].concat(...resultsArrays);
      const shuffledQuestions = shuffleArray(allQuestions);
    res.json(shuffledQuestions);
    })
    .catch(err => {
      console.error('Error fetching department quiz questions:', err);
      res.status(500).json({ error: 'Database error fetching questions', details: err });
    });
});

module.exports = router;
