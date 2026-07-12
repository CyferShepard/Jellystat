const express = require("express");
const CryptoJS = require("crypto-js");
const db = require("../db");
const jwt = require("jsonwebtoken");
const configClass = require("../classes/config");
const packageJson = require("../../package.json");
const API = require("../classes/api-loader");
const { axios } = require("../classes/axios");

const JWT_SECRET = process.env.JWT_SECRET;
const JS_USER = process.env.JS_USER;
const JS_PASSWORD = process.env.JS_PASSWORD;
if (JWT_SECRET === undefined) {
  console.log("JWT Secret cannot be undefined");
  process.exit(1); // end the program with error status code
}

const router = express.Router();

function createJellystatToken(user, res) {
  jwt.sign({ user }, JWT_SECRET, (err, token) => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
    } else {
      res.json({ token });
    }
  });
}

function jellyfinAuthorizationHeader() {
  return `MediaBrowser Client="Jellystat", Device="Jellystat Web", DeviceId="jellystat-web", Version="${packageJson.version}"`;
}

function jellyfinQuickConnectUrl(jellyfinHost) {
  return `${jellyfinHost.replace(/\/$/, "")}/web/index.html#!/quickconnect.html`;
}

async function getConfiguredJellyfinHost(res) {
  const config = await new configClass().getConfig();

  if (config.state !== 2 || !config.JF_HOST) {
    res.sendStatus(400);
    return null;
  }

  return config.JF_HOST;
}

function createJellyfinUserToken(authenticationResult, res) {
  if (!authenticationResult?.User?.Policy?.IsAdministrator) {
    return res.sendStatus(403);
  }

  const user = {
    id: authenticationResult.User.Id,
    username: authenticationResult.User.Name,
    provider: "jellyfin",
  };

  createJellystatToken(user, res);
}

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const query = "SELECT * FROM app_config";
    const { rows: login } = await db.query(query);

    if (
      (!username || !password || password === CryptoJS.SHA3("").toString()) &&
      login.length > 0 &&
      login[0].REQUIRE_LOGIN == true
    ) {
      res.sendStatus(401);
      return;
    }

    const loginUser = login.filter(
      (user) => (user.APP_USER === username && user.APP_PASSWORD === password) || user.REQUIRE_LOGIN == false
    );

    if (loginUser.length > 0 || (username === JS_USER && password === CryptoJS.SHA3(JS_PASSWORD).toString())) {
      const user = { id: 1, username: username };
      createJellystatToken(user, res);
    } else {
      res.sendStatus(401);
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/jellyfinLogin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const jellyfinHost = await getConfiguredJellyfinHost(res);

    if (!jellyfinHost) {
      return;
    }

    if (!username || !password) {
      return res.sendStatus(401);
    }

    const response = await axios.post(
      `${jellyfinHost}/Users/AuthenticateByName`,
      {
        Username: username,
        Pw: password,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Emby-Authorization": jellyfinAuthorizationHeader(),
        },
      }
    );

    createJellyfinUserToken(response.data, res);
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.sendStatus(error.response.status);
    }
    console.log(error);
    res.sendStatus(500);
  }
});

router.get("/jellyfinQuickConnect/enabled", async (req, res) => {
  try {
    const jellyfinHost = await getConfiguredJellyfinHost(res);
    if (!jellyfinHost) {
      return;
    }

    const response = await axios.get(`${jellyfinHost}/QuickConnect/Enabled`, {
      headers: {
        "X-Emby-Authorization": jellyfinAuthorizationHeader(),
      },
    });

    res.json({ enabled: response.data === true });
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.json({ enabled: false });
    }
    console.log(error);
    res.sendStatus(500);
  }
});

router.post("/jellyfinQuickConnect/initiate", async (req, res) => {
  try {
    const jellyfinHost = await getConfiguredJellyfinHost(res);
    if (!jellyfinHost) {
      return;
    }

    const response = await axios.post(`${jellyfinHost}/QuickConnect/Initiate`, null, {
      headers: {
        "X-Emby-Authorization": jellyfinAuthorizationHeader(),
      },
    });

    res.json({
      ...response.data,
      AuthorizeUrl: jellyfinQuickConnectUrl(jellyfinHost),
    });
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.sendStatus(error.response.status);
    }
    console.log(error);
    res.sendStatus(500);
  }
});

router.get("/jellyfinQuickConnect/status", async (req, res) => {
  try {
    const jellyfinHost = await getConfiguredJellyfinHost(res);
    const { secret } = req.query;

    if (!jellyfinHost) {
      return;
    }

    if (!secret) {
      return res.sendStatus(400);
    }

    const response = await axios.get(`${jellyfinHost}/QuickConnect/Connect`, {
      params: { secret },
      headers: {
        "X-Emby-Authorization": jellyfinAuthorizationHeader(),
      },
    });

    res.json(response.data);
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
      return res.sendStatus(error.response.status);
    }
    console.log(error);
    res.sendStatus(500);
  }
});

router.post("/jellyfinQuickConnect/login", async (req, res) => {
  try {
    const jellyfinHost = await getConfiguredJellyfinHost(res);
    const { secret } = req.body;

    if (!jellyfinHost) {
      return;
    }

    if (!secret) {
      return res.sendStatus(400);
    }

    const response = await axios.post(
      `${jellyfinHost}/Users/AuthenticateWithQuickConnect`,
      {
        Secret: secret,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Emby-Authorization": jellyfinAuthorizationHeader(),
        },
      }
    );

    createJellyfinUserToken(response.data, res);
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
      return res.sendStatus(error.response.status);
    }
    console.log(error);
    res.sendStatus(500);
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
      createJellystatToken(user, res);
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
