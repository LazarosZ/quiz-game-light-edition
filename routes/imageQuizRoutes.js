const express = require('express');
const router = express.Router();

// GET /api/imageQuiz
router.get('/', (req, res) => {
  // Ensure the user is logged in
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized: Please log in to access the quiz.' });
  }
  
  // Use SQLite's RANDOM() to return the questions in random order.
  req.db.all('SELECT * FROM image_questions ORDER BY RANDOM()', [], (err, rows) => {
    if (err) {
      console.error("Error fetching image questions:", err);
      return res.status(500).json({ error: 'Database error fetching questions' });
    }
    res.json(rows);
  });
});

router.post('/submit', async (req, res) => {
    // Ensure the user is logged in
    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized: Please log in to submit your quiz.' });
    }
    
    const userId = req.session.user.id;
    const { score } = req.body;  // score is the image quiz score in this example
    
    if (typeof score !== 'number') {
      return res.status(400).json({ error: 'Invalid score provided.' });
    }
    
    // Insert the image quiz score into the scores table.
    req.db.run(
      'INSERT INTO scores (user_id, image_quiz_score) VALUES (?, ?)',
      [userId, score],
      function(err) {
        if (err) {
          console.error('Error inserting score:', err);
          return res.status(500).json({ error: 'Database error inserting score', details: err });
        }
        
        // Now compute the new image quiz average for this user.
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
            
            // Update the average table using INSERT OR REPLACE.
            // This query retrieves the existing id (if any) for the user and replaces the row.
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
