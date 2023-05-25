const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken'); 
const knex = require('knex');
const createdb = require('./create_database');
const knexConfig = require('./migrations');

const authRouter= require('./auth');
const apiRouter = require('./api');
const proxyRouter = require('./proxy');
const {router: syncRouter} = require('./sync');
const statsRouter = require('./stats');
const {router: backupRouter}  = require('./backup');
const ActivityMonitor = require('./tasks/ActivityMonitor');
const SyncTask = require('./tasks/SyncTask');
const BackupTask = require('./tasks/BackupTask');
const {router: logRouter} = require('./logging');



const app = express();
const db = knex(knexConfig.development);

const PORT = process.env.PORT || 3003;
const LISTEN_IP = '127.0.0.1';
const JWT_SECRET = process.env.JWT_SECRET ||'my-secret-jwt-key';

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
app.use('/proxy', proxyRouter); // mount the API router at /api, with JWT middleware
app.use('/sync', verifyToken, syncRouter); // mount the API router at /sync, with JWT middleware
app.use('/stats', verifyToken, statsRouter); // mount the API router at /stats, with JWT middleware
app.use('/data', verifyToken, backupRouter); // mount the API router at /stats, with JWT middleware
app.use('/logs', verifyToken, logRouter); // mount the API router at /stats, with JWT middleware

try{
  createdb.createDatabase().then((result) => {
    if (result) {
        console.log('Database created');
    }
  
    db.migrate.latest().then(() => {
      app.listen(PORT, async () => {
        console.log(`Server listening on http://${LISTEN_IP}:${PORT}`);

        ActivityMonitor.ActivityMonitor(1000);
        SyncTask.SyncTask(60000*10);
        BackupTask.BackupTask(60000*60*24);
      });
    });
  });
  

}catch(error)
{
  console.log('An error has occured on startup: '+error);
}

