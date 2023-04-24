const { Router } = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

const wss = require("./WebsocketHandler");

const router = Router();

// Database connection parameters
const postgresUser = process.env.POSTGRES_USER;
const postgresPassword = process.env.POSTGRES_PASSWORD;
const postgresIp = process.env.POSTGRES_IP;
const postgresPort = process.env.POSTGRES_PORT;
const postgresDatabase = process.env.POSTGRES_DATABASE || 'jfstat';

// Tables to back up
const tables = ['jf_libraries', 'jf_library_items', 'jf_library_seasons','jf_library_episodes','jf_users','jf_playback_activity','jf_playback_reporting_plugin_data','jf_item_info'];


// Backup function
async function backup() {
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
  const backupPath = `./backup-data/backup_${now.format('yyyy-MM-DD HH-mm-ss')}.json`;
  const stream = fs.createWriteStream(backupPath, { flags: 'a' });
  const backup_data=[];
  
  wss.clearMessages();
  wss.sendMessageToClients({ color: "yellow", Message: "Begin Backup "+backupPath });
  for (let table of tables) {
    const query = `SELECT * FROM ${table}`;

    const { rows } = await pool.query(query);
    console.log(`Reading ${rows.length} rows for table ${table}`);
    wss.sendMessageToClients({color: "dodgerblue",Message: `Saving ${rows.length} rows for table ${table}`});

    backup_data.push({[table]:rows});
    
  }


    await stream.write(JSON.stringify(backup_data));
    stream.end();
    wss.sendMessageToClients({ color: "lawngreen", Message: "Backup Complete" });

  }catch(error)
  {
    console.log(error);
    wss.sendMessageToClients({ color: "red", Message: "Backup Failed: "+error });
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

async function restore(file) {
  wss.clearMessages();
  wss.sendMessageToClients({ color: "yellow", Message: "Restoring from Backup: "+file });
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

        wss.sendMessageToClients({ color: "dodgerblue",key:tableName ,Message: `Restoring ${tableName} ${(((index)/(data.length-1))*100).toFixed(2)}%`});

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

  }

// Route handler for backup endpoint
router.get('/backup', async (req, res) => {
  try {
    await backup();
    res.send('Backup completed successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Backup failed');
  }
});

router.get('/restore/:filename', async (req, res) => {
    try {
      const filePath = path.join(__dirname, backupfolder, req.params.filename);
      await restore(filePath);
      wss.sendMessageToClients({ color: "lawngreen", Message: `Restoring Complete` });
      res.send('Restore completed successfully');
    } catch (error) {
      console.error(error);
      wss.sendMessageToClients({ color: "red", Message: error });
      res.status(500).send('Restore failed');
    }
  });

  //list backup files
  const backupfolder='backup-data';

  
  router.get('/files', (req, res) => {
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
  });


  //download backup file
  router.get('/files/:filename', (req, res) => {
    const filePath = path.join(__dirname, backupfolder, req.params.filename);
    res.download(filePath);
  });

  //delete backup
  router.delete('/files/:filename', (req, res) => {
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
  });
  
  
  



module.exports = router;
