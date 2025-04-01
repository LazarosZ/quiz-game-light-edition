const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// GET /api/admin/usercsv?username=<username>
// GET CSV, RETURNS CSV DATA AS JSON WITH HEADER AND ROW ARRAYS
router.get('/usercsv', (req, res) => {
  // ADMIN ACCESS
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized: Only admin can access user CSV data.' });
  }
  
  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ error: 'Missing username query parameter.' });
  }
  
  // CSV FILES ARE STORED IN /CSV IN ROOT FOLDER
  // EACH USER HAS A CSV WITH HIS/HERS NAME, AFTER COMPLETING AT ELAST ONCE THE "DEPARTMENT QUIZ"
  const csvDir = path.join(__dirname, '..', 'csv');
  const filePath = path.join(csvDir, `${username}.csv`);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading CSV file:', err);
      return res.status(500).json({ error: 'Error reading CSV file', details: err });
    }
    
    //QUESTIONS WITH COMMAS "MESS UP" THE VIEWING TABLE ################ TO BE FIXED ##############
    const lines = data.trim().split('\n');
    if (lines.length === 0) {
      return res.json({ headers: [], rows: [] });
    }
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    const rows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.replace(/"/g, ''))
    );
    res.json({ headers, rows });
  });

});

module.exports = router;
