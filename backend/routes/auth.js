const express = require("express");
const CryptoJS = require("crypto-js");
const db = require("../db");
const jwt = require("jsonwebtoken");
const configClass = require("../classes/config");
const packageJson = require("../../package.json");

const JWT_SECRET = process.env.JWT_SECRET;
const JS_USER = process.env.JS_USER;
const JS_PASSWORD = process.env.JS_PASSWORD;
if (JWT_SECRET === undefined) {
  console.log("JWT Secret cannot be undefined");
  process.exit(1); // end the program with error status code
}

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const query = 'SELECT * FROM app_config WHERE ("APP_USER" = $1 AND "APP_PASSWORD" = $2) OR "REQUIRE_LOGIN" = false';
    const values = [username, password];
    const { rows: login } = await db.query(query, values);

    if (login.length > 0 || (username === JS_USER && password === CryptoJS.SHA3(JS_PASSWORD).toString())) {
      const user = { id: 1, username: username };

      jwt.sign({ user }, JWT_SECRET, (err, token) => {
        if (err) {
          console.log(err);
          res.sendStatus(500);
        } else {
          res.json({ token });
        }
      });
    } else {
      res.sendStatus(401);
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/isConfigured", async (req, res) => {
  try {
    const config = await new configClass().getConfig();
    res.json({ state: config.state, version: packageJson.version });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

router.post("/createuser", async (req, res) => {
  try {
    const { username, password } = req.body;
    const config = await new configClass().getConfig();

    if (config.state < 2) {
      const user = { id: 1, username: username };

      const hasConfig = await new configClass().getConfig();

      let query = 'INSERT INTO app_config ("ID","APP_USER","APP_PASSWORD") VALUES (1,$1,$2)';
      if (!hasConfig.error) {
        query = 'UPDATE app_config SET  "APP_USER"=$1, "APP_PASSWORD"=$2';
      }

      await db.query(query, [username, password]);

      jwt.sign({ user }, JWT_SECRET, (err, token) => {
        if (err) {
          console.log(err);
          res.sendStatus(500);
        } else {
          res.json({ token });
        }
      });
    } else {
      res.sendStatus(403);
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
