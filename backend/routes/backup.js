const express = require("express");
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { randomUUID }  = require('crypto');
const multer = require('multer');


const Logging =require('./logging');
const triggertype = require('../logging/triggertype');
const taskstate = require('../logging/taskstate');
const taskName = require('../logging/taskName');

const { sendUpdate } = require('../ws');
const db = require("../db");

const router = express.Router();

// Database connection parameters
const postgresUser = process.env.POSTGRES_USER;
const postgresPassword = process.env.POSTGRES_PASSWORD;
const postgresIp = process.env.POSTGRES_IP;
const postgresPort = process.env.POSTGRES_PORT;
const postgresDatabase = process.env.POSTGRES_DATABASE || 'jfstat';
const backupfolder='backup-data';

// Tables to back up
const tables = ['jf_libraries', 'jf_library_items', 'jf_library_seasons','jf_library_episodes','jf_users','jf_playback_activity','jf_playback_reporting_plugin_data','jf_item_info'];

function checkFolderWritePermission(folderPath) {
  try {
    const testFile = `${folderPath}/.writableTest`;
    fs.writeFileSync(testFile, '');
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
    database: postgresDatabase
  });

  // Get data from each table and append it to the backup file


  try{

  let now = moment();
  const backuppath='./'+backupfolder;

  if (!fs.existsSync(backuppath)) {
    fs.mkdirSync(backuppath);
    console.log('Directory created successfully!');
  }
  if (!checkFolderWritePermission(backuppath)) {
    console.error('No write permissions for the folder:', backuppath);
    refLog.logData.push({ color: "red", Message: "Backup Failed: No write permissions for the folder: "+backuppath });
    refLog.logData.push({ color: "red", Message: "Backup Failed with errors"});
    Logging.updateLog(refLog.uuid,refLog.loggedData,taskstate.FAILED);
    await pool.end();
    return;

  }


  // const backupPath = `../backup-data/backup_${now.format('yyyy-MM-DD HH-mm-ss')}.json`;
  const directoryPath = path.join(__dirname, '..', backupfolder,`backup_${now.format('yyyy-MM-DD HH-mm-ss')}.json`);

  const stream = fs.createWriteStream(directoryPath, { flags: 'a' });
  stream.on('error', (error) => {
    refLog.logData.push({ color: "red", Message: "Backup Failed: "+error });
    Logging.updateLog(refLog.uuid,refLog.loggedData,taskstate.FAILED);
    return;
  });
  const backup_data=[];

  refLog.logData.push({ color: "yellow", Message: "Begin Backup "+directoryPath });
  for (let table of tables) {
    const query = `SELECT * FROM ${table}`;

    const { rows } = await pool.query(query);
    refLog.logData.push({color: "dodgerblue",Message: `Saving ${rows.length} rows for table ${table}`});

    backup_data.push({[table]:rows});

  }


    await stream.write(JSON.stringify(backup_data));
    stream.end();
    refLog.logData.push({ color: "lawngreen", Message: "Backup Complete" });
    refLog.logData.push({ color: "dodgerblue", Message: "Removing old backups" });

     //Cleanup excess backups
  let deleteCount=0;
  const directoryPathDelete = path.join(__dirname, '..', backupfolder);

  const files = await new Promise((resolve, reject) => {
    fs.readdir(directoryPathDelete, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });

  let fileData = files.filter(file => file.endsWith('.json'))
    .map(file => {
      const filePath = path.join(directoryPathDelete, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        datecreated: stats.birthtime
      };
    });

  fileData = fileData.sort((a, b) => new Date(b.datecreated) - new Date(a.datecreated)).slice(5);

  for (var oldBackup of fileData) {
    const oldBackupFile = path.join(__dirname, '..', backupfolder, oldBackup.name);

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

  refLog.logData.push({ color: "lawngreen", Message: deleteCount+" backups removed." });

  }catch(error)
  {
    console.log(error);
    refLog.logData.push({ color: "red", Message: "Backup Failed: "+error });
    Logging.updateLog(refLog.uuid,refLog.loggedData,taskstate.FAILED);
  }


  await pool.end();


}

// Restore function


function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      const json = JSON.parse(data);
      resolve(json);
    });
  });
}

