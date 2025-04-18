// routes/adminRoutes.js
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const router = express.Router();

 //GET /api/admin/scores?username=<username>
 //Returns the score records for the user with the given username. 
 // ###################################################################    IMPORTANT, REACTIVATED ENDPOINT, WITH DURATION FIELD ADDED, AS REQUESTED FROM CLIENT
 
router.get('/scores', (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  
  const query = `
    SELECT u.username, u.department, s.quiz_score, s.time_attack_score, s.image_quiz_score, s.timestamp, s.quiz_duration
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
router.delete('/scores/reset/:role', (req, res) => {
  //ADMIN CHECK
  const userRole = req.params.role;
  if (!userRole || userRole !== 'admin') {
    return res.status(401).json({ error: 'Something went Wrong, please try again.' });
  }
  
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
router.delete('/scores/reset-all/:role', (req, res) => {
  // ADMIN VALIDATION
  const userRole = req.params.role;
  if (!userRole || userRole !== 'admin') {
    return res.status(401).json({ error: 'Something went Wrong, please try again.' });
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
    return res.status(401).json({ error: 'Something went Wrong, please try again.' });
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
    WHERE u.role <> 'admin'
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
    return res.status(401).json({ error: 'Something went Wrong, please try again.' });
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
// GET --> username, first & last Name, email, department, total-score & AVG
// GET SUM OF ALL SCORES, (TO BE DISPLAYED NEXT TO AVERAGE FOR REFERENCE)
router.get('/total-scores/:role', (req, res) => {
  // ADMIN CHECK
  const userRole = req.params.role;
  if (!userRole || userRole !== 'admin') {
    return res.status(401).json({ error: 'Something went Wrong, please try again.' });
  }

// TO EXCLUDE ADMIN ADD THIS------>  WHERE u.role <> 'admin'    <------------
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
    WHERE u.role <> 'admin'
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

router.get('/leaderboard', (req, res) => {

  const query = `
    SELECT 
  user_id,
  firstName,
  lastName,
  department,
  total_quiz_score,
  total_time_attack_score,
  total_image_quiz_score,
  (total_quiz_score + total_time_attack_score + total_image_quiz_score) AS overall_total
FROM (
  SELECT 
    u.id AS user_id,
    u.firstName,
    u.lastName,
    u.department,
    COALESCE(SUM(s.quiz_score), 0) AS total_quiz_score,
    COALESCE(SUM(s.time_attack_score), 0) AS total_time_attack_score,
    COALESCE(SUM(s.image_quiz_score), 0) AS total_image_quiz_score
  FROM users u
  LEFT JOIN scores s ON u.id = s.user_id
  WHERE u.role <> 'admin'
  GROUP BY u.id, u.firstName, u.lastName, u.department
) AS aggregated
ORDER BY overall_total DESC;
  `;
  
  req.db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching total scores:', err);
      return res.status(500).json({ error: 'Database error fetching total scores', details: err });
    }
    res.json(rows);
  });
});

// GET /api/admin/usercsv?username=<username>
// Returns the contents of <username>.csv as JSON array of objects
router.get('/usercsv/:role', (req, res) => {
  // admin check
  const userRole = req.params.role;
  if (!userRole || userRole !== 'admin') {
    return res.status(401).json({ error: 'Something went Wrong, please try again.' });
  }

  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ error: 'Missing username query parameter.' });
  }

  const filePath = path.join(__dirname, '..', 'csv', `${username}.csv`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `CSV for user "${username}" not found.` });
  }

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading CSV file:', err);
      return res.status(500).json({ error: 'Error reading CSV file.', details: err });
    }

    // split into lines and trim
    const lines = data.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return res.json([]);
    }

    // parse header row into field names
    const headers = parseCSVLine(lines[0]);

    // parse each subsequent line and build row objects
    const rows = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] ?? '';
      });
      return obj;
    });

    res.json(rows);
  });
});

// csv line Parser
function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        // double-quote escape
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
  }
  result.push(cur);
  return result;
}



module.exports = router;
