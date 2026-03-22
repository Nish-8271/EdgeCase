const express = require('express');
const dotenv = require('dotenv');
const path   = require('path');

dotenv.config({
  path: path.join(__dirname, '../.env')
});
const app = express();
const cookieParser = require('cookie-parser');
const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
// Serve static files from the public folder
app.use(express.static(path.join(__dirname, '../public')));
// handling Frontend
app.set('view engine','ejs');
app.set("views", path.resolve('./views'));
app.use(authMiddleware);
app.use('/auth', authRoutes);
app.get('/logout', (req, res) => res.redirect('/auth/logout'));
// Handling Login and signup
app.get('/user/login', (req, res) => {
  if (req.user) return res.redirect('/problems');
  return res.render('login', {
    firebaseConfig: {
      apiKey:            process.env.FIREBASE_API_KEY,
      authDomain:        process.env.FIREBASE_AUTH_DOMAIN,
      projectId:         process.env.FIREBASE_PROJECT_ID,
      storageBucket:     process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId:             process.env.FIREBASE_APP_ID,
    }
  });
});

app.get('/problems', (req, res) => {
    res.render('problems');
});

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/editor', (req, res) => {
    res.render('editor',{user:null,
        problem:null});
});

module.exports = app;