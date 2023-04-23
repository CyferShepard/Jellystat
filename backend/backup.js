const { Router } = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

const wss = require("./WebsocketHandler");

var messages=[];


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
    // stream.write(JSON.stringify(backup_data));
    
  }

  wss.sendMessageToClients({ color: "lawngreen", Message: "Backup Complete" });
  stream.write(JSON.stringify(backup_data));
  stream.end();

  await pool.end();
}

// Restore function
async function restore() {
    // const pool = new Pool({
    //   user: 'postgres',
    //   password: 'mypassword',
    //   host: postgresIp,
    //   port: 25432,
    //   database: postgresDatabase
    // });

    let user='postgres';
    let password='mypassword';
    let host=postgresIp;
    let port=25432;
    let database= postgresDatabase;

    const client = new Pool({
      host,
      port,
      database,
      user,
      password
    });
    const backupPath = './backup-data/backup.json';

    let jsonData;
    await fs.readFile(backupPath, 'utf8', async (err, data) => {
      if (err) {
        console.error(err);
        return;
      }

       jsonData = await JSON.parse(data);
    });

    console.log(jsonData);
    if(!jsonData)
    {
      return;
    }

    jsonData.forEach((library) => {

      console.log(library);
    });

    // await client.connect();

   

    // let tableStarted = false;
    // let tableColumns = '';
    // let tableValues = '';
    // let tableName = '';
    
    // for await (const line of rl) {
    //   if (!tableStarted && line.startsWith('COPY ')) {
    //     tableName = line.match(/COPY (.*) \(/)[1];
    //     tableStarted = true;
    //     tableColumns = '';
    //     tableValues = '';
    //   } else if (tableStarted && line.startsWith('\.')) {
    //     const insertStatement = `INSERT INTO ${tableName} (${tableColumns}) VALUES ${tableValues};`;
    //     await client.query(insertStatement);
    //     tableStarted = false;
    //   } else if (tableStarted && tableColumns === '') {
    //     tableColumns = line.replace(/\(/g, '').replace(/\)/g, '').replace(/"/g, '').trim();
    //     tableValues = '';
    //   } else if (tableStarted) {
    //     const values = line.replace(/\(/g, '').replace(/\)/g, '').split('\t').map(value => {
    //       if (value === '') {
    //         return null;
    //       }
    //       if (!isNaN(parseFloat(value))) {
    //         return parseFloat(value);
    //       }
    //       return value.replace(/'/g, "''");
    //     });
    //     const rowValues = `(${values.join(',')})`;
    //     tableValues = `${tableValues}${tableValues === '' ? '' : ','}${rowValues}`;
    //   }
    // }
    
    // await client.end();
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

router.get('/restore', async (req, res) => {
    try {
      await restore();
      res.send('Backup completed successfully');
    } catch (error) {
      console.error(error);
      res.status(500).send('Backup failed');
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
        const fileData = files.map(file => {
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
