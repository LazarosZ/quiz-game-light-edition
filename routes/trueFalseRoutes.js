// routes/trueFalseRoutes.js
const express = require('express');
const router = express.Router();

// GET /api/timeattack/truefalse
router.get('/', (req, res) => {
  // LOGIN STATUS
  const department = req.params.department;
  if (!department) {
    return res.status(401).json({ error: 'Unauthorized: Please log in to access true/false questions.' });
  }
  
  // RANDOMIZE QUESTIONS ON SELECT
  req.db.all('SELECT * FROM time_attack_questions ORDER BY RANDOM()', (err, results) => {
    if (err) {
      console.error('Error fetching true/false questions:', err);
      return res.status(500).json({ error: 'Database error fetching questions' });
    }
    res.json(results);
  });
});

router.post('/submit', (req, res) => {
    // LOGIN STATUS+SESSION
    //if (!req.session.user) {
      //return res.status(401).json({ error: 'Unauthorized: Please log in to submit your score.' });
    //}
    
    //const userId = req.session.user.id;
    const userId = req.params.id;
    const { score } = req.body;
    
    if (typeof score !== 'number') {
      return res.status(400).json({ error: 'Invalid score provided.' });
    }
    
    // INSERT TIME-ATTACK-SCORE
    req.db.run(
      'INSERT INTO scores (user_id, time_attack_score) VALUES (?, ?)',
      [userId, score],
      (err) => {
        if (err) {
          console.error("Error inserting time attack score:", err);
          return res.status(500).json({ error: 'Database error inserting score', details: err });
        }
        
        // GET NEW AVERAGE
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
            
            // INSERT NEW AVERAGE
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
                return res.json({ message: 'Quiz submitted and average updated', testScore: score, newTimeAverage });
              }
            );
          }
        );
      }
    );
  });
  
module.exports = router;
