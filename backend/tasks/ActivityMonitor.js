const db = require("../db");
const pgp = require("pg-promise")();
const axios = require("axios");

const moment = require('moment');
const { columnsPlayback, mappingPlayback } = require('../models/jf_playback_activity');
const { jf_activity_watchdog_columns, jf_activity_watchdog_mapping } = require('../models/jf_activity_watchdog');
const { randomUUID }  = require('crypto');
const https = require('https');

const agent = new https.Agent({
  rejectUnauthorized: (process.env.REJECT_SELF_SIGNED_CERTIFICATES || 'true').toLowerCase() ==='true'
});



const axios_instance = axios.create({
  httpsAgent: agent
});

async function ActivityMonitor(interval) {
  console.log("Activity Interval: " + interval);

 

  setInterval(async () => {
    try {
      const { rows: config } = await db.query(
        'SELECT * FROM app_config where "ID"=1'
      );
     
      
      if(config.length===0)
      {
        return;
      }
      const base_url = config[0].JF_HOST;
      const apiKey = config[0].JF_API_KEY;
    
      if (base_url === null || config[0].JF_API_KEY === null) {
        return;
      }

      const url = `${base_url}/Sessions`;
      const response = await axios_instance.get(url, {
        headers: {
          "X-MediaBrowser-Token": apiKey,
        },
      });
      const SessionData=response.data.filter(row => row.NowPlayingItem !== undefined);

      /////get data from jf_activity_monitor
      const WatchdogData=await db.query('SELECT * FROM jf_activity_watchdog').then((res) => res.rows);

      // //compare to sessiondata

      let WatchdogDataToInsert = [];
      let WatchdogDataToUpdate = [];
      //filter fix if table is empty

      if (WatchdogData.length === 0) {
        // if there are no existing Ids in the table, map all items in the data array to the expected format
        WatchdogDataToInsert = await SessionData.map(jf_activity_watchdog_mapping);
      } else {
        // otherwise, filter only new data to insert
        WatchdogDataToInsert = await SessionData.filter((session) => !WatchdogData.map((wdData) => wdData.Id).includes(session.Id))
          .map(jf_activity_watchdog_mapping);
          
          WatchdogDataToUpdate = WatchdogData.filter((wdData) => {
            const session = SessionData.find((sessionData) => sessionData.Id === wdData.Id);
            if (session && session.PlayState) {
              if (wdData.IsPaused !== session.PlayState.IsPaused) {
                wdData.IsPaused = session.PlayState.IsPaused;
                return true;
              }
            }
            return false;
          });
          

      }


  
      if (WatchdogDataToInsert.length !== 0) {
        db.insertBulk("jf_activity_watchdog",WatchdogDataToInsert,jf_activity_watchdog_columns);
      }
     

      //update wd state
      if(WatchdogDataToUpdate.length>0)
      {


        const WatchdogDataUpdated = WatchdogDataToUpdate.map(obj => {
         



          let startTime = moment(obj.ActivityDateInserted, 'YYYY-MM-DD HH:mm:ss.SSSZ');
          let endTime = moment();

          let diffInSeconds = endTime.diff(startTime, 'seconds');

          if(obj.IsPaused) {
            obj.PlaybackDuration =parseInt(obj.PlaybackDuration)+ diffInSeconds;
          }

         obj.ActivityDateInserted = `'${endTime.format('YYYY-MM-DD HH:mm:ss.SSSZ')}'::timestamptz`;
          
          const {...rest } = obj;

          return { ...rest };
        });

        
      
        await (async () => {
          try {
            await db.query("BEGIN");
            const cs = new pgp.helpers.ColumnSet([
              '?Id',
              'IsPaused',
              { name: 'PlaybackDuration', mod: ':raw' },
              { name: 'ActivityDateInserted', mod: ':raw' },
            ]);
        
            const updateQuery = pgp.helpers.update(WatchdogDataUpdated, cs,'jf_activity_watchdog' ) + ' WHERE v."Id" = t."Id"';
            await db.query(updateQuery)
              .then(result => {
                // console.log('Update successful', result.rowCount, 'rows updated');
              })
              .catch(error => {
                console.error('Error updating rows', error);
              });
        
            await db.query("COMMIT");
          } catch (error) {
            await db.query("ROLLBACK");
            console.log(error);
          }
        })();
      }

      //delete from db no longer in session data and insert into stats db (still to make)
      //Bulk delete from db thats no longer on api

      const toDeleteIds = WatchdogData.filter((id) =>!SessionData.some((row) => row.Id === id.Id)).map((row) => row.Id);


      const playbackData =  WatchdogData.filter((id) => !SessionData.some((row) => row.Id === id.Id));

      
      const playbackToInsert = playbackData.map(obj => {
        const uuid = randomUUID()

        obj.Id=uuid;
         
        let startTime = moment(obj.ActivityDateInserted, 'YYYY-MM-DD HH:mm:ss.SSSZ');
        let endTime = moment();
       
        let diffInSeconds = endTime.diff(startTime, 'seconds');

       

        if(!obj.IsPaused) {
          obj.PlaybackDuration =parseInt(obj.PlaybackDuration)+ diffInSeconds; 
        }

        obj.ActivityDateInserted =endTime.format('YYYY-MM-DD HH:mm:ss.SSSZ');
        const {...rest } = obj;

        return { ...rest };
      });



      if(toDeleteIds.length>0)
      {
        let result=await db.deleteBulk('jf_activity_watchdog',toDeleteIds)
        // console.log(result);
      }
      if(playbackToInsert.length>0)
      {
        let result=await db.insertBulk('jf_playback_activity',playbackToInsert,columnsPlayback);
        // console.log(result);
      }


      ///////////////////////////



    } catch (error) {
      // console.log(error);
      return [];
    }
  }, interval);
}

module.exports = {
  ActivityMonitor,
};
