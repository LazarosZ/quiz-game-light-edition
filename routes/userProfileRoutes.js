const express = require('express');
const router = express.Router();

router.get('/profile/:id', (req, res) => {
    const userId = req.params.id;
    
    const query = `
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

  module.exports = router;