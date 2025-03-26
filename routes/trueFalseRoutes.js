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
    // Ensure the user is logged in via the session.
    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized: Please log in to submit your score.' });
    }
    
    const userId = req.session.user.id;
    const { score } = req.body;
    
    // Validate the score: it must be a number.
    if (typeof score !== 'number') {
      return res.status(400).json({ error: 'Invalid score provided.' });
    }
    
    // Insert the time attack score into the scores table.
    // We set the other game scores (quiz_score and image_quiz_score) to 0.
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
  

/*
router.post('/submit', (req, res) => {
    // Ensure the user is logged in via the session.
    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized: Please log in to submit your score.' });
    }
    
    const userId = req.session.user.id;
    const { score } = req.body;
    
    // Validate the score: it must be a number.
    if (typeof score !== 'number') {
      return res.status(400).json({ error: 'Invalid score provided.' });
    }
    
    // Insert the time attack score into the scores table.
    // We set the other game scores (quiz_score and image_quiz_score) to 0.
    req.pool.query(
      'INSERT INTO scores (user_id, time_attack_score, quiz_score, image_quiz_score) VALUES (?, ?, ?, ?)',
      [userId, score, 0, 0],
      (err, result) => {
        if (err) {
          console.error("Error inserting time attack score:", err);
          return res.status(500).json({ error: 'Database error inserting score', details: err });
        }
        res.json({ message: 'Time Attack score submitted', score });

        req.pool.query(
            'SELECT AVG(time_attack_score) AS newQuizAverage FROM scores WHERE user_id = ?',
            [userId],
            (err, avgResults) => {
              if (err) {
                console.error('Error computing quiz average:', err);
                return res.status(500).json({ error: 'Database error computing quiz average', details: err });
              }
              console.log('AVG query results:', avgResults);
              // Convert the computed average to an integer since quiz_average is an INT
              const newQuizAverageValue = avgResults[0].newQuizAverage;
              const newQuizAverage = newQuizAverageValue ? Math.round(Number(newQuizAverageValue)) : 0;
              
              // Upsert the new quiz average into the average table
              req.pool.query(
                `INSERT INTO average (user_id, time_average) 
                 VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE time_average = ?`,
                [userId, newQuizAverage, newQuizAverage],
                (err, result) => {
                  if (err) {
                    console.error('Error updating average table:', err);
                    return res.status(500).json({ error: 'Database error updating average table', details: err });
                  }
                  res.json({ message: 'Quiz submitted and average updated', testScore: score, newQuizAverage });
                }
              );
            }
          );
      }
    );

    // After inserting the new quiz score record...

  });

  
  
*/
module.exports = router;
