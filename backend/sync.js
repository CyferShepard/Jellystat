const express = require("express");
const pgp = require("pg-promise")();
const db = require("./db");
const axios = require("axios");
const https = require('https');

const logging=require("./logging");

const agent = new https.Agent({
  rejectUnauthorized: (process.env.REJECT_SELF_SIGNED_CERTIFICATES || 'true').toLowerCase() ==='true'
});



const axios_instance = axios.create({
  httpsAgent: agent
});

const wss = require("./WebsocketHandler");
const socket=wss;

const moment = require('moment');
const { randomUUID }  = require('crypto');


const router = express.Router();

const {jf_libraries_columns,jf_libraries_mapping,} = require("./models/jf_libraries");
const {jf_library_items_columns,jf_library_items_mapping,} = require("./models/jf_library_items");
const {jf_library_seasons_columns,jf_library_seasons_mapping,} = require("./models/jf_library_seasons");
const {jf_library_episodes_columns,jf_library_episodes_mapping,} = require("./models/jf_library_episodes");
const {jf_item_info_columns,jf_item_info_mapping,} = require("./models/jf_item_info");
const {columnsPlaybackReporting,mappingPlaybackReporting}= require("./models/jf_playback_reporting_plugin_data");

const {jf_users_columns,jf_users_mapping,} = require("./models/jf_users");

/////////////////////////////////////////Functions
class sync {
  constructor(hostUrl, apiKey) {
    this.hostUrl = hostUrl;
    this.apiKey = apiKey;
  }

  async getUsers() {
    try {
      const url = `${this.hostUrl}/Users`;
      const response = await axios_instance.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getAdminUser() {
    try {
      const url = `${this.hostUrl}/Users`;
      const response = await axios_instance.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.apiKey,
        },
      });
      if(!response || typeof response.data !== 'object' || !Array.isArray(response.data))
      {
        res.status(503);
        res.send({ error: "Invalid Response from Users API Call.", user_response:response });
        return;
      }
  
      const adminUser = response.data.filter(
        (user) => user.Policy.IsAdministrator === true
      );
      return adminUser || null;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getItem(itemID,userid) {
    try {

      let url = `${this.hostUrl}/users/${userid}/Items`;
      if (itemID !== undefined) {
        url += `?ParentID=${itemID}`;
      }
      const response = await axios_instance.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.apiKey,
        },
      });

      const results = response.data.Items;
      if (itemID === undefined) {
        return results.filter((type) =>
          ["tvshows", "movies","music"].includes(type.CollectionType)
        );
      } else {
        return results.filter((item)=> item.ImageTags.Primary);
      }
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getSeasonsAndEpisodes(itemID, type) {
    try {

      let url = `${this.hostUrl}/shows/${itemID}/${type}`;
      if (itemID !== undefined) {
        url += `?ParentID=${itemID}`;
      }
      const response = await axios_instance.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.apiKey,
        },
      });

      return response.data.Items;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  

  async getItemInfo(itemID,userid) {
    try {

      let url = `${this.hostUrl}/Items/${itemID}/playbackinfo?userId=${userid}`;

      const response = await axios_instance.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.apiKey,
        },
      });

      const results = response.data.MediaSources;
      return results;
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}
////////////////////////////////////////API Methods

async function syncUserData(refLog)
{
  try
  {
    const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
    if (rows[0].JF_HOST === null || rows[0].JF_API_KEY === null) {
      res.send({ error: "Config Details Not Found" });
      refLog.loggedData.push({ Message: "Error: Config details not found!" });
      refLog.result='Failed';
      return;
    }
  
    const _sync = new sync(rows[0].JF_HOST, rows[0].JF_API_KEY);
  
    const data = await _sync.getUsers();
  
    const existingIds = await db
      .query('SELECT "Id" FROM jf_users')
      .then((res) => res.rows.map((row) => row.Id)); // get existing library Ids from the db
  
    let dataToInsert = [];
    //filter fix if jf_libraries is empty
  
    if (existingIds.length === 0) {
      dataToInsert = await data.map(jf_users_mapping);
    } else {
      dataToInsert = await data
        .filter((row) => !existingIds.includes(row.Id))
        .map(jf_users_mapping);
    }
  
    if (dataToInsert.length !== 0) {
      let result = await db.insertBulk("jf_users",dataToInsert,jf_users_columns);
      if (result.Result === "SUCCESS") {
        refLog.loggedData.push(dataToInsert.length + " Rows Inserted.");
      } else {
        refLog.loggedData.push({
          color: "red",
          Message: "Error performing bulk insert:" + result.message,
        });
        refLog.result='Failed';
      }
    }
    
    const toDeleteIds = existingIds.filter((id) =>!data.some((row) => row.Id === id ));
    if (toDeleteIds.length > 0) {
      let result = await db.deleteBulk("jf_users",toDeleteIds);
      if (result.Result === "SUCCESS") {
        refLog.loggedData.push(toDeleteIds.length + " Rows Removed.");
      } else {
        refLog.loggedData.push({color: "red",Message: "Error: "+result.message,});
        refLog.result='Failed';
      }
    
    }

  }catch(error)
  {
  refLog.loggedData.push({color: "red",Message:  "Error: "+error,});
  refLog.result='Failed';
  }
 

}

