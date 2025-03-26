// routes/quizRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Map categories to their corresponding table names
//const tableMapping = {
 // fire: 'fire_questions',
 // electro: 'electro_questions',
 // warehouse: 'warehouse_questions',
 // forklift: 'forklift_questions'
//};

const tableMapping = {
    cyber: 'cyber_questions',
    handling: 'handling_questions',
    height: 'height_questions',
    image: 'image_questions',
    perception: 'perception_questions',
    time: 'time_attack_questions',
    unsafe: 'unsafe_acts_questions'
};

const departmentTables = {
  accounting: [
    { name: 'cyber_questions', category: 'cyber' },
    { name: 'perception_questions', category: 'perception' },
    { name: 'unsafe_acts_questions', category: 'unsafe'}
  ],
  warehouse: [
    { name: 'handling_questions', category: 'handling' },
    { name: 'height_questions', category: 'height' },
    { name: 'cyber_questions', category: 'cyber' },
    { name: 'perception_questions', category: 'perception' },
    { name: 'unsafe_acts_questions', category: 'unsafe'}
  ]
};

/**
 * GET /api/quiz
 * Fetches 10 random questions from each category (total 20 questions).
 */
router.get('/', (req, res) => {
  const tables = [
    { name: 'handling_questions', category: 'handling' },
    { name: 'height_questions', category: 'height' },
    { name: 'cyber_questions', category: 'cyber' },
    { name: 'perception_questions', category: 'perception' },
    { name: 'unsafe_acts_questions', category: 'unsafe'}
  ];
  
  let questions = [];
  let completed = 0;
  
  tables.forEach(tableObj => {
    req.db.all(`SELECT * FROM ${tableObj.name} ORDER BY RANDOM() LIMIT 10`,
      [],
      (err, rows) => {
      if (err) {
        console.error(`Error fetching questions from ${tableObj.name}:`, err);
        return res.status(500).json({ error: 'Database error fetching questions' });
      }
      // Add a category property to each question for later reference
      rows = rows.map(q => ({ ...q, category: tableObj.category }));
      questions = questions.concat(rows);
      completed++;
      if (completed === tables.length) {
        // Optionally, shuffle the 20 questions here if desired
        res.json(questions);
      }
    });
  });
});



