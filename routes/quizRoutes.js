// routes/quizRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Map categories to their corresponding table names  ###### // TESTING "LEFT-OVERS" TO BE CLEANED UP #######
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

//GET /api/quiz
// CURRENTLY NOT USED ENDPOINT, SEE-------> DEPARTMENTQUIZROUTES.JS
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
      rows = rows.map(q => ({ ...q, category: tableObj.category }));
      questions = questions.concat(rows);
      completed++;
      if (completed === tables.length) {
        res.json(questions);
      }
    });
  });
});


// SUBMIT ENDPOINT USED FROM DEPARTMENTQUIZROUTES
// CREATION OF CSV
router.post('/submit', async (req, res) => {
  // LOGIN STATUS
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized: Please log in to submit the quiz.' });
  }
  
  const userId = req.session.user.id;
  const start = req.session.quizStart;
  const durationMs = start ? Date.now() - start : null;
  const durationS = Math.round(durationMs / 1000);
  delete req.session.quizStart;

  const { answers } = req.body;
  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid answers array; must provide 20 answers' });
  }
  
  try {
    // CHECK EACH ANSWER
    const answerPromises = answers.map(answer => {
      return new Promise((resolve, reject) => {
        const { questionId, category, selectedOption } = answer;
        const tableName = tableMapping[category];
        if (!tableName) {
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
    
    // INSERT QUIZ SCORE
    req.db.run(
      'INSERT INTO scores (user_id, quiz_score, quiz_duration) VALUES (?, ?, ?)',
      [userId, score, durationS],
      function(err) {
        if (err) {
          console.error('Error inserting score:', err);
          return res.status(500).json({ error: 'Database error inserting score', details: err });
        }
        
        // FIND NEW AVERAGE
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
            
            // INSERT NEW AVERAGE
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
                const username = req.session.user.username;
                const csvDir = path.join(__dirname, '..', 'csv');
                fs.mkdirSync(csvDir, { recursive: true });
                const filePath = path.join(csvDir, `${username}.csv`);
                
                // If CSV file doesnt exist, is created here with header.
                if (!fs.existsSync(filePath)) {
                  fs.writeFileSync(filePath, 'Question,Correct Answer,Answer Given,Category,Result\n');
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
                      //const row = results[0];// MYSQL LEFTOVERS, IGNORE
                      //CREATE CSV LINE
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
//MODIFIED ENDPOINT, CURRENTLY NOT USED, SEE----------------> DEPARTMENTQUIZROUTES.JS
router.get('/departmentquiz', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized: Please log in to get a quiz' });
  }
  
  const department = req.session.user.department.toLowerCase();
  const tables = departmentTables[department]; // accounting and warehouse
  
  if (!tables) {
    return res.status(400).json({ error: 'No quiz available for your department' });
  }
  
  const numQuestionsPerTable = 10;
  const promises = tables.map(tableObj => {
    return new Promise((resolve, reject) => {
      req.db.all(
        `SELECT * FROM ${tableObj.name} ORDER BY RANDOM() LIMIT ?`, 
        [numQuestionsPerTable], 
        (err, rows) => {
          if (err) {
            return reject(err);
          }
          // Attach the category to each question
          const mappedRows = rows.map(q => ({ ...q, category: tableObj.category}));
          //results = results.map(q => ({ ...q, category: tableObj.category }));// MYSQL LEFTOVERS, IGNORE
          resolve(mappedRows);
        }
      );
    });
  });
  
  // WAIT QUERIES TO FINISH AND RETURN THEM
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