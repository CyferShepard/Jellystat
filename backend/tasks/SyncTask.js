const db = require("../db");

const sync = require("../sync");

async function SyncTask(interval) {
  console.log("LibraryMonitor Interval: " + interval);


  setInterval(async () => {
    try {
      const { rows: config } = await db.query(
        'SELECT * FROM app_config where "ID"=1'
      );
     
      
    
      if (config.length===0 || config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
        return;
      }

      sync.fullSync();




    } catch (error) {
      // console.log(error);
      return [];
    }
  }, interval);
}

module.exports = {
  SyncTask,
};
