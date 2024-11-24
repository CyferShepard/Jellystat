// core
require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
const express = require("express");
const compression = require("compression");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const knex = require("knex");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

// db
const dbInstance = require("./db");
const createdb = require("./create_database");
const knexConfig = require("./migrations");

// routes
const authRouter = require("./routes/auth");
const apiRouter = require("./routes/api");
const proxyRouter = require("./routes/proxy");
const { router: syncRouter } = require("./routes/sync");
const statsRouter = require("./routes/stats");
const backupRouter = require("./routes/backup");
const logRouter = require("./routes/logging");
const utilsRouter = require("./routes/utils");

// tasks
const ActivityMonitor = require("./tasks/ActivityMonitor");
const tasks = require("./tasks/tasks");

// websocket
const { setupWebSocketServer } = require("./ws");
const writeEnvVariables = require("./classes/env");

process.env.POSTGRES_USER = process.env.POSTGRES_USER ?? "postgres";
process.env.POSTGRES_ROLE =
  process.env.POSTGRES_ROLE ?? process.env.POSTGRES_USER;

const app = express();
const db = knex(knexConfig.development);

const ensureSlashes = (url) => {
  if (!url.startsWith("/")) {
    url = "/" + url;
  }
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return url;
};

const PORT = 3000;
const LISTEN_IP = "0.0.0.0";
const JWT_SECRET = process.env.JWT_SECRET;
const BASE_NAME = process.env.JS_BASE_URL ? ensureSlashes(process.env.JS_BASE_URL) : "";

if (JWT_SECRET === undefined) {
  console.log("JWT Secret cannot be undefined");
  process.exit(1); // end the program with error status code
}

// middlewares
app.use(express.json()); // middleware to parse JSON request bodies
app.use(cors());
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(compression());

function typeInferenceMiddleware(req, res, next) {
  Object.keys(req.query).forEach((key) => {
    const value = req.query[key];
    if (value.toLowerCase() === "true" || value.toLowerCase() === "false") {
      // Convert to boolean
      req.query[key] = value.toLowerCase() === "true";
    } else if (!isNaN(value) && value.trim() !== "") {
      // Convert to number if it's a valid number
      req.query[key] = +value;
    }
  });
  next();
}

app.use(typeInferenceMiddleware);

const findFile = (dir, fileName) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const result = findFile(fullPath, fileName);
      if (result) {
        return result;
      }
    } else if (file === fileName) {
      return fullPath;
    }
  }
  return null;
};

const root = path.join(__dirname, "..", "dist");

//hacky middleware to handle basename changes for UI

app.use((req, res, next) => {
  if (BASE_NAME && BASE_NAME != "" && (req.url == "/" || req.url == "")) {
    return res.redirect(BASE_NAME);
  }
  // Ignore requests containing 'socket.io'
  if (req.url.includes("socket.io") || req.url.includes("swagger")) {
    return next();
  }

  const fileRegex = /\/([^\/]+\.(css|ico|js|json|png))$/;
  const match = req.url.match(fileRegex);
  if (match) {
    // Extract the file name
    const fileName = match[1];

    //Exclude translation.json from this hack as it messes up the translations by returning the first file regardless of language chosen
    if (fileName != "translation.json") {
      // Find the file
      const filePath = findFile(root, fileName);
      if (filePath) {
        return res.sendFile(filePath);
      } else {
        return res.status(404).send("File not found");
      }
    }
  }

  if (BASE_NAME && req.url.startsWith(BASE_NAME) && req.url !== BASE_NAME) {
    req.url = req.url.slice(BASE_NAME.length);
    // console.log("URL: " + req.url);
  }
  next();
});

// initiate routes
app.use(`/auth`, authRouter, () => {
  /*  #swagger.tags = ['Auth'] */
}); // mount the API router at /auth
app.use("/proxy", proxyRouter, () => {
  /*  #swagger.tags = ['Proxy']*/
}); // mount the API router at /proxy
app.use("/api", authenticate, apiRouter, () => {
  /*  #swagger.tags = ['API']*/
}); // mount the API router at /api, with JWT middleware
app.use("/sync", authenticate, syncRouter, () => {
  /*  #swagger.tags = ['Sync']*/
}); // mount the API router at /sync, with JWT middleware
app.use("/stats", authenticate, statsRouter, () => {
  /*  #swagger.tags = ['Stats']*/
}); // mount the API router at /stats, with JWT middleware
app.use("/backup", authenticate, backupRouter, () => {
  /*  #swagger.tags = ['Backup']*/
}); // mount the API router at /backup, with JWT middleware
app.use("/logs", authenticate, logRouter, () => {
  /*  #swagger.tags = ['Logs']*/
}); // mount the API router at /logs, with JWT middleware
app.use("/utils", authenticate, utilsRouter, () => {
  /*  #swagger.tags = ['Utils']*/
}); // mount the API router at /utils, with JWT middleware

// Swagger
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// for deployment of static page
writeEnvVariables().then(() => {
  app.use(express.static(root));
  app.get("*", (req, res, next) => {
    if (req.url.includes("socket.io")) {
      return next();
    }
    res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
  });
});

// JWT middleware
async function authenticate(req, res, next) {
  const token = req.headers.authorization;
  const apiKey = req.headers["x-api-token"] || req.query.apiKey;

  if (!token && !apiKey) {
    return res.status(401).json({
      message: "Authentication failed. No token or API key provided.",
    });
  }

  if (token) {
    const extracted_token = token.split(" ")[1];
    if (!extracted_token || extracted_token === "null") {
      return res.sendStatus(403);
    }

    try {
      const decoded = jwt.verify(extracted_token, JWT_SECRET);
      req.user = decoded.user;
      next();
    } catch (error) {
      console.log("Invalid token");
      return res.status(401).json({ message: "Invalid token" });
    }
  } else {
    if (apiKey) {
      const keysjson = await dbInstance
        .query('SELECT api_keys FROM app_config where "ID"=1')
        .then((res) => res.rows[0].api_keys);

      if (!keysjson || Object.keys(keysjson).length === 0) {
        return res.status(404).json({ message: "No API keys configured" });
      }
      const keys = keysjson || [];

      const keyExists = keys.some((obj) => obj.key === apiKey);

      if (keyExists) {
        next();
      } else {
        return res.status(403).json({ message: "Invalid API key" });
      }
    }
  }
}

// start server
try {
  createdb.createDatabase().then((result) => {
    if (result) {
      console.log("[JELLYSTAT] Database created");
    } else {
      console.log("[JELLYSTAT] Database exists. Skipping creation");
    }

    db.migrate.latest().then(() => {
      const server = http.createServer(app);

      setupWebSocketServer(server, BASE_NAME);
      server.listen(PORT, LISTEN_IP, async () => {
        console.log(`[JELLYSTAT] Server listening on http://127.0.0.1:${PORT}`);
        ActivityMonitor.ActivityMonitor(1000);
        tasks.FullSyncTask();
        tasks.RecentlyAddedItemsSyncTask();
        tasks.BackupTask();
      });
    });
  });
} catch (error) {
  console.log("[JELLYSTAT] An error has occured on startup: " + error);
}
