const express = require('express');
const router = express.Router();

router.get('/profile/:id', (req, res) => {
    const userId = req.params.id;
    
    const query = `
      SELECT
        user_id,
        username,
        firstName,
        lastName,
        email,
        department,
        total_quiz_score,
        avg_quiz_score,
        total_time_attack_score,
        avg_time_attack_score,
        total_image_quiz_score,
        avg_image_quiz_score,
        (total_quiz_score + total_time_attack_score + total_image_quiz_score) AS overall_total
        FROM (
      SELECT
        u.id AS user_id,
        u.username,
        u.firstName,
        u.lastName,
        u.email,
        u.department,
        COALESCE(SUM(s.quiz_score), 0) AS total_quiz_score,
        COALESCE(AVG(s.quiz_score), 0) AS avg_quiz_score,
        COALESCE(SUM(s.time_attack_score), 0) AS total_time_attack_score,
        COALESCE(AVG(s.time_attack_score), 0) AS avg_time_attack_score,
        COALESCE(SUM(s.image_quiz_score), 0) AS total_image_quiz_score,
        COALESCE(AVG(s.image_quiz_score), 0) AS avg_image_quiz_score
      FROM users u
      LEFT JOIN scores s ON u.id = s.user_id
      WHERE u.id = ?
      GROUP BY u.id, u.username
      ) AS aggregated
       ORDER BY overall_total DESC;
    `;
    
    req.db.get(query, [userId], (err, row) => {
      if (err) {
        console.error('Error fetching user score summary:', err);
        return res.status(500).json({ error: 'Database error fetching user score summary', details: err });
      }
      if (!row) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(row);
    });
  });

  router.get('/userrank/:id', (req, res) => {
    const userId = req.params.id;
    // This query calculates the user's overall total score, then counts how many users have a higher overall total.
    const query = `
      SELECT 1 + (
  SELECT COUNT(*) FROM (
    SELECT 
      u.id AS user_id,
      COALESCE(
      SUM(
      COALESCE(s.quiz_score, 0) +
      COALESCE(s.time_attack_score, 0) +
      COALESCE(s.image_quiz_score, 0)
      ),
      0
      ) AS overall_total
    FROM users u
    LEFT JOIN scores s ON u.id = s.user_id
    GROUP BY u.id
  ) AS leaderboard
  WHERE leaderboard.overall_total > (
    SELECT COALESCE(
    SUM(
    COALESCE(s.quiz_score, 0) +
    COALESCE(s.time_attack_score, 0) +
    COALESCE(s.image_quiz_score, 0)
    ),
     0
  ) FROM users u
    LEFT JOIN scores s ON u.id = s.user_id
    WHERE u.id = ?
    GROUP BY u.id
  )
) AS rank;
    `;
  
    req.db.get(query, [userId], (err, row) => {
      if (err) {
        console.error('Error fetching user rank:', err);
        return res.status(500).json({ error: 'Database error fetching user rank', details: err });
      }
      if (!row) {
        return res.status(404).json({ error: 'User not found or no score data available' });
      }
      res.json(row); // e.g., { "rank": 3 }
    });
  });
  

  module.exports = router;
