// index.js
//require('dotenv').config(); // Load environment variables
const express = require('express');
//const mysql = require('mysql2');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000; //process.env.PORT ||
app.use('/images', express.static(path.join(__dirname, 'images')));

// Middleware to parse JSON bodies
app.use(express.json());

app.use(session({
    secret: 'your-secret-key', // Replace with a strong secret in production
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set secure: true if using HTTPS
  }));

// Serve static files from the "public" folder (this will serve index.html by default)
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const dbPath = path.join(__dirname, 'quiz_game_db.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database.');
  }
});

db.configure("busyTimeout", 5000);

app.use((req, res, next) => {
  req.db = db;
  next();
});

// Mount route modules
const authRoutes = require('./routes/authRoutes');
//const questionRoutes = require('./routes/questionRoutes');
const quizRoutes = require('./routes/quizRoutes');
const departmentQuizRoutes = require('./routes/departmentQuizRoutes');
const adminRoutes = require('./routes/adminRoutes');
//const timeAttackRoutes = require('./routes/timeAttackRoutes');
const trueFalseRoutes = require('./routes/trueFalseRoutes');
const gameStatusRoutes = require('./routes/gameStatusRoutes');
const imageQuizRoutes = require('./routes/imageQuizRoutes');
const csvRoutes = require('./routes/csvRoutes');

app.use('/api/auth', authRoutes);
//app.use('/api/questions', questionRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/departmentquiz', departmentQuizRoutes);
app.use('/api/admin', adminRoutes);
//app.use('/api/timeattack', timeAttackRoutes);
app.use('/api/timeattack/truefalse', trueFalseRoutes);
app.use('/api/game_status', gameStatusRoutes);
app.use('/api/imageQuiz', imageQuizRoutes);
app.use('/api/admin', csvRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
/*
db.serialize(() => {
  //  users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      department VARCHAR(255)
    )
  `);

  //  scores table
  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quiz_score INTEGER,
      time_attack_score INTEGER,
      image_quiz_score INTEGER,
      timestamp DATETIME DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  //  average table
  db.run(`
    CREATE TABLE IF NOT EXISTS average (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      quiz_average INTEGER,
      time_average INTEGER,
      image_average INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  //  game_status table
  db.run(`
    CREATE TABLE IF NOT EXISTS game_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz VARCHAR(255) UNIQUE NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    )
  `);

  // Populate game_status table
  db.run(`INSERT OR IGNORE INTO game_status (quiz) VALUES ('quiz')`);
  db.run(`INSERT OR IGNORE INTO game_status (quiz) VALUES ('image_quiz')`);
  db.run(`INSERT OR IGNORE INTO game_status (quiz) VALUES ('time_attack_true_false')`);

  //  time_attack_questions table
  db.run(`
    CREATE TABLE IF NOT EXISTS time_attack_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      correct VARCHAR(3) NOT NULL, -- expected values: 'yes' or 'no'
      category VARCHAR(255) NOT NULL
    )
  `);

  //  handling_questions table
  db.run(`
    CREATE TABLE IF NOT EXISTS handling_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      option1 VARCHAR(255) NOT NULL,
      option2 VARCHAR(255) NOT NULL,
      option3 VARCHAR(255) NOT NULL,
      option4 VARCHAR(255) NOT NULL,
      correct VARCHAR(255) NOT NULL
    )
  `);

  //  height_questions table
  db.run(`
    CREATE TABLE IF NOT EXISTS height_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      option1 VARCHAR(255) NOT NULL,
      option2 VARCHAR(255) NOT NULL,
      option3 VARCHAR(255) NOT NULL,
      option4 VARCHAR(255) NOT NULL,
      correct VARCHAR(255) NOT NULL
    )
  `);

  //  perception_questions table
  db.run(`
    CREATE TABLE IF NOT EXISTS perception_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      option1 VARCHAR(255) NOT NULL,
      option2 VARCHAR(255) NOT NULL,
      option3 VARCHAR(255) NOT NULL,
      option4 VARCHAR(255) NOT NULL,
      correct VARCHAR(255) NOT NULL
    )
  `);

  //  unsafe_acts_questions table
  db.run(`
    CREATE TABLE IF NOT EXISTS unsafe_acts_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      option1 VARCHAR(255) NOT NULL,
      option2 VARCHAR(255) NOT NULL,
      option3 VARCHAR(255) NOT NULL,
      option4 VARCHAR(255) NOT NULL,
      correct VARCHAR(255) NOT NULL
    )
  `);

  //  cyber_questions table
  db.run(`
    CREATE TABLE IF NOT EXISTS cyber_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      option1 VARCHAR(255) NOT NULL,
      option2 VARCHAR(255) NOT NULL,
      option3 VARCHAR(255) NOT NULL,
      option4 VARCHAR(255) NOT NULL,
      correct VARCHAR(255) NOT NULL
    )
  `);

  // image_questions
  db.run(`
    CREATE TABLE IF NOT EXISTS image_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      image1 VARCHAR(255) NOT NULL,
      image2 VARCHAR(255) NOT NULL,
      correct VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL
    )
  `);
});

*/

