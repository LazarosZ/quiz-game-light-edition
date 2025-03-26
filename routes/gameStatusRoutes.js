const express = require('express');
const router = express.Router();

// GET /api/game_status
// Retrieves all game modes and their active status.
router.get('/', (req, res) => {
  req.db.all('SELECT * FROM game_status', [], (err, rows) => {
    if (err) {
      console.error('Error fetching game statuses:', err);
      return res.status(500).json({ error: 'Database error retrieving game statuses' });
    }
    res.json(rows);
  });
});

// PUT /api/game_status/:quiz
// Updates the active status for a given game mode.
// The request body should include an "active" property (0 or 1).
router.put('/:quiz', (req, res) => {
  // Check that the requester is an admin.
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized: Only admin can update game statuses' });
  }
  
  const quiz = req.params.quiz; // e.g., 'quiz', 'image_quiz', etc.
  const { active } = req.body;
  
  // Validate the active value.
  if (active === undefined) {
    return res.status(400).json({ error: 'Missing active status in request body' });
  }
  if (active !== 0 && active !== 1 && active !== "0" && active !== "1") {
    return res.status(400).json({ error: 'Active status must be 0 or 1' });
  }
  
  req.db.run('UPDATE game_status SET active = ? WHERE quiz = ?', [active, quiz], function(err) {
    if (err) {
      console.error('Error updating game status:', err);
      return res.status(500).json({ error: 'Database error updating game status', details: err });
    }
    res.json({ message: `Game status for "${quiz}" updated to ${active}` });
  });
});

module.exports = router;