async function syncLibraryFolders(refLog)
{
  try
  {

    const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
    if (rows[0].JF_HOST === null || rows[0].JF_API_KEY === null) {
      res.send({ error: "Config Details Not Found" });
      refLog.loggedData.push({ Message: "Error: Config details not found!" });
      refLog.result='Failed';
      return;
    }
  
    const _sync = new sync(rows[0].JF_HOST, rows[0].JF_API_KEY);
    const admins = await _sync.getAdminUser();
    const userid = admins[0].Id;
    const data = await _sync.getItem(undefined,userid); //getting all root folders aka libraries
  
    const existingIds = await db
      .query('SELECT "Id" FROM jf_libraries')
      .then((res) => res.rows.map((row) => row.Id));
  
  
    let dataToInsert = [];
    //filter fix if jf_libraries is empty
  
    if (existingIds.length === 0) {
      dataToInsert = await data.map(jf_libraries_mapping);
    } else {
      dataToInsert = await data.filter((row) => !existingIds.includes(row.Id)).map(jf_libraries_mapping);
    }
  
    if (dataToInsert.length !== 0) {
      let result = await db.insertBulk("jf_libraries",dataToInsert,jf_libraries_columns);
      if (result.Result === "SUCCESS") {
        refLog.loggedData.push(dataToInsert.length + " Rows Inserted.");
      } else {
        refLog.loggedData.push({
          color: "red",
          Message: "Error performing bulk insert:" + result.message,
        });
        refLog.result='Failed';
      }
    }
  
    const toDeleteIds = existingIds.filter((id) =>!data.some((row) => row.Id === id ));
    if (toDeleteIds.length > 0) {
      let result = await db.deleteBulk("jf_libraries",toDeleteIds);
      if (result.Result === "SUCCESS") {
        refLog.loggedData.push(toDeleteIds.length + " Rows Removed.");
      } else {
        refLog.loggedData.push({color: "red",Message:  "Error: "+result.message,});
        refLog.result='Failed';
      }
    
    } 
  }
  catch(error)
  {
    refLog.loggedData.push({color: "red",Message: "Error: "+error,});
    refLog.result='Failed';
  }
  
}
async function syncLibraryItems(refLog)
{
  try{
    const { rows: config } = await db.query('SELECT * FROM app_config where "ID"=1' );


  if (config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
    res.send({ error: "Config Details Not Found" });
    refLog.result='Failed';
    return;
  }

  const _sync = new sync(config[0].JF_HOST, config[0].JF_API_KEY);
  refLog.loggedData.push({ color: "lawngreen", Message: "Syncing... 1/3" });
  refLog.loggedData.push({color: "yellow",Message: "Beginning Library Item Sync",});

  const admins = await _sync.getAdminUser();
  const userid = admins[0].Id;
  const libraries = await _sync.getItem(undefined,userid);
  const data = [];
  let insertMessage='';
  let deleteCounter = 0;
  //for each item in library run get item using that id as the ParentId (This gets the children of the parent id)
  for (let i = 0; i < libraries.length; i++) {
    const item = libraries[i];
    let libraryItems = await _sync.getItem(item.Id,userid);
    const libraryItemsWithParent = libraryItems.map((items) => ({
      ...items,
      ...{ ParentId: item.Id },
    }));
    data.push(...libraryItemsWithParent);
  }


  const existingIds = await db
    .query('SELECT "Id" FROM jf_library_items')
    .then((res) => res.rows.map((row) => row.Id));

  let dataToInsert = [];
  //filter fix if jf_libraries is empty

  dataToInsert = await data.map(jf_library_items_mapping);
  // if (existingIds.length === 0) {
  //   dataToInsert = await data.map(jf_library_items_mapping);
  // } else {
  //   dataToInsert = await data
  //     .filter((row) => !existingIds.includes(row.Id))
  //     .map(jf_library_items_mapping);
  // }


  if (dataToInsert.length !== 0) {
    
    let result = await db.insertBulk("jf_library_items",dataToInsert,jf_library_items_columns);
    if (result.Result === "SUCCESS") {
      insertMessage = `${dataToInsert.length-existingIds.length} Rows Inserted. ${existingIds.length} Rows Updated.`;
    } else {
      refLog.loggedData.push({
        color: "red",
        Message: "Error performing bulk insert:" + result.message,
      });
      refLog.result='Failed';
    }
  }
  
  const toDeleteIds = existingIds.filter((id) =>!data.some((row) => row.Id === id ));
  if (toDeleteIds.length > 0) {
    let result = await db.deleteBulk("jf_library_items",toDeleteIds);
    if (result.Result === "SUCCESS") {
      deleteCounter +=toDeleteIds.length;
    } else {
      refLog.loggedData.push({color: "red",Message:  "Error: "+result.message,});
      refLog.result='Failed';
    }
  } 
  
  refLog.loggedData.push({color: "dodgerblue",Message: insertMessage,});
  refLog.loggedData.push({color: "orange",Message: deleteCounter + " Library Items Removed.",});
  refLog.loggedData.push({ color: "yellow", Message: "Item Sync Complete" });

  }catch(error)
  {
    refLog.loggedData.push({color: "red",Message:  "Error: "+error,});
    refLog.result='Failed';
  }
  


}

