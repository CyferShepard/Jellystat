// server.js
const express = require('express');
const cors = require('cors');
const apiRouter = require('./api');

const app = express();
const PORT = process.env.PORT || 3003;
const LISTEN_IP = '127.0.0.1';

app.use(express.json()); // middleware to parse JSON request bodies
app.use(cors());
app.use('/api', apiRouter); // mount the API router at /api

app.listen(PORT,  () => {
  console.log(`Server listening on http://${LISTEN_IP}:${PORT}`);
});
