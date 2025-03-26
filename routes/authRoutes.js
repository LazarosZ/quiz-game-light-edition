// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// User Registration Endpoint
router.post('/register', (req, res) => {
  console.log('Register request received:', req.body);
  const { username, password, department } = req.body;
  
  if (!username || !password || !department) {
    return res.status(400).json({ error: 'Please provide username, password, and department' });
  }

  req.db.get('SELECT * FROM users WHERE username = ?', [username], function(err, row)  {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (row) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    bcrypt.hash(password, 10, function(err, hash) {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).json({ error: 'Error processing password' });
      }

      req.db.run(
        'INSERT INTO users (username, password, role, department) VALUES (?, ?, ?, ?)',
        [username, hash, 'user', department],
        function(err) {
          if (err) {
            console.error('Error inserting user:', err);
            return res.status(500).json({ error: 'Database error during user insertion' });
          }
          res.json({ message: 'User registered successfully' });
        }
      );
    });
  });
});

// User Login Endpoint
router.post('/login', (req, res) => {
  console.log('Login request received:', req.body);
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Please provide username and password' });
  }

  req.db.get('SELECT * FROM users WHERE username = ?', [username], function(err, row) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = row;
    bcrypt.compare(password, user.password, function(err, match) {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ error: 'Error processing login' });
      }
      if (!match) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        department: user.department
      };

      res.json({
        message: 'Login successful',
        user: req.session.user
      });
    });
  });
});

module.exports = router;