async function syncShowItems(refLog)
{
 try{
  refLog.loggedData.push({ color: "lawngreen", Message: "Syncing... 2/3" });
  refLog.loggedData.push({color: "yellow", Message: "Beginning Seasons and Episode sync",});

  const { rows: config } = await db.query('SELECT * FROM app_config where "ID"=1');

  if (config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
    res.send({ error: "Config Details Not Found" });
    refLog.result='Failed';
    return;
  }

  const _sync = new sync(config[0].JF_HOST, config[0].JF_API_KEY);
  const { rows: shows } = await db.query(`SELECT *	FROM public.jf_library_items where "Type"='Series'`);

  let insertSeasonsCount = 0;
  let insertEpisodeCount = 0;
  let updateSeasonsCount = 0;
  let updateEpisodeCount = 0;


  let deleteSeasonsCount = 0;
  let deleteEpisodeCount = 0;

  //loop for each show
  for (const show of shows) {
    const allSeasons = await _sync.getSeasonsAndEpisodes(show.Id,'Seasons');
    const allEpisodes =await _sync.getSeasonsAndEpisodes(show.Id,'Episodes');

    const existingIdsSeasons = await db.query(`SELECT *	FROM public.jf_library_seasons where "SeriesId" = '${show.Id}'`).then((res) => res.rows.map((row) => row.Id));

    let existingIdsEpisodes = [];
    if (existingIdsSeasons.length > 0) {
      existingIdsEpisodes = await db
        .query(`SELECT * FROM public.jf_library_episodes WHERE "SeasonId" IN (${existingIdsSeasons
            .filter((seasons) => seasons !== "")
            .map((seasons) => pgp.as.value(seasons))
            .map((value) => "'" + value + "'")
            .join(", ")})`
        )
        .then((res) => res.rows.map((row) => row.EpisodeId));
    }



    let seasonsToInsert = [];
    let episodesToInsert = [];

    seasonsToInsert = await allSeasons.map(jf_library_seasons_mapping);
    episodesToInsert = await allEpisodes.map(jf_library_episodes_mapping);

    //Bulkinsert new data not on db
    if (seasonsToInsert.length !== 0) {
      let result = await db.insertBulk("jf_library_seasons",seasonsToInsert,jf_library_seasons_columns);
      if (result.Result === "SUCCESS") {
        insertSeasonsCount+=seasonsToInsert.length-existingIdsSeasons.length;
        updateSeasonsCount+=existingIdsSeasons.length;
        } else {
        refLog.loggedData.push({
          color: "red",
          Message: "Error performing bulk insert:" + result.message,
        });
        refLog.result='Failed';
      }
    } 
    const toDeleteIds = existingIdsSeasons.filter((id) =>!allSeasons.some((row) => row.Id === id ));
    //Bulk delete from db thats no longer on api
    if (toDeleteIds.length > 0) {
      let result = await db.deleteBulk("jf_library_seasons",toDeleteIds);
      if (result.Result === "SUCCESS") {
        deleteSeasonsCount +=toDeleteIds.length;
      } else {
        refLog.loggedData.push({color: "red",Message:  "Error: "+result.message,});
        refLog.result='Failed';
      }
    
    } 
    //insert delete episodes
    //Bulkinsert new data not on db
    if (episodesToInsert.length !== 0) {
      let result = await db.insertBulk("jf_library_episodes",episodesToInsert,jf_library_episodes_columns);
      if (result.Result === "SUCCESS") {
        insertEpisodeCount+=episodesToInsert.length-existingIdsEpisodes.length;
        updateEpisodeCount+=existingIdsEpisodes.length;
      } else {
        refLog.loggedData.push({
          color: "red",
          Message: "Error performing bulk insert:" + result.message,
        });
        refLog.result='Failed';
      }
    } 

    const toDeleteEpisodeIds = existingIdsEpisodes.filter((id) =>!allEpisodes.some((row) => row.Id=== id ));
    //Bulk delete from db thats no longer on api
    if (toDeleteEpisodeIds.length > 0) {
      let result = await db.deleteBulk("jf_library_episodes",toDeleteEpisodeIds);
      if (result.Result === "SUCCESS") {
        deleteEpisodeCount +=toDeleteEpisodeIds.length;
      } else {
        refLog.loggedData.push({color: "red",Message:  "Error: "+result.message,});
        refLog.result='Failed';
      }
    
    } 

 
  }

  refLog.loggedData.push({color: "dodgerblue",Message: `Seasons: ${insertSeasonsCount} Rows Inserted. ${updateSeasonsCount} Rows Updated.`});
  refLog.loggedData.push({color: "orange",Message: deleteSeasonsCount + " Seasons Removed.",});
  refLog.loggedData.push({color: "dodgerblue",Message: `Episodes: ${insertEpisodeCount} Rows Inserted. ${updateEpisodeCount} Rows Updated.`});
  refLog.loggedData.push({color: "orange",Message: deleteEpisodeCount + " Episodes Removed.",});
  refLog.loggedData.push({ color: "yellow", Message: "Sync Complete" });
 }catch(error)
 {
  refLog.loggedData.push({color: "red",Message:  "Error: "+error,});
  refLog.result='Failed';
 }
}

