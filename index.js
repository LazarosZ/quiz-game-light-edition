// index.js
//require('dotenv').config(); // NOT NEEDED LOCALLY, WILL USE IN PRODUCTION!!
const express = require('express');
//const mysql = require('mysql2'); // SAME AS DOTENV
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000; 
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(express.json());

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
  }));

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

const authRoutes = require('./routes/authRoutes');
//const questionRoutes = require('./routes/questionRoutes'); // TESTING REMAININGS, TO BE CLEANED UP
const quizRoutes = require('./routes/quizRoutes');
const departmentQuizRoutes = require('./routes/departmentQuizRoutes');
const adminRoutes = require('./routes/adminRoutes');
//const timeAttackRoutes = require('./routes/timeAttackRoutes'); // TESTING REMAININGS, TO BE CLEANED UP
const trueFalseRoutes = require('./routes/trueFalseRoutes'); // NEW TIME ATTACK ROUTES
const gameStatusRoutes = require('./routes/gameStatusRoutes');
const imageQuizRoutes = require('./routes/imageQuizRoutes');
const csvRoutes = require('./routes/csvRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes')

const cors = require('cors');
//app.use(cors()); // Allows all origins
app.use(cors({
  origin: 'http://localhost:8080', // your front end
  credentials: true
}));

app.use('/api/auth', authRoutes);
//app.use('/api/questions', questionRoutes); //TESTING REMAININGS, TO BE CLEANED UP
app.use('/api/quiz', quizRoutes);
app.use('/api/departmentquiz', departmentQuizRoutes);
app.use('/api/admin', adminRoutes);
//app.use('/api/timeattack', timeAttackRoutes);// TESTING REMAININGS, TO BE CLEANED UP
app.use('/api/timeattack/truefalse', trueFalseRoutes);
app.use('/api/game_status', gameStatusRoutes);
app.use('/api/imageQuiz', imageQuizRoutes);
app.use('/api/admin', csvRoutes);
app.use('/api', userProfileRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

//TESTING REMAININGS, TO BE CLEANED UP
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

