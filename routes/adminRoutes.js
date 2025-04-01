// routes/adminRoutes.js
const express = require('express');
const router = express.Router();

/**
 * GET /api/admin/scores?username=<username>
 * Returns the score records for the user with the given username.
 */
router.get('/scores', (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  
  const query = `
    SELECT u.username, u.department, s.quiz_score, s.time_attack_score, s.image_quiz_score, s.timestamp
    FROM users u
    JOIN scores s ON u.id = s.user_id
    WHERE u.username = ?
    ORDER BY s.timestamp DESC
  `;
  
  req.db.all(query, [username], (err, rows) => {
    if (err) {
      console.error('Error fetching scores for user:', err);
      return res.status(500).json({ error: 'Database error fetching scores' });
    }
    res.json(rows);
  });
});

// DELETE reset scores for specific user, selected through search-bar
router.delete('/scores/reset', (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ error: 'Username is required to reset scores' });
  }

  // GET users id by username
  req.db.get('SELECT id FROM users WHERE username = ?', [username], function(err, row) {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Database error fetching user' });
    }
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = row.id;
    
    // DELETE SCORES FOT USER
    req.db.run('DELETE FROM scores WHERE user_id = ?', [userId], function(err) {
      if (err) {
        console.error('Error resetting scores:', err);
        return res.status(500).json({ error: 'Database error resetting scores', details: err });
      }
      
      // DELETE AVERAGE FOR USER
      req.db.run('DELETE FROM average WHERE user_id = ?', [userId], function(err) {
        if (err) {
          console.error('Error resetting averages:', err);
          return res.status(500).json({ error: 'Database error resetting averages', details: err });
        }
        
        res.json({ message: 'Scores and averages reset successfully' });
      });
    });
  });
});

// RESET ALL SCORES
router.delete('/scores/reset-all', (req, res) => {
  // ADMIN VALIDATION
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized: Only admins can reset all scores.' });
  }

  // DELETE ALL SCORES FROM SCORES TABLE
  req.db.run('DELETE FROM scores', function(err) {
    if (err) {
      console.error('Error resetting all scores:', err);
      return res.status(500).json({ error: 'Database error resetting all scores', details: err });
    }

    // DELETE ALL AVERAGES FROM AVERAGE TABLE
    req.db.run('DELETE FROM average', function(err) {
      if (err) {
        console.error('Error resetting averages:', err);
        return res.status(500).json({ error: 'Database error resetting averages', details: err });
      }

      res.json({ message: 'All scores and averages reset successfully' });
    });
  });
});

// ALL AVERAGES FROM AVERAGE TABLE
router.get('/all-scores', (req, res) => {
  // ADMIN VALIDATION
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized: Only admin can access this endpoint.' });
  }

  const query = `
    SELECT 
      u.id, 
      u.username, 
      u.department,
      IFNULL(a.quiz_average, 0) AS quiz_average,
      IFNULL(a.time_average, 0) AS time_attack_average,
      IFNULL(a.image_average, 0) AS image_quiz_average
    FROM users u
    LEFT JOIN average a ON u.id = a.user_id
    ORDER BY u.username ASC
  `;

  req.db.all(query, (err, rows) => {
    if (err) {
      console.error('Error fetching user scores:', err);
      return res.status(500).json({ error: 'Database error fetching user scores' });
    }

    res.json(rows);
  });
});

//GET USER INFO
router.get('/userinfo', (req, res) => {
  // ADMIN VALIDATION
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized: Only admin can access user info.' });
  }

  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId query parameter.' });
  }

  // USER INFO, CAN BE EXTENDED LATER WITH EMAIL, EMPLOYED SINCE, SALARY, ETC ETC
  req.db.get('SELECT id, username, department FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      console.error('Error fetching user info:', err);
      return res.status(500).json({ error: 'Database error fetching user info', details: err });
    }
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(row);
  });
});

// GET SUM OF ALL SCORES, (TO BE DISPLAYED NEXT TO AVERAGE FOR REFERENCE)
router.get('/total-scores', (req, res) => {
  // ADMIN CHECK
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized: Only admins can access total scores.' });
  }

  const query = `
    SELECT 
      u.id AS user_id,
      u.username,
      u.department,
      COALESCE(SUM(s.quiz_score), 0) AS total_quiz_score,
      COALESCE(AVG(s.quiz_score), 0) AS avg_quiz_score,
      COALESCE(SUM(s.time_attack_score), 0) AS total_time_attack_score,
      COALESCE(AVG(s.time_attack_score), 0) AS avg_time_attack_score,
      COALESCE(SUM(s.image_quiz_score), 0) AS total_image_quiz_score,
      COALESCE(AVG(s.image_quiz_score), 0) AS avg_image_quiz_score
    FROM users u
    LEFT JOIN scores s ON u.id = s.user_id
    GROUP BY u.id, u.username, u.department
    ORDER BY u.username;
  `;
  
  req.db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching total scores:', err);
      return res.status(500).json({ error: 'Database error fetching total scores', details: err });
    }
    res.json(rows);
  });
});

module.exports = router;
