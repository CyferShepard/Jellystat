const express = require("express");
const db = require("./db");
const jwt = require('jsonwebtoken');


const JWT_SECRET = process.env.JWT_SECRET ||'my-secret-jwt-key';

const router = express.Router();


router.post('/login', async (req, res) => {
  
    try{
      const { username, password } = req.body;
        
      const { rows : login } = await db.query(`SELECT * FROM app_config where ("APP_USER"='${username}' and "APP_PASSWORD"='${password}') OR "REQUIRE_LOGIN"=false`);
  
      if(login.length>0)
      {
        const user = { id: 1, username: username };
  
          jwt.sign({ user }, JWT_SECRET, (err, token) => {
            if (err) {
              console.log(err);
              res.sendStatus(500);
            } else {
              res.json({ token }); 
            }
          });
      }else{
        res.sendStatus(401);
      }
   
    }catch(error)
    {
      console.log(error);
    }
  });
  
  router.get('/isConfigured', async (req, res) => {
    
    try{
      const { rows : Configured } = await db.query(`SELECT * FROM app_config`);
  
      if(Configured.length>0)
      {
        res.sendStatus(200);
      }else{
        res.sendStatus(204);
      }
   
    }catch(error)
    {
      console.log(error);
    }
  });
  
  
  router.post('/createuser', async (req, res) => {
  
  
    try{
      const { username, password } = req.body;
      const { rows : Configured } = await db.query(`SELECT * FROM app_config where "ID"=1`);
  
      if(Configured.length===0)
      {
        const user = { id: 1, username: username };
  
        let query='INSERT INTO app_config ("JF_HOST","JF_API_KEY","APP_USER","APP_PASSWORD") VALUES (null,null,$1,$2)';
        console.log(query);
      
        const { rows } = await db.query(
          query,
          [username, password]
        );
  
          jwt.sign({ user }, JWT_SECRET, (err, token) => {
            if (err) {
              console.log(err);
              res.sendStatus(500);
            } else {
              res.json({ token }); 
            }
          });
      }else{
        res.sendStatus(403);
      }
   
    }catch(error)
    {
      console.log(error);
    }
  
  
  
   
  });

module.exports = router;