const { Router } = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { randomUUID }  = require('crypto');
const multer = require('multer');

// const wss = require("./WebsocketHandler");
const Logging =require('./logging');

const router = Router();

// Database connection parameters
const postgresUser = process.env.POSTGRES_USER;
const postgresPassword = process.env.POSTGRES_PASSWORD;
const postgresIp = process.env.POSTGRES_IP;
const postgresPort = process.env.POSTGRES_PORT;
const postgresDatabase = process.env.POSTGRES_DATABASE || 'jfstat';

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
  const backupfolder='./backup-data';

  if (!fs.existsSync(backupfolder)) {
    fs.mkdirSync(backupfolder);
    console.log('Directory created successfully!');
  }
  if (!checkFolderWritePermission(backupfolder)) {
    console.error('No write permissions for the folder:', backupfolder);
    refLog.logData.push({ color: "red", Message: "Backup Failed: No write permissions for the folder: "+backupfolder });
    refLog.logData.push({ color: "red", Message: "Backup Failed with errors"});
    refLog.result='Failed';
    await pool.end();
    return;

  }
  

  const backupPath = `./backup-data/backup_${now.format('yyyy-MM-DD HH-mm-ss')}.json`;
  const stream = fs.createWriteStream(backupPath, { flags: 'a' });
  stream.on('error', (error) => {
    refLog.logData.push({ color: "red", Message: "Backup Failed: "+error });
    refLog.result='Failed';
    return;
  });
  const backup_data=[];
  
  refLog.logData.push({ color: "yellow", Message: "Begin Backup "+backupPath });
  for (let table of tables) {
    const query = `SELECT * FROM ${table}`;

    const { rows } = await pool.query(query);
    console.log(`Reading ${rows.length} rows for table ${table}`);
    refLog.logData.push({color: "dodgerblue",Message: `Saving ${rows.length} rows for table ${table}`});

    backup_data.push({[table]:rows});
    
  }


    await stream.write(JSON.stringify(backup_data));
    stream.end();
    refLog.logData.push({ color: "lawngreen", Message: "Backup Complete" });

  }catch(error)
  {
    console.log(error);
    refLog.logData.push({ color: "red", Message: "Backup Failed: "+error });
    refLog.result='Failed';
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

async function restore(file,logData,result) {

  logData.push({ color: "lawngreen", Message: "Starting Restore" });
  logData.push({ color: "yellow", Message: "Restoring from Backup: "+file });
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
      logData.push({ color: "red",key:tableName ,Message: `Failed to read backup file`});
        
      result='Failed';
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

      for(let index in data)
      {

        logData.push({ color: "dodgerblue",key:tableName ,Message: `Restoring ${tableName} ${(((index)/(data.length-1))*100).toFixed(2)}%`});
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
    logData.push({ color: "lawngreen", Message: "Restore Complete" });

  }

// Route handler for backup endpoint
router.get('/backup', async (req, res) => {
  try {
    let startTime = moment();
    let refLog={logData:[],result:'Success'};
    await backup(refLog);

    let endTime = moment();
    let diffInSeconds = endTime.diff(startTime, 'seconds');
    const uuid = randomUUID();
    const log=
    {
      "Id":uuid,
      "Name":"Backup",
      "Type":"Task",
      "ExecutionType":"Manual",
      "Duration":diffInSeconds || 0,
      "TimeRun":startTime,
      "Log":JSON.stringify(refLog.logData),
      "Result": refLog.result
  
    };
  
    Logging.insertLog(log);
    res.send('Backup completed successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Backup failed');
  }
});

router.get('/restore/:filename', async (req, res) => {
  let startTime = moment();
  let logData=[];
  let result='Success';
    try {
      const filePath = path.join(__dirname, backupfolder, req.params.filename);
   
      await restore(filePath,logData,result);

      res.send('Restore completed successfully');
    } catch (error) {
      console.error(error);
      res.status(500).send('Restore failed');
    }

    let endTime = moment();
      let diffInSeconds = endTime.diff(startTime, 'seconds');
      const uuid = randomUUID();

      const log=
      {
        "Id":uuid,
        "Name":"Restore",
        "Type":"Task",
        "ExecutionType":"Manual",
        "Duration":diffInSeconds,
        "TimeRun":startTime,
        "Log":JSON.stringify(logData),
        "Result": result
    
      };
    
      
      Logging.insertLog(log);
  });

  //list backup files
  const backupfolder='backup-data';

  
  router.get('/files', (req, res) => {
    try
    {  
      const directoryPath = path.join(__dirname, backupfolder);
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
    const filePath = path.join(__dirname, backupfolder, req.params.filename);
    res.download(filePath);
  });

  //delete backup
  router.delete('/files/:filename', (req, res) => {

    try{
      const filePath = path.join(__dirname, backupfolder, req.params.filename);
  
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
      cb(null, path.join(__dirname, backupfolder)); // Set the destination folder for uploaded files
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