async function syncItemInfo(refLog)
{
 try{
  refLog.loggedData.push({ color: "lawngreen", Message: "Syncing... 3/4" });
  refLog.loggedData.push({color: "yellow", Message: "Beginning File Info Sync",});

  const { rows: config } = await db.query('SELECT * FROM app_config where "ID"=1');

  if (config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
    res.send({ error: "Config Details Not Found" });
    refLog.result='Failed';
    return;
  }

  const _sync = new sync(config[0].JF_HOST, config[0].JF_API_KEY);
  const { rows: Items } = await db.query(`SELECT li.*	FROM public.jf_library_items li left join jf_item_info ii on ii."Id"=li."Id" where li."Type" not in ('Series','Folder') and ii."Id" is null`);
  const { rows: Episodes } = await db.query(`SELECT le.*	FROM public.jf_library_episodes le left join jf_item_info ii on ii."Id"=le."EpisodeId" where ii."Id" is null`);

  let insertItemInfoCount = 0;
  let insertEpisodeInfoCount = 0;
  let deleteItemInfoCount  = 0;
  let deleteEpisodeInfoCount = 0;

  const admins = await _sync.getAdminUser();
  const userid = admins[0].Id;
  //loop for each Movie
  for (const Item of Items) {
    const data = await _sync.getItemInfo(Item.Id,userid);

    const existingItemInfo = await db.query(`SELECT *	FROM public.jf_item_info where "Id" = '${Item.Id}'`).then((res) => res.rows.map((row) => row.Id));
    
    let ItemInfoToInsert = [];
    //filter fix if jf_libraries is empty

    if (existingItemInfo.length === 0) {
      // if there are no existing Ids in the table, map all items in the data array to the expected format
      ItemInfoToInsert = await data.map(item => jf_item_info_mapping(item, 'Item'));
    } else {
      ItemInfoToInsert = await data.filter((row) => !existingItemInfo.includes(row.Id))
        .map(item => jf_item_info_mapping(item, 'Item'));
    }

    if (ItemInfoToInsert.length !== 0) {
      let result = await db.insertBulk("jf_item_info",ItemInfoToInsert,jf_item_info_columns);
      if (result.Result === "SUCCESS") {
        insertItemInfoCount += ItemInfoToInsert.length;
      } else {
        refLog.loggedData.push({
          color: "red",
          Message: "Error performing bulk insert:" + result.message,
        });
        refLog.result='Failed';
      }
    } 
    const toDeleteItemInfoIds = existingItemInfo.filter((id) =>!data.some((row) => row.Id  === id ));
    //Bulk delete from db thats no longer on api
    if (toDeleteItemInfoIds.length > 0) {
      let result = await db.deleteBulk("jf_item_info",toDeleteItemInfoIds);
      if (result.Result === "SUCCESS") {
        deleteItemInfoCount +=toDeleteItemInfoIds.length;
      } else {
        refLog.loggedData.push({color: "red",Message:  "Error: "+result.message,});
        refLog.result='Failed';
      }
    
    } 
  }

   //loop for each Episode
   for (const Episode of Episodes) {
    const data = await _sync.getItemInfo(Episode.EpisodeId,userid);


    const existingEpisodeItemInfo = await db.query(`SELECT *	FROM public.jf_item_info where "Id" = '${Episode.EpisodeId}'`).then((res) => res.rows.map((row) => row.Id));


    let EpisodeInfoToInsert = [];
    //filter fix if jf_libraries is empty

    if (existingEpisodeItemInfo.length === 0) {
      // if there are no existing Ids in the table, map all items in the data array to the expected format
      EpisodeInfoToInsert = await data.map(item => jf_item_info_mapping(item, 'Episode'));
    } else {
      EpisodeInfoToInsert = await data.filter((row) => !existingEpisodeItemInfo.includes(row.Id))
        .map(item => jf_item_info_mapping(item, 'Episode'));
    }

    if (EpisodeInfoToInsert.length !== 0) {
      let result = await db.insertBulk("jf_item_info",EpisodeInfoToInsert,jf_item_info_columns);
      if (result.Result === "SUCCESS") {
        insertEpisodeInfoCount += EpisodeInfoToInsert.length;
      } else {
        refLog.loggedData.push({
          color: "red",
          Message: "Error performing bulk insert:" + result.message,
        });
        refLog.result='Failed';
      }
    } 
    const toDeleteEpisodeInfoIds = existingEpisodeItemInfo.filter((id) =>!data.some((row) => row.Id  === id ));
    //Bulk delete from db thats no longer on api
    if (toDeleteEpisodeInfoIds.length > 0) {
      let result = await db.deleteBulk("jf_item_info",toDeleteEpisodeInfoIds);
      if (result.Result === "SUCCESS") {
        deleteEpisodeInfoCount +=toDeleteEpisodeInfoIds.length;
      } else {
        refLog.loggedData.push({color: "red",Message:  "Error: "+result.message,});
        refLog.result='Failed';
      }
    
    }
    console.log(Episode.Name) 
  }

  refLog.loggedData.push({color: "dodgerblue",Message: insertItemInfoCount + " Item Info inserted.",});
  refLog.loggedData.push({color: "orange",Message: deleteItemInfoCount + " Item Info Removed.",});
  refLog.loggedData.push({color: "dodgerblue",Message: insertEpisodeInfoCount + " Episodes Info inserted.",});
  refLog.loggedData.push({color: "orange",Message: deleteEpisodeInfoCount + " Episodes Info Removed.",});
  refLog.loggedData.push({ color: "lawngreen", Message: "Info Sync Complete" });
 }catch(error)
 {
  refLog.loggedData.push({color: "red",Message:  "Error: "+error,});
  refLog.result='Failed';
 }
}

