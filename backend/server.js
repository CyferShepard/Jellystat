const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken'); 

const authRouter= require('./auth');
const apiRouter = require('./api');
const syncRouter = require('./sync');
const statsRouter = require('./stats');
const ActivityMonitor = require('./watchdog/ActivityMonitor');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3003;
const LISTEN_IP = '127.0.0.1';
const JWT_SECRET = process.env.JWT_SECRET;

if (JWT_SECRET === undefined) {
  console.log('JWT Secret cannot be undefined');
  process.exit(1); // end the program with error status code
}

app.use(express.json()); // middleware to parse JSON request bodies
app.use(cors());



// JWT middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
}

app.use('/auth', authRouter); // mount the API router at /api, with JWT middleware
app.use('/api', verifyToken, apiRouter); // mount the API router at /api, with JWT middleware
app.use('/sync', verifyToken, syncRouter); // mount the API router at /sync, with JWT middleware
app.use('/stats', verifyToken, statsRouter); // mount the API router at /stats, with JWT middleware

app.listen(PORT, async () => {
  console.log(`Server listening on http://${LISTEN_IP}:${PORT}`);
  try {
    await db.initDB();
    ActivityMonitor.ActivityMonitor(1000);
  } catch (error) {
    console.log(error);
  }
});
