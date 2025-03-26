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

router.delete('/scores/reset', (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ error: 'Username is required to reset scores' });
  }

  // First, find the user's ID from the username.
  req.db.get('SELECT id FROM users WHERE username = ?', [username], function(err, row) {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Database error fetching user' });
    }
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = row.id;
    
    // Delete scores for that user.
    req.db.run('DELETE FROM scores WHERE user_id = ?', [userId], function(err) {
      if (err) {
        console.error('Error resetting scores:', err);
        return res.status(500).json({ error: 'Database error resetting scores', details: err });
      }
      
      // Optionally, delete or reset the user's record in the average table.
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

router.delete('/scores/reset-all', (req, res) => {
  // Check that the requester is an admin
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized: Only admins can reset all scores.' });
  }

  // Delete all records from the scores table
  req.db.run('DELETE FROM scores', function(err) {
    if (err) {
      console.error('Error resetting all scores:', err);
      return res.status(500).json({ error: 'Database error resetting all scores', details: err });
    }

    // Optionally, delete all records from the average table as well
    req.db.run('DELETE FROM average', function(err) {
      if (err) {
        console.error('Error resetting averages:', err);
        return res.status(500).json({ error: 'Database error resetting averages', details: err });
      }

      res.json({ message: 'All scores and averages reset successfully' });
    });
  });
});

router.get('/all-scores', (req, res) => {
  // Ensure only admins can access this endpoint.
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
    // Return the results as JSON.
    res.json(rows);
  });
});

router.get('/userinfo', (req, res) => {
  // Only allow admin access.
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized: Only admin can access user info.' });
  }

  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId query parameter.' });
  }

  // Adjust the columns as needed. Here, we assume users table has an email column, etc.
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

router.get('/total-scores', (req, res) => {
  // Ensure that only an admin can access this endpoint.
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
