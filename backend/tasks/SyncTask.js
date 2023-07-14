const db = require("../db");
const moment = require('moment');
const sync = require("../routes/sync");

async function SyncTask() {

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
                                          WHERE "Name"='Jellyfin Sync'
                                          ORDER BY "TimeRun" DESC
                                          LIMIT 1`).then((res) => res.rows);
    if(last_execution.length!==0)
    { 
        let last_execution_time = moment(last_execution[0].TimeRun).add(10, 'minutes');
  
        if(current_time.isAfter(last_execution_time)===false)
        {
            intervalTask = setInterval(intervalCallback, interval); 
            return;
        }
    }


    console.log('Running Scheduled Sync');
    await sync.fullSync('Automatic');
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