router.post('/submit', async (req, res) => {
  // Ensure the user is logged in via the session.
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized: Please log in to submit the quiz.' });
  }
  
  const userId = req.session.user.id;
  const { answers } = req.body;
  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid answers array; must provide 20 answers' });
  }
  
  try {
    // Process each answer as a promise.
    const answerPromises = answers.map(answer => {
      return new Promise((resolve, reject) => {
        const { questionId, category, selectedOption } = answer;
        const tableName = tableMapping[category];
        if (!tableName) {
          // Invalid category; count as incorrect.
          return resolve(false);
        }
        req.db.get(
          `SELECT correct FROM ${tableName} WHERE id = ?`,
           [questionId],
          (err, row) => {
          if (err) {
            console.error(`Error fetching question ${questionId} from ${tableName}:`, err);
            return reject(err);
          }
          if (row && row.correct === selectedOption) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    });
    
    const resultsArray = await Promise.all(answerPromises);
    const score = resultsArray.filter(isCorrect => isCorrect === true).length;
    console.log('Computed score:', score);
    
    // Insert the quiz score into the scores table.
    req.db.run(
      'INSERT INTO scores (user_id, quiz_score) VALUES (?, ?)',
      [userId, score],
      function(err) {
        if (err) {
          console.error('Error inserting score:', err);
          return res.status(500).json({ error: 'Database error inserting score', details: err });
        }
        
        // Compute the new quiz average.
        req.db.get(
          'SELECT AVG(quiz_score) AS newQuizAverage FROM scores WHERE user_id = ?',
          [userId],
          (err, avgRow) => {
            if (err) {
              console.error('Error computing quiz average:', err);
              return res.status(500).json({ error: 'Database error computing quiz average', details: err });
            }
            
            const newQuizAverageValue = avgRow.newQuizAverage;
            const newQuizAverage = newQuizAverageValue ? Math.round(Number(newQuizAverageValue)) : 0;
            
            // Upsert into the average table.
            req.db.run(
              `INSERT OR REPLACE INTO average (user_id, quiz_average) 
               VALUES (?, ?)
               ON CONFLICT(user_id) DO UPDATE SET quiz_average = excluded.quiz_average`,
              [userId, newQuizAverage],
              function(err) {
                if (err) {
                  console.error('Error updating average table:', err);
                  return res.status(500).json({ error: 'Database error updating average table', details: err });
                }
                
                // CSV Saving Logic:
                // Determine the CSV file path based on the username.
                const username = req.session.user.username;
                const csvDir = path.join(__dirname, '..', 'csv');
                fs.mkdirSync(csvDir, { recursive: true });
                const filePath = path.join(csvDir, `${username}.csv`);
                
                // If the CSV file doesn't exist, create it with a header.
                if (!fs.existsSync(filePath)) {
                  fs.writeFileSync(filePath, 'Question,Correct Answer,Answer Given\n');
                }
                
                // For each answer, fetch the question text and correct answer.
                const csvPromises = req.body.answers.map(answer => {
                  return new Promise((resolve, reject) => {
                    const { questionId, category, selectedOption } = answer;
                    const tableName = tableMapping[category];
                    if (!tableName) return resolve('');
                    req.db.get(`SELECT question, correct FROM ${tableName} WHERE id = ?`,
                      [questionId],
                      (err, row) => {
                      if (err) return reject(err);
                      if (!row) return resolve('');
                      //const row = results[0];
                      // Create a CSV line, wrapping text in double quotes and escaping double quotes.
                      const result = selectedOption === row.correct ? "Correct" : "Wrong";
                      const csvLine = `"${row.question.replace(/"/g, '""')}","${row.correct}","${selectedOption}","${tableName}","${result}"\n`;
                      resolve(csvLine);
                    });
                  });
                });
                
                Promise.all(csvPromises)
                  .then(lines => {
                    const csvContent = lines.filter(line => line !== '').join('');
                    fs.appendFile(filePath, csvContent, (err) => {
                      if (err) {
                        console.error("Error writing to CSV file:", err);
                        // Even if CSV writing fails, we send a response.
                        return res.json({ message: 'Quiz submitted and average updated, but CSV saving failed.', testScore: score, newQuizAverage });
                      }
                      return res.json({ message: 'Quiz submitted, average updated, and CSV saved', testScore: score, newQuizAverage });
                    });
                  })
                  .catch(err => {
                    console.error("Error processing CSV submission:", err);
                    return res.json({ message: 'Quiz submitted and average updated, but error processing CSV data', testScore: score, newQuizAverage });
                  });
              }
            );
          }
        );
      }
    );
    
  } catch (error) {
    console.error('Error processing quiz submission:', error);
    return res.status(500).json({ error: 'Error processing quiz submission', details: error });
  }
});

router.get('/departmentquiz', (req, res) => {
  // Ensure the user is logged in
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized: Please log in to get a quiz' });
  }
  
  const department = req.session.user.department.toLowerCase();
  const tables = departmentTables[department]; // accounting and warehouse
  
  if (!tables) {
    return res.status(400).json({ error: 'No quiz available for your department' });
  }
  
  const numQuestionsPerTable = 10;
  
  // Create a promise for each table query
  const promises = tables.map(tableObj => {
    return new Promise((resolve, reject) => {
      req.db.all(
        `SELECT * FROM ${tableObj.name} ORDER BY RANDOM() LIMIT ?`, 
        [numQuestionsPerTable], 
        (err, rows) => {
          if (err) {
            return reject(err);
          }
          // Attach the category to each question so the client knows where it came from
          const mappedRows = rows.map(q => ({ ...q, category: tableObj.category}));
          //results = results.map(q => ({ ...q, category: tableObj.category }));
          resolve(mappedRows);
        }
      );
    });
  });
  
  // Wait for all queries to finish, then flatten the results and return them
  Promise.all(promises)
    .then(resultsArrays => {
      const allQuestions = [].concat(...resultsArrays);
      res.json(allQuestions);
    })
    .catch(err => {
      console.error('Error fetching department quiz questions:', err);
      res.status(500).json({ error: 'Database error fetching questions', details: err });
    });
});

module.exports = router;