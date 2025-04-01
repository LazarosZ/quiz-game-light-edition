// routes/trueFalseRoutes.js
const express = require('express');
const router = express.Router();

// GET /api/timeattack/truefalse
router.get('/', (req, res) => {
  // Ensure the user is logged in
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized: Please log in to access true/false questions.' });
  }
  
  // Query the time_attack_questions table and order the results randomly
  req.db.all('SELECT * FROM time_attack_questions ORDER BY RANDOM()', (err, results) => {
    if (err) {
      console.error('Error fetching true/false questions:', err);
      return res.status(500).json({ error: 'Database error fetching questions' });
    }
    res.json(results);
  });
});

router.post('/submit', (req, res) => {
    // Ensure the user is logged in via the session
    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized: Please log in to submit your score.' });
    }
    
    const userId = req.session.user.id;
    const { score } = req.body;
    
    // Validate the score: it must be a number
    if (typeof score !== 'number') {
      return res.status(400).json({ error: 'Invalid score provided.' });
    }
    
    // Insert the time attack score into the scores table.
    req.db.run(
      'INSERT INTO scores (user_id, time_attack_score) VALUES (?, ?)',
      [userId, score],
      (err) => {
        if (err) {
          console.error("Error inserting time attack score:", err);
          return res.status(500).json({ error: 'Database error inserting score', details: err });
        }
        
        // Now, compute the new average for time_attack_score for this user.
        req.db.get(
          'SELECT AVG(time_attack_score) AS newTimeAverage FROM scores WHERE user_id = ?',
          [userId],
          (err, avgRow) => {
            if (err) {
              console.error('Error computing quiz average:', err);
              return res.status(500).json({ error: 'Database error computing quiz average', details: err });
            }
            
            const newQuizAverageValue = avgRow.newTimeAverage;
            const newTimeAverage = newQuizAverageValue ? Math.round(Number(newQuizAverageValue)) : 0;
            
            // Update the average table with the new time_attack average.
            req.db.run(
              `INSERT INTO average (user_id, time_average) 
               VALUES (?, ?)
               ON CONFLICT(user_id) DO UPDATE SET time_average = excluded.time_average`,
              [userId, newTimeAverage],
              (err) => {
                if (err) {
                  console.error('Error updating average table:', err);
                  return res.status(500).json({ error: 'Database error updating average table', details: err });
                }
                // Send a single response after all operations are done.
                return res.json({ message: 'Quiz submitted and average updated', testScore: score, newTimeAverage });
              }
            );
          }
        );
      }
    );
  });
  
module.exports = router;
