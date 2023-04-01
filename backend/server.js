// server.js
const express = require('express');
const cors = require('cors');
const apiRouter = require('./api');
const syncRouter = require('./sync');
const statsRouter = require('./stats');
const ActivityMonitor=require('./watchdog/ActivityMonitor');
const db = require("./db");



const app = express();
const PORT = process.env.PORT || 3003;
const LISTEN_IP = '127.0.0.1';

app.use(express.json()); // middleware to parse JSON request bodies
app.use(cors());

app.use('/api', apiRouter); // mount the API router at /api
app.use('/sync', syncRouter); // mount the API router at /sync
app.use('/stats', statsRouter); // mount the API router at /stats

app.listen(PORT, async  () => {
  console.log(`Server listening on http://${LISTEN_IP}:${PORT}`);
  try{
    await db.initDB();
    ActivityMonitor.ActivityMonitor(1000);
  }catch(error)
  {
      console.log(error);
  }

});
