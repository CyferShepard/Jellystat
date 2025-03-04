const express = require("express");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const multer = require("multer");

const Logging = require("../classes/logging");
const triggertype = require("../logging/triggertype");
const taskstate = require("../logging/taskstate");
const taskName = require("../logging/taskName");
const sanitizeFilename = require("../utils/sanitizer");

const { sendUpdate } = require("../ws");

const router = express.Router();
const TaskManager = require("../classes/task-manager-singleton");
const TaskScheduler = require("../classes/task-scheduler-singleton");

// Database connection parameters
const postgresUser = process.env.POSTGRES_USER;
const postgresPassword = process.env.POSTGRES_PASSWORD;
const postgresIp = process.env.POSTGRES_IP;
const postgresPort = process.env.POSTGRES_PORT;
const postgresDatabase = process.env.POSTGRES_DB || "jfstat";
const backupfolder = "backup-data";

// Restore function

function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      const json = JSON.parse(data);
      resolve(json);
    });
  });
}

async function restore(file, refLog) {
  refLog.logData.push({ color: "lawngreen", Message: "Starting Restore" });
  refLog.logData.push({
    color: "yellow",
    Message: "Restoring from Backup: " + file,
  });
  const pool = new Pool({
    user: postgresUser,
    password: postgresPassword,
    host: postgresIp,
    port: postgresPort,
    database: postgresDatabase,
  });

  const backupPath = file;

  let jsonData;

  try {
    // Use await to wait for the Promise to resolve
    jsonData = await readFile(backupPath);
  } catch (err) {
    refLog.logData.push({
      color: "red",
      key: tableName,
      Message: `Failed to read backup file`,
    });
    Logging.updateLog(refLog.uuid, refLog.logData, taskstate.FAILED);
    console.error(err);
  }

  // console.log(jsonData);
  if (!jsonData) {
    console.log("No Data");
    return;
  }

  for (let table of jsonData) {
    const data = Object.values(table)[0];
    const tableName = Object.keys(table)[0];
    refLog.logData.push({
      color: "dodgerblue",
      key: tableName,
      Message: `Restoring ${tableName}`,
    });
    for (let index in data) {
      const keysWithQuotes = Object.keys(data[index]).map((key) => `"${key}"`);
      const keyString = keysWithQuotes.join(", ");

      const valuesWithQuotes = Object.values(data[index]).map((col) => {
        if (col === null) {
          return "NULL";
        } else if (typeof col === "string") {
          return `'${col.replace(/'/g, "''")}'`;
        } else if (typeof col === "object") {
          return `'${JSON.stringify(col).replace(/'/g, "''")}'`;
        } else {
          return `'${col}'`;
        }
      });

      const valueString = valuesWithQuotes.join(", ");

      const query = `INSERT INTO ${tableName} (${keyString}) VALUES(${valueString})  ON CONFLICT DO NOTHING`;
      const { rows } = await pool.query(query);
    }
  }
  await pool.end();
  refLog.logData.push({ color: "lawngreen", Message: "Restore Complete" });
}

// Route handler for backup endpoint
router.get("/beginBackup", async (req, res) => {
  try {
    const taskManager = new TaskManager().getInstance();
    const taskScheduler = new TaskScheduler().getInstance();
    const success = taskManager.addTask({
      task: taskManager.taskList.Backup,
      onComplete: async () => {
        console.log("Backup completed successfully");
        await taskScheduler.getTaskHistory();
        res.send("Backup completed successfully");
      },
      onError: (error) => {
        console.error(error);
        res.status(500).send("Backup failed");
        sendUpdate("BackupTask", { type: "Error", message: "Error: Backup failed" });
      },
    });
    if (!success) {
      res.status(500).send("Backup already running");
      sendUpdate("BackupTask", { type: "Error", message: "Backup is already running" });
      return;
    }

    taskManager.startTask(taskManager.taskList.Backup, triggertype.Manual);
  } catch (error) {
    console.error(error);
    res.status(500).send("Backup failed");
  }
});

router.get("/restore/:filename", async (req, res) => {
  try {
    const uuid = randomUUID();
    let refLog = { logData: [], uuid: uuid };
    Logging.insertLog(uuid, triggertype.Manual, taskName.restore);

    const filename = sanitizeFilename(req.params.filename);
    const filePath = path.join(__dirname, "..", backupfolder, filename);

    await restore(filePath, refLog);
    Logging.updateLog(uuid, refLog.logData, taskstate.SUCCESS);

    res.send("Restore completed successfully");
    sendUpdate("TaskComplete", { message: "Restore completed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Restore failed");
  }
});

router.get("/files", (req, res) => {
  try {
    const directoryPath = path.join(__dirname, "..", backupfolder);
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        res.status(500).send("Unable to read directory");
      } else {
        const fileData = files
          .filter((file) => file.endsWith(".json"))
          .map((file) => {
            const filePath = path.join(directoryPath, file);
            const stats = fs.statSync(filePath);
            return {
              name: file,
              size: stats.size,
              datecreated: stats.birthtime,
            };
          });
        res.json(fileData);
      }
    });
  } catch (error) {
    console.log(error);
  }
});

//download backup file
router.get("/files/:filename", (req, res) => {
  const filename = sanitizeFilename(req.params.filename);
  const filePath = path.join(__dirname, "..", backupfolder, filename);
  res.download(filePath);
});

//delete backup
router.delete("/files/:filename", (req, res) => {
  try {
    const filename = sanitizeFilename(req.params.filename);
    const filePath = path.join(__dirname, "..", backupfolder, filename);

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("An error occurred while deleting the file.");
        return;
      }

      console.log(`${filePath} has been deleted.`);
      res.status(200).send(`${filePath} has been deleted.`);
    });
  } catch (error) {
    res.status(500).send("An error occurred while deleting the file.");
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", backupfolder)); // Set the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Set the file name
  },
});

const upload = multer({ storage: storage });

router.post("/upload", upload.single("file"), (req, res) => {
  // Handle the uploaded file here
  res.json({
    fileName: req.file.originalname,
    filePath: req.file.path,
  });
});

// Handle other routes
router.use((req, res) => {
  res.status(404).send({ error: "Not Found" });
});

module.exports = router;
