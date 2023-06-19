const db = require("../db");
const Logging = require("../logging");

const backup = require("../backup");
const moment = require('moment');
const { randomUUID }  = require('crypto');


async function BackupTask() {
let interval=10000;

async function intervalCallback() {
    clearInterval(intervalTask); 
    try{
       let current_time = moment();
       const { rows: config } = await db.query(
             'SELECT * FROM app_config where "ID"=1'
            );
   
       if (config.length===0 || config[0].JF_HOST === null || config[0].JF_API_KEY === null) 
       {
           return;
       }
     
     
       const last_execution=await db.query( `SELECT "TimeRun"
                                             FROM public.jf_logging
                                             WHERE "Name"='Backup' AND "Result"='Success'
                                             ORDER BY "TimeRun" DESC
                                             LIMIT 1`).then((res) => res.rows);
       if(last_execution.length!==0)
       { 
           let last_execution_time = moment(last_execution[0].TimeRun).add(1, 'day');
     
           if(current_time.isAfter(last_execution_time)===false)
           {
               intervalTask = setInterval(intervalCallback, interval); 
               return;
           }
       }
   
   
       console.log('Running Scheduled Backup');

       let refLog={logData:[],result:'Success'};

       await backup.backup(refLog);
   
       let endTime = moment();
       let diffInSeconds = endTime.diff(current_time, 'seconds');
       const uuid = randomUUID();
       const log=
       {
         "Id":uuid,
         "Name":"Backup",
         "Type":"Task",
         "ExecutionType":"Automatic",
         "Duration":diffInSeconds,
         "TimeRun":current_time,
         "Log":JSON.stringify(refLog.logData),
         "Result":refLog.result
     
       };
       Logging.insertLog(log);

       console.log('Scheduled Backup Complete');
       
       } catch (error) 
       {
           console.log(error);
           return [];
       }
   
       intervalTask = setInterval(intervalCallback, interval); 
     }
   
   let intervalTask = setInterval(intervalCallback, interval);


}

module.exports = {
  BackupTask,
};
