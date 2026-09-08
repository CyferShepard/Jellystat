const express = require("express");
const { Pool } = require("pg");
const fs = require("fs");
const readline = require("readline");
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
const { tables } = require("../global/backup_tables");

// Database connection parameters
const postgresUser = process.env.POSTGRES_USER;
const postgresPassword = process.env.POSTGRES_PASSWORD;
const postgresIp = process.env.POSTGRES_IP;
const postgresPort = process.env.POSTGRES_PORT;
const postgresDatabase = process.env.POSTGRES_DB || "jfstat";
const postgresSslRejectUnauthorized =
  process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED === undefined ? true : process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED === "true";

const backupfolder = "backup-data";

// table mappers
const jf_libraries = require("../models/jf_libraries");
const jf_library_items = require("../models/jf_library_items");
const jf_library_seasons = require("../models/jf_library_seasons");
const jf_library_episodes = require("../models/jf_library_episodes");
const jf_users = require("../models/jf_users");
const jf_playback_activity = require("../models/jf_playback_activity");
const jf_playback_reporting_plugin_data = require("../models/jf_playback_reporting_plugin_data");
const jf_item_info = require("../models/jf_item_info");
//
const db = require("../db");
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

function getBirthtimeFallback(fileStats, fileName) {
  // Try to get birthtime metadata
  if (fileStats.birthtime && fileStats.birthtime.getTime() > 0) {
    return fileStats.birthtime;
  }

  // Fallback to changetime
  if (fileStats.ctime && fileStats.ctime.getTime() > 0) {
    return fileStats.ctime;
  }

  // Fallback to modified time
  if (fileStats.mtime && fileStats.mtime.getTime() > 0) {
    return fileStats.mtime;
  }

  // Fallback to filename parsing
  // format is 4digits-2digis-2digits(' ' or '_' or 'T')
  // 2digits('-' or ':')2digits('-' or ':')2digits
  const regexp = /(\d{4})-(\d{2})-(\d{2})[ _T](\d{2})[-:](\d{2})[-:](\d{2})/;
  const matches = fileName.match(regexp);
  if (!matches) return null;

  // Verify that each regex match is a valid number
  for (var i = 1; i < 7; i++) {
    if (Number.isNaN(Number(matches[i]))) return null;
  }

  return new Date(matches[1], matches[2] - 1, matches[3], matches[4], matches[5], matches[6]);
}

function getTableColumns(tableName) {
  switch (tableName) {
    case "jf_libraries":
      return jf_libraries.jf_libraries_columns;
    case "jf_library_items":
      return jf_library_items.jf_library_items_columns;
    case "jf_library_seasons":
      return jf_library_seasons.jf_library_seasons_columns;
    case "jf_library_episodes":
      return jf_library_episodes.jf_library_episodes_columns;
    case "jf_users":
      return jf_users.jf_users_columns;
    case "jf_playback_activity":
      return jf_playback_activity.columnsPlayback;
    case "jf_playback_reporting_plugin_data":
      return jf_playback_reporting_plugin_data.columnsPlaybackReporting;
    case "jf_item_info":
      return jf_item_info.jf_item_info_columns;
    default:
      return null;
  }
}

//fixes Bulk insert error: error: column "Genres" is of type jsonb but expression is of type text[]
function formatData(data) {
  if (!Array.isArray(data)) return data;
  return data.map((row) => {
    const formatted = {};
    for (const [key, value] of Object.entries(row)) {
      formatted[key] = Array.isArray(value) ? JSON.stringify(value) : value;
    }
    return formatted;
  });
}

async function restore(file, refLog) {
  refLog.logData.push({ color: "lawngreen", Message: "Starting Restore" });
  refLog.logData.push({
    color: "yellow",
    Message: "Restoring from Backup: " + file,
  });
  const backupPath = file;

  let jsonData;

  try {
    // Use await to wait for the Promise to resolve
    jsonData = await readFile(backupPath);
  } catch (err) {
    refLog.logData.push({
      color: "red",
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
  const allowList = tables.map((table) => table.value);

  // Perform bulk, parameterized inserts per table to improve performance
  for (let table of jsonData) {
    const data = Object.values(table)[0];
    const tableName = Object.keys(table)[0];

    if (!allowList.includes(tableName)) {
      refLog.logData.push({
        color: "red",
        Message: `Table ${tableName} is not allowed to be restored`,
      });
      continue;
    }

    const tableColumns = getTableColumns(tableName);
    if (!tableColumns) {
      refLog.logData.push({
        color: "red",
        Message: `No columns found for table ${tableName}`,
      });
      continue;
    }

    refLog.logData.push({
      color: "dodgerblue",
      key: tableName,
      Message: `Restoring ${tableName}`,
    });

    if (data.length == 0) {
      refLog.logData.push({
        color: "yellow",
        key: tableName,
        Message: `No data to restore for ${tableName}`,
      });
      continue;
    }
    let result = await db.insertBulk(tableName, formatData(data), tableColumns);

    if (result.Result === "SUCCESS") {
      refLog.logData.push({
        color: "lawngreen",
        key: tableName,
        Message: `Restored ${data.length} rows to ${tableName}`,
      });
    } else {
      refLog.logData.push({
        color: "red",
        key: tableName,
        Message: `Failed to restore ${tableName}: ${result.message}`,
      });
    }
  }
  refLog.logData.push({ color: "lawngreen", Message: "Restore Complete" });
}

async function restoreJsonl(file, refLog) {
  const allowList = tables.map((table) => table.value);
  const batchSize = 500;
  const input = fs.createReadStream(file, { encoding: "utf8" });
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  let currentTable = null;
  let currentRows = [];
  let restoredRows = 0;

  const restoreBatch = async (tableName, rows) => {
    if (!tableName || rows.length === 0) return;

    const tableColumns = getTableColumns(tableName);
    const result = await db.insertBulk(tableName, formatData(rows), tableColumns);
    if (result.Result !== "SUCCESS") {
      throw new Error(`Failed to restore ${tableName}: ${result.message}`);
    }

    restoredRows += rows.length;
  };

  const flushRows = async () => {
    await restoreBatch(currentTable, currentRows);
    currentRows = [];
  };

  try {
    for await (const line of lines) {
      if (!line.trim()) continue;

      let record;
      try {
        record = JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSONL record: ${error.message}`);
      }

      if (record.type === "table") {
        if (!allowList.includes(record.table)) {
          throw new Error(`Table ${record.table} is not allowed to be restored`);
        }
        await flushRows();
        currentTable = record.table;
        refLog.logData.push({ color: "dodgerblue", key: currentTable, Message: `Restoring ${currentTable}` });
        continue;
      }

      if (record.type !== "row" || record.table !== currentTable || !record.data || typeof record.data !== "object") {
        throw new Error("Invalid JSONL backup record");
      }

      currentRows.push(record.data);
      if (currentRows.length >= batchSize) {
        await flushRows();
      }
    }

    await flushRows();
    refLog.logData.push({ color: "lawngreen", Message: `${restoredRows} rows restored` });
    refLog.logData.push({ color: "lawngreen", Message: "Restore Complete" });
  } finally {
    input.destroy();
  }
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

    if (filename.endsWith(".jsonl")) {
      await restoreJsonl(filePath, refLog);
    } else {
      await restore(filePath, refLog);
    }
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
          .filter((file) => file.endsWith(".json") || file.endsWith(".jsonl"))
          .map((file) => {
            const filePath = path.join(directoryPath, file);
            const stats = fs.statSync(filePath);
            return {
              name: file,
              size: stats.size,
              datecreated: getBirthtimeFallback(stats, file),
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
