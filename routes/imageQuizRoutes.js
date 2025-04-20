const express = require('express');
const router = express.Router();

// GET /api/imageQuiz
router.get('/:department', (req, res) => {
  // CHECK LOG IN STATUS
  const department = req.params.department;
  if (!department) {
    return res.status(401).json({ error: 'Unauthorized: Please log in to access the quiz.' });
  }
  
  //RANDOMIZE QUESTIONS POSITION
  req.db.all('SELECT * FROM image_questions ORDER BY RANDOM()', [], (err, rows) => {
    if (err) {
      console.error("Error fetching image questions:", err);
      return res.status(500).json({ error: 'Database error fetching questions' });
    }
    res.json(rows);
  });
});

router.post('/submit', async (req, res) => {
    // LOGIN STATUS
    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized: Please log in to submit your quiz.' });
    }
    
    const userId = req.session.user.id;
    const { score } = req.body;  // SCORE HERE IS IMAGE-QUIZ-SCORE
    
    if (typeof score !== 'number') {
      return res.status(400).json({ error: 'Invalid score provided.' });
    }
    
    // INSERT IMAGE-QUIZ-SCORE IN SCORES TABLE
    req.db.run(
      'INSERT INTO scores (user_id, image_quiz_score) VALUES (?, ?)',
      [userId, score],
      function(err) {
        if (err) {
          console.error('Error inserting score:', err);
          return res.status(500).json({ error: 'Database error inserting score', details: err });
        }
        
        // COMPUTE NEW AVERAGE
        req.db.get(
          'SELECT AVG(image_quiz_score) AS newImageAverage FROM scores WHERE user_id = ?',
          [userId],
          (err, row) => {
            if (err) {
              console.error('Error computing image quiz average:', err);
              return res.status(500).json({ error: 'Database error computing image quiz average', details: err });
            }
            
            const newImageAverageValue = row.newImageAverage;
            const newImageAverage = newImageAverageValue ? Math.round(Number(newImageAverageValue)) : 0;
            
            // UPDATE AVERAGE WITH NEW VALUE
            req.db.run(
              `INSERT OR REPLACE INTO average (id, user_id, image_average, quiz_average, time_average)
               VALUES (
                 (SELECT id FROM average WHERE user_id = ?),
                 ?,
                 ?,
                 COALESCE((SELECT quiz_average FROM average WHERE user_id = ?), 0),
                 COALESCE((SELECT time_average FROM average WHERE user_id = ?), 0)
               )`,
              [userId, userId, newImageAverage, userId, userId],
              function(err) {
                if (err) {
                  console.error('Error updating average table:', err);
                  return res.status(500).json({ error: 'Database error updating average table', details: err });
                }
                return res.json({ message: 'Quiz submitted and average updated', score, newImageAverage });
              }
            );
          }
        );
      }
    );
  });
  

module.exports = router;