async function syncPlaybackPluginData()
{
  socket.sendMessageToClients({ color: "lawngreen", Message: "Syncing... 3/3" });
  socket.sendMessageToClients({color: "yellow", Message: "Beginning File Info Sync",});

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

    const { rows: pbData } = await db.query(
      'SELECT * FROM jf_playback_reporting_plugin_data order by rowid desc limit 1'
    );

    let query=`SELECT rowid, * FROM PlaybackActivity`;

    

    if(pbData[0])
    {
      query+=' where rowid > '+pbData[0].rowid;
    }
    query+=' order by rowid';

    const url = `${base_url}/user_usage_stats/submit_custom_query`;

    const response = await axios_instance.post(url, {
      CustomQueryString: query,
    }, {
      headers: {
        "X-MediaBrowser-Token": apiKey,
      },
    });

    const PlaybackData=response.data.results;

    let DataToInsert = await PlaybackData.map(mappingPlaybackReporting);


    if (DataToInsert.length !== 0) {
      let result=await db.insertBulk("jf_playback_reporting_plugin_data",DataToInsert,columnsPlaybackReporting);
      console.log(result);
    }    
  
     } catch (error) {
      console.log(error);
     return [];
   }
   
}

async function removeOrphanedData(refLog)
{
 try{
  refLog.loggedData.push({ color: "lawngreen", Message: "Syncing... 4/4" });
  refLog.loggedData.push({color: "yellow", Message: "Removing Orphaned FileInfo/Episode/Season Records",});

  await db.query('CALL jd_remove_orphaned_data()');

  refLog.loggedData.push({color: "dodgerblue",Message: "Orphaned FileInfo/Episode/Season Removed.",});

  refLog.loggedData.push({ color: "lawngreen", Message: "Sync Complete" });
 }catch(error)
 {
  refLog.loggedData.push({color: "red",Message: 'Error:'+error,});
  refLog.loggedData.push({ color: "red", Message: "Cleanup Failed with errors" });
  refLog.result='Failed';
 }

}

