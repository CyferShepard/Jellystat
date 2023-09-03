const db = require("../db");
const moment = require('moment');
const sync = require("../routes/sync");
const taskName=require('../logging/taskName');
const taskstate = require("../logging/taskstate");
const triggertype = require("../logging/triggertype");

async function SyncTask() {
  try{

    await db.query(
           `UPDATE jf_logging SET "Result"='${taskstate.FAILED}' WHERE "Name"='${taskName.sync}' AND "Result"='${taskstate.RUNNING}'`
         );
    }
    catch(error)
    {
      console.log('Error Cleaning up Sync Tasks: '+error);
    }

let interval=10000; 

let taskDelay=15; //in minutes


try{//get interval from db

  
  const settingsjson = await db
    .query('SELECT settings FROM app_config where "ID"=1')
    .then((res) => res.rows);
    
  if (settingsjson.length > 0) {
    const settings = settingsjson[0].settings || {};

    let synctasksettings = settings.Tasks?.JellyfinSync || {};

    if (synctasksettings.Interval) {
      taskDelay=synctasksettings.Interval;
    } else {
      synctasksettings.Interval=taskDelay;
    }

    if(!settings.Tasks)
    {
      settings.Tasks = {};
    }
    if(!settings.Tasks.JellyfinSync)
    {
      settings.Tasks.JellyfinSync = {};
    }
    settings.Tasks.JellyfinSync = synctasksettings;


    let query = 'UPDATE app_config SET settings=$1 where "ID"=1';

    await db.query(query, [settings]);
  }
}
catch(error)
{
  console.log('Sync Task Settings Error: '+error);
}



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
  
  
    const last_execution=await db.query( `SELECT "TimeRun","Result"
                                          FROM public.jf_logging
                                          WHERE "Name"='${taskName.sync}'
                                          ORDER BY "TimeRun" DESC
                                          LIMIT 1`).then((res) => res.rows);
    if(last_execution.length!==0)
    { 
        let last_execution_time = moment(last_execution[0].TimeRun).add(taskDelay, 'minutes');

        if(!current_time.isAfter(last_execution_time) || last_execution[0].Result ===taskstate.RUNNING)
        {
            intervalTask = setInterval(intervalCallback, interval); 
            return;
        }
    }


    console.log('Running Scheduled Sync');
    await sync.fullSync(triggertype.Automatic);
    console.log('Scheduled Sync Complete');
    
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
  SyncTask,
};
