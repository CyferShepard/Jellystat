const express = require("express");
const CryptoJS  = require('crypto-js');
const db = require("../db");
const jwt = require('jsonwebtoken');
const configClass = require("../classes/config");

const JWT_SECRET = process.env.JWT_SECRET;
const JS_USER=process.env.JS_USER;
const JS_PASSWORD = process.env.JS_PASSWORD;
if (JWT_SECRET === undefined) {
  console.log('JWT Secret cannot be undefined');
  process.exit(1); // end the program with error status code
}

const router = express.Router();

async function getConfigState()
{
  let state=0;
  try{
    const { rows : Configured } = await db.query(`SELECT * FROM app_config`);

    //state 0 = not configured
    //state 1 = configured and user set
    //state 2 = configured and user and api key set

    if(Configured.length>0)
    {
      if(Configured[0].APP_USER===null)//safety check if user is null still return state 0
      {
        return state;
      }

      if(Configured[0].APP_USER!==null && Configured[0].JF_API_KEY===null) //check if user is configured but API is not configured then return state 1
      {
        state=1;
        return state; 
      }
      

      if(Configured[0].APP_USER!==null && Configured[0].JF_API_KEY!==null) //check if user is configured and API is configured then return state 2
      {

        state=2
        return state;
      }
    }else{
      return state;
    }
 
  }catch(error)
  {
    return state;
  }
}


router.post('/login', async (req, res) => {
    try{
      const { username, password } = req.body;
        
      const query = 'SELECT * FROM app_config WHERE ("APP_USER" = $1 AND "APP_PASSWORD" = $2) OR "REQUIRE_LOGIN" = false';
      const values = [username, password];
      const { rows: login } = await db.query(query, values);


      if(login.length>0 || (username===JS_USER && password===CryptoJS.SHA3(JS_PASSWORD).toString()))
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

    const state=await getConfigState();
    res.json({ state:state }); 
    
    
  });

  router.post('/createuser', async (req, res) => {
  
  
    try{
      const { username, password } = req.body;
      const configState=await getConfigState();
  
      if(configState<2)
      {
        const user = { id: 1, username: username };

        const hasConfig=await new configClass().getConfig();
        
        let query='INSERT INTO app_config ("APP_USER","APP_PASSWORD") VALUES ($1,$2)';
        if(!hasConfig.error)
        {
            query='UPDATE app_config SET  "APP_USER"=$1, "APP_PASSWORD"=$2';
        }

        console.log(query);
      
        await db.query(
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