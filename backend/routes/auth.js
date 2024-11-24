const express = require("express");
const CryptoJS = require("crypto-js");
const db = require("../db");
const jwt = require("jsonwebtoken");
const configClass = require("../classes/config");
const packageJson = require("../../package.json");
const API = require("../classes/api-loader");

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

    if (config.state != null && config.state < 2) {
      const user = { id: 1, username: username };

      let query = 'INSERT INTO app_config ("ID","APP_USER","APP_PASSWORD") VALUES (1,$1,$2)';
      if (config.state > 0) {
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

router.post("/configSetup", async (req, res) => {
  try {
    const { JF_HOST, JF_API_KEY } = req.body;
    const config = await new configClass().getConfig();

    if (JF_HOST === undefined && JF_API_KEY === undefined) {
      res.status(400);
      res.send("JF_HOST and JF_API_KEY are required for configuration");
      return;
    }

    var url = JF_HOST;

    const validation = await API.validateSettings(url, JF_API_KEY);
    if (validation.isValid === false) {
      res.status(validation.status);
      res.send(validation);
      return;
    }

    const { rows: getConfig } = await db.query('SELECT * FROM app_config where "ID"=1');

    if (config.state != null && config.state < 2) {
      let query = 'UPDATE app_config SET "JF_HOST"=$1, "JF_API_KEY"=$2 where "ID"=1';
      if (getConfig.length === 0) {
        query = 'INSERT INTO app_config ("ID","JF_HOST","JF_API_KEY","APP_USER","APP_PASSWORD") VALUES (1,$1,$2,null,null)';
      }

      const { rows } = await db.query(query, [validation.cleanedUrl, JF_API_KEY]);

      const systemInfo = await API.systemInfo();

      if (systemInfo && systemInfo != {}) {
        const settingsjson = await db.query('SELECT settings FROM app_config where "ID"=1').then((res) => res.rows);

        if (settingsjson.length > 0) {
          const settings = settingsjson[0].settings || {};

          settings.Tasks = systemInfo?.Id || null;

          let query = 'UPDATE app_config SET settings=$1 where "ID"=1';

          await db.query(query, [settings]);
        }
      }
      res.send(rows);
    } else {
      res.sendStatus(500);
    }
  } catch (error) {
    console.log(error);
  }
});

// Handle other routes
router.use((req, res) => {
  res.status(404).send({ error: "Not Found" });
});

module.exports = router;
