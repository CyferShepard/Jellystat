const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const moment = require("moment");
const Logging = require("./logging");

const taskstate = require("../logging/taskstate");

// Database connection parameters
const postgresUser = process.env.POSTGRES_USER;
const postgresPassword = process.env.POSTGRES_PASSWORD;
const postgresIp = process.env.POSTGRES_IP;
const postgresPort = process.env.POSTGRES_PORT;
const postgresDatabase = process.env.POSTGRES_DB || "jfstat";
const backupfolder = "backup-data";

// Tables to back up
const tables = [
  "jf_libraries",
  "jf_library_items",
  "jf_library_seasons",
  "jf_library_episodes",
  "jf_users",
  "jf_playback_activity",
  "jf_playback_reporting_plugin_data",
  "jf_item_info",
];

function checkFolderWritePermission(folderPath) {
  try {
    const testFile = `${folderPath}/.writableTest`;
    fs.writeFileSync(testFile, "");
    fs.unlinkSync(testFile);
    return true;
  } catch (error) {
    return false;
  }
}
// Backup function
async function backup(refLog) {
  refLog.logData.push({ color: "lawngreen", Message: "Starting Backup" });
  const pool = new Pool({
    user: postgresUser,
    password: postgresPassword,
    host: postgresIp,
    port: postgresPort,
    database: postgresDatabase,
  });

  // Get data from each table and append it to the backup file

  try {
    let now = moment();
    const backuppath = "./" + backupfolder;

    if (!fs.existsSync(backuppath)) {
      fs.mkdirSync(backuppath);
      console.log("Directory created successfully!");
    }
    if (!checkFolderWritePermission(backuppath)) {
      console.error("No write permissions for the folder:", backuppath);
      refLog.logData.push({ color: "red", Message: "Backup Failed: No write permissions for the folder: " + backuppath });
      refLog.logData.push({ color: "red", Message: "Backup Failed with errors" });
      Logging.updateLog(refLog.uuid, refLog.loggedData, taskstate.FAILED);
      await pool.end();
      return;
    }

    // const backupPath = `../backup-data/backup_${now.format('yyyy-MM-DD HH-mm-ss')}.json`;
    const directoryPath = path.join(__dirname, "..", backupfolder, `backup_${now.format("yyyy-MM-DD HH-mm-ss")}.json`);

    const stream = fs.createWriteStream(directoryPath, { flags: "a" });
    stream.on("error", (error) => {
      refLog.logData.push({ color: "red", Message: "Backup Failed: " + error });
      Logging.updateLog(refLog.uuid, refLog.loggedData, taskstate.FAILED);
      return;
    });
    const backup_data = [];

    refLog.logData.push({ color: "yellow", Message: "Begin Backup " + directoryPath });
    for (let table of tables) {
      const query = `SELECT * FROM ${table}`;

      const { rows } = await pool.query(query);
      refLog.logData.push({ color: "dodgerblue", Message: `Saving ${rows.length} rows for table ${table}` });

      backup_data.push({ [table]: rows });
    }

    await stream.write(JSON.stringify(backup_data));
    stream.end();
    refLog.logData.push({ color: "lawngreen", Message: "Backup Complete" });
    refLog.logData.push({ color: "dodgerblue", Message: "Removing old backups" });

    //Cleanup excess backups
    let deleteCount = 0;
    const directoryPathDelete = path.join(__dirname, "..", backupfolder);

    const files = await new Promise((resolve, reject) => {
      fs.readdir(directoryPathDelete, (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files);
        }
      });
    });

    let fileData = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const filePath = path.join(directoryPathDelete, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          datecreated: stats.birthtime,
        };
      });

    fileData = fileData.sort((a, b) => new Date(b.datecreated) - new Date(a.datecreated)).slice(5);

    for (var oldBackup of fileData) {
      const oldBackupFile = path.join(__dirname, "..", backupfolder, oldBackup.name);

      await new Promise((resolve, reject) => {
        fs.unlink(oldBackupFile, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      deleteCount += 1;
      refLog.logData.push({ color: "yellow", Message: `${oldBackupFile} has been deleted.` });
    }

    refLog.logData.push({ color: "lawngreen", Message: deleteCount + " backups removed." });
  } catch (error) {
    console.log(error);
    refLog.logData.push({ color: "red", Message: "Backup Failed: " + error });
    Logging.updateLog(refLog.uuid, refLog.loggedData, taskstate.FAILED);
  }

  await pool.end();
}

module.exports = backup;