const db = require("../db");
const Logging = require("../logging");

const backup = require("../backup");
const moment = require('moment');
const { randomUUID }  = require('crypto');


async function BackupTask(interval) {
  console.log("Backup Interval: " + interval);


  setInterval(async () => {
    try {
      const { rows: config } = await db.query(
        'SELECT * FROM app_config where "ID"=1'
      );
     
      
    
      if (config.length===0 || config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
        return;
      }

 

      let startTime = moment();
      let refLog={logData:[],result:'Success'};

      await  backup.backup(refLog);
  
      let endTime = moment();
      let diffInSeconds = endTime.diff(startTime, 'seconds');
      const uuid = randomUUID();
      const log=
      {
        "Id":uuid,
        "Name":"Backup",
        "Type":"Task",
        "ExecutionType":"Automatic",
        "Duration":diffInSeconds,
        "TimeRun":startTime,
        "Log":JSON.stringify(refLog.logData),
        "Result":refLog.result
    
      };
      Logging.insertLog(log);




    } catch (error) {
      // console.log(error);
      return [];
    }
  }, interval);
}

module.exports = {
  BackupTask,
};