async function fullSync()
{
  let startTime = moment();
  let refLog={loggedData:[],result:'Success'};
  await syncUserData(refLog);
  await syncLibraryFolders(refLog);
  await syncLibraryItems(refLog);
  await syncShowItems(refLog);
  await syncItemInfo(refLog);
  await removeOrphanedData(refLog);
  const uuid = randomUUID();

  let endTime = moment();
 
  let diffInSeconds = endTime.diff(startTime, 'seconds');

  const log=
  {
    "Id":uuid,
    "Name":"Jellyfin Sync",
    "Type":"Task",
    "ExecutionType":"Automatic",
    "Duration":diffInSeconds,
    "TimeRun":startTime,
    "Log":JSON.stringify(refLog.loggedData),
    "Result":refLog.result

  };
   logging.insertLog(log);


}


////////////////////////////////////////API Calls

///////////////////////////////////////Sync All
router.get("/beingSync", async (req, res) => {
  socket.clearMessages();
  let refLog={loggedData:[],result:'Success'};

  let startTime = moment();
  await syncUserData(refLog);
  await syncLibraryFolders(refLog);
  await syncLibraryItems(refLog);
  await syncShowItems(refLog);
  await syncItemInfo(refLog);
  await removeOrphanedData(refLog);
  const uuid = randomUUID();

  let endTime = moment();
 
  let diffInSeconds = endTime.diff(startTime, 'seconds');

  const log=
  {
    "Id":uuid,
    "Name":"Jellyfin Sync",
    "Type":"Task",
    "ExecutionType":"Manual",
    "Duration":diffInSeconds,
    "TimeRun":startTime,
    "Log":JSON.stringify(refLog.loggedData),
    "Result":refLog.result

  };

  logging.insertLog(log);
  res.send();

});

///////////////////////////////////////Write Users
router.get("/writeUsers", async (req, res) => {
  await syncUserData();
  res.send();
});

///////////////////////////////////////writeLibraries
router.get("/writeLibraries", async (req, res) => {

  await syncLibraryFolders();
  res.send();

});

//////////////////////////////////////////////////////writeLibraryItems
router.get("/writeLibraryItems", async (req, res) => {

  await syncLibraryItems();
  res.send();

});

//////////////////////////////////////////////////////writeSeasonsAndEpisodes
router.get("/writeSeasonsAndEpisodes", async (req, res) => {
  await syncShowItems();
  res.send();

});

//////////////////////////////////////

//////////////////////////////////////////////////////writeMediaInfo
router.get("/writeMediaInfo", async (req, res) => {
  await syncItemInfo();
  res.send();

});

//////////////////////////////////////

//////////////////////////////////////////////////////syncPlaybackPluginData
router.get("/syncPlaybackPluginData", async (req, res) => {
  await syncPlaybackPluginData();
  res.send();

});

//////////////////////////////////////



module.exports = 
{router,fullSync};