async function restore(file,refLog) {

  refLog.logData.push({ color: "lawngreen", Message: "Starting Restore" });
  refLog.logData.push({ color: "yellow", Message: "Restoring from Backup: "+file });
  const pool = new Pool({
    user: postgresUser,
    password: postgresPassword,
    host: postgresIp,
    port: postgresPort,
    database: postgresDatabase
  });

    const backupPath = file;

    let jsonData;

    try {
      // Use await to wait for the Promise to resolve
      jsonData = await readFile(backupPath);

    } catch (err) {
      refLog.logData.push({ color: "red",key:tableName ,Message: `Failed to read backup file`});
      Logging.updateLog(refLog.uuid,refLog.logData,taskstate.FAILED);
      console.error(err);
    }

    // console.log(jsonData);
    if(!jsonData)
    {
      console.log('No Data');
      return;
    }

    for(let table of jsonData)
    {
      const data = Object.values(table)[0];
      const tableName=Object.keys(table)[0];
      refLog.logData.push({ color: "dodgerblue",key:tableName ,Message: `Restoring ${tableName}`});
      for(let index in data)
      {
        const keysWithQuotes = Object.keys(data[index]).map(key => `"${key}"`);
        const keyString = keysWithQuotes.join(", ");

        const valuesWithQuotes = Object.values(data[index]).map(col => {
          if (col === null) {
            return 'NULL';
          } else if (typeof col === 'string') {
            return `'${col.replace(/'/g, "''")}'`;
          }else if (typeof col === 'object') {
            return `'${JSON.stringify(col).replace(/'/g, "''")}'`;
          }  else {
            return `'${col}'`;
          }
        });

        const valueString = valuesWithQuotes.join(", ");


        const query=`INSERT INTO ${tableName} (${keyString}) VALUES(${valueString})  ON CONFLICT DO NOTHING`;
        const { rows } = await pool.query( query );


      }


    }
    await pool.end();
    refLog.logData.push({ color: "lawngreen", Message: "Restore Complete" });

  }

// Route handler for backup endpoint
router.get('/beginBackup', async (req, res) => {
  try {
    const last_execution=await db.query( `SELECT "Result"
    FROM public.jf_logging
    WHERE "Name"='${taskName.backup}'
    ORDER BY "TimeRun" DESC
    LIMIT 1`).then((res) => res.rows);

    if(last_execution.length!==0)
    {

      if(last_execution[0].Result ===taskstate.RUNNING)
      {
      sendUpdate("TaskError","Error: Backup is already running");
      res.send();
      return;
      }
    }


    const uuid = randomUUID();
    let refLog={logData:[],uuid:uuid};
    Logging.insertLog(uuid,triggertype.Manual,taskName.backup);
    await backup(refLog);
    Logging.updateLog(uuid,refLog.logData,taskstate.SUCCESS);
    res.send('Backup completed successfully');
    sendUpdate("TaskComplete",{message:triggertype+" Backup Completed"});
  } catch (error) {
    console.error(error);
    res.status(500).send('Backup failed');
  }
});

router.get('/restore/:filename', async (req, res) => {

    try {
      const uuid = randomUUID();
      let refLog={logData:[],uuid:uuid};
      Logging.insertLog(uuid,triggertype.Manual,taskName.restore);

      const filePath = path.join(__dirname, '..', backupfolder, req.params.filename);

      await restore(filePath,refLog);
      Logging.updateLog(uuid,refLog.logData,taskstate.SUCCESS);

      res.send('Restore completed successfully');
      sendUpdate("TaskComplete",{message:"Restore completed successfully"});
    } catch (error) {
      console.error(error);
      res.status(500).send('Restore failed');
    }

  });




  router.get('/files', (req, res) => {
    try
    {
    const directoryPath = path.join(__dirname, '..', backupfolder);
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        res.status(500).send('Unable to read directory');
      } else {
        const fileData = files.filter(file => file.endsWith('.json'))
        .map(file => {
          const filePath = path.join(directoryPath, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            datecreated: stats.birthtime
          };
        });
        res.json(fileData);
      }
    });

    }catch(error)
    {
        console.log(error);
    }

  });


  //download backup file
  router.get('/files/:filename', (req, res) => {
    const filePath = path.join(__dirname, '..', backupfolder, req.params.filename);
    res.download(filePath);
  });

  //delete backup
  router.delete('/files/:filename', (req, res) => {

    try{
    const filePath = path.join(__dirname, '..', backupfolder, req.params.filename);

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send('An error occurred while deleting the file.');
          return;
        }

        console.log(`${filePath} has been deleted.`);
        res.status(200).send(`${filePath} has been deleted.`);
      });

    }catch(error)
    {
      res.status(500).send('An error occurred while deleting the file.');
    }

  });


  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '..', backupfolder)); // Set the destination folder for uploaded files
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






module.exports =
{
  router,
  backup
};
