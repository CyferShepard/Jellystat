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

// const wss = require("./WebsocketHandler");
// const socket=wss;

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

function getErrorLineNumber(error) {
  const stackTrace = error.stack.split('\n');
  const errorLine = stackTrace[1].trim();
  const lineNumber = errorLine.substring(
    errorLine.lastIndexOf('\\') + 1,
    errorLine.lastIndexOf(')')
  );
  return lineNumber;
}

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

  async getAdminUser(refLog) {
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
      refLog.loggedData.push({ Message: "Error Getting AdminId: "+error});
      refLog.result='Failed';
      return [];
    }
  }

  async getItem(ids,params) {
    try {


      let url = `${this.hostUrl}/Items?ids=${ids}`;
      let startIndex=params && params.startIndex ? params.startIndex :0;
      let increment=params && params.increment ? params.startIndex :200;
      let recursive=params && params.recursive!==undefined  ? params.recursive :true;
      let total=200;

      let final_response=[];
      while(startIndex<total && total !== undefined)
      {
        const response = await axios_instance.get(url, {
          headers: {
            "X-MediaBrowser-Token": this.apiKey,
          },        
          params:{
            startIndex:startIndex,
            recursive:recursive,
            limit:increment
          },
        });

        total=response.data.TotalRecordCount;
        startIndex+=increment;

         final_response=[...final_response, ...response.data.Items];

      }


      return final_response;
    } catch (error) {
      console.log(error);
      return [];
    }
  }


  async getItems(key,id,params) {
    try {


      let url = `${this.hostUrl}/Items?${key}=${id}`;
      let startIndex=params && params.startIndex ? params.startIndex :0;
      let increment=params && params.increment ? params.startIndex :200;
      let recursive=params && params.recursive!==undefined  ? params.recursive :true;
      let total=200;

      let final_response=[];
      while(startIndex<total && total !== undefined)
      {
        const response = await axios_instance.get(url, {
          headers: {
            "X-MediaBrowser-Token": this.apiKey,
          },        
          params:{
            startIndex:startIndex,
            recursive:recursive,
            limit:increment
          },
        });

        total=response.data.TotalRecordCount;
        startIndex+=increment;

         final_response=[...final_response, ...response.data.Items];

      }


      // const results = response.data.Items;
      if (key === 'userid') {
        return final_response.filter((type) => !["boxsets","playlists"].includes(type.CollectionType));
      } else {
        // return final_response.filter((item) => item.ImageTags.Primary);
        return final_response;
      }
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
  
    let dataToInsert = await data.map(jf_users_mapping);

  
    if (dataToInsert.length >0) {
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

    //update usernames on log table where username does not match the user table
    await db.query('UPDATE jf_playback_activity a SET "UserName" = u."Name" FROM jf_users u WHERE u."Id" = a."UserId" AND u."Name" <> a."UserName"');

  }catch(error)
  {
  refLog.loggedData.push({color: "red",Message: getErrorLineNumber(error)+ ": Error: "+error,});
  refLog.result='Failed';
  }
 

}

async function syncLibraryFolders(refLog,data)
{
  try
  {

    const existingIds = await db
      .query('SELECT "Id" FROM jf_libraries')
      .then((res) => res.rows.map((row) => row.Id));


    let dataToInsert = [];

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
  
//----------------------DELETE FUNCTION
    //GET EPISODES IN SEASONS
    //GET SEASONS IN SHOWS
    //GET SHOWS IN LIBRARY
    //FINALY DELETE LIBRARY
    const toDeleteIds = existingIds.filter((id) =>!data.some((row) => row.Id === id ));
    if (toDeleteIds.length > 0) {
      const ItemsToDelete=await db.query(`SELECT "Id" FROM jf_library_items where "ParentId" in (${toDeleteIds.map(id => `'${id}'`).join(',')})`).then((res) => res.rows.map((row) => row.Id));
      let resultItem=await db.deleteBulk("jf_library_items",ItemsToDelete);

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
    refLog.loggedData.push({color: "red",Message: getErrorLineNumber(error)+ ": Error: "+error,});
    refLog.result='Failed';
  }
  
}
async function syncLibraryItems(refLog,data)
{
  try{

    let existingLibraryIds = await db
    .query('SELECT "Id" FROM jf_libraries')
    .then((res) => res.rows.map((row) => row.Id));

  refLog.loggedData.push({ color: "lawngreen", Message: "Syncing... 1/3" });
  refLog.loggedData.push({color: "yellow",Message: "Beginning Library Item Sync",});

  data=data.filter((row) => existingLibraryIds.includes(row.ParentId));
  let insertMessage='';
  let deleteCounter = 0;


  const existingIds = await db
    .query('SELECT "Id" FROM jf_library_items')
    .then((res) => res.rows.map((row) => row.Id));

  let dataToInsert = [];
  //filter fix if jf_libraries is empty

  dataToInsert = await data.map(jf_library_items_mapping);
  dataToInsert=dataToInsert.filter((item)=>item.Id !== undefined);

  if (dataToInsert.length !== 0) {
    let result = await db.insertBulk("jf_library_items",dataToInsert,jf_library_items_columns);
    if (result.Result === "SUCCESS") {
      insertMessage = `${dataToInsert.length-existingIds.length >0 ? dataToInsert.length-existingIds.length : 0} Rows Inserted. ${existingIds.length} Rows Updated.`;
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
    refLog.loggedData.push({color: "red",Message:  getErrorLineNumber(error)+ ": Error: "+error,});
    refLog.result='Failed';
  }
  


}

async function syncShowItems(refLog,data)
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

  // const _sync = new sync(config[0].JF_HOST, config[0].JF_API_KEY);
  const { rows: shows } = await db.query(`SELECT *	FROM public.jf_library_items where "Type"='Series'`);

  let insertSeasonsCount = 0;
  let insertEpisodeCount = 0;
  let updateSeasonsCount = 0;
  let updateEpisodeCount = 0;


  let deleteSeasonsCount = 0;
  let deleteEpisodeCount = 0;

  //loop for each show
  for (const show of shows) {
    const allSeasons =  data.filter((item) => item.Type==='Season' && item.SeriesId===show.Id);
    const allEpisodes =data.filter((item) => item.Type==='Episode' && item.SeriesId===show.Id);

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

  refLog.loggedData.push({color: "dodgerblue",Message: `Seasons: ${insertSeasonsCount > 0 ? insertSeasonsCount : 0} Rows Inserted. ${updateSeasonsCount} Rows Updated.`});
  refLog.loggedData.push({color: "orange",Message: deleteSeasonsCount + " Seasons Removed.",});
  refLog.loggedData.push({color: "dodgerblue",Message: `Episodes: ${insertEpisodeCount > 0 ? insertEpisodeCount : 0} Rows Inserted. ${updateEpisodeCount} Rows Updated.`});
  refLog.loggedData.push({color: "orange",Message: deleteEpisodeCount + " Episodes Removed.",});
  refLog.loggedData.push({ color: "yellow", Message: "Sync Complete" });
 }catch(error)
 {
  refLog.loggedData.push({color: "red",Message:  getErrorLineNumber(error)+ ": Error: "+error,});
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
  const { rows: Items } = await db.query(`SELECT *	FROM public.jf_library_items where "Type" not in ('Series','Folder')`);
  const { rows: Episodes } = await db.query(`SELECT *	FROM public.jf_library_episodes`);

  let insertItemInfoCount = 0;
  let insertEpisodeInfoCount = 0;
  let updateItemInfoCount = 0;
  let updateEpisodeInfoCount = 0;

  let deleteItemInfoCount  = 0;
  let deleteEpisodeInfoCount = 0;

  const admins = await _sync.getAdminUser(refLog);
  const userid = admins[0].Id;
  //loop for each Movie
  for (const Item of Items) {
    const data = await _sync.getItemInfo(Item.Id,userid);

    const existingItemInfo = await db.query(`SELECT *	FROM public.jf_item_info where "Id" = '${Item.Id}'`).then((res) => res.rows.map((row) => row.Id));
    
    let ItemInfoToInsert = await data.map(item => jf_item_info_mapping(item, 'Item'));


    if (ItemInfoToInsert.length !== 0) {
      let result = await db.insertBulk("jf_item_info",ItemInfoToInsert,jf_item_info_columns);
      if (result.Result === "SUCCESS") {
        insertItemInfoCount +=ItemInfoToInsert.length- existingItemInfo.length;
        updateItemInfoCount+=existingItemInfo.length;

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


    let EpisodeInfoToInsert =  await data.map(item => jf_item_info_mapping(item, 'Episode'));
    //filter fix if jf_libraries is empty


    if (EpisodeInfoToInsert.length !== 0) {
      let result = await db.insertBulk("jf_item_info",EpisodeInfoToInsert,jf_item_info_columns);
      if (result.Result === "SUCCESS") {
        insertEpisodeInfoCount += EpisodeInfoToInsert.length-existingEpisodeItemInfo.length;
        updateEpisodeInfoCount+= existingEpisodeItemInfo.length;
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
    // console.log(Episode.Name) 
  }

  refLog.loggedData.push({color: "dodgerblue",Message: (insertItemInfoCount >0 ? insertItemInfoCount : 0) + " Item Info inserted. "+updateItemInfoCount +" Item Info Updated"});
  refLog.loggedData.push({color: "orange",Message: deleteItemInfoCount + " Item Info Removed.",});
  refLog.loggedData.push({color: "dodgerblue",Message: (insertEpisodeInfoCount > 0 ? insertEpisodeInfoCount:0) + " Episodes Info inserted. "+updateEpisodeInfoCount +" Episodes Info Updated"});
  refLog.loggedData.push({color: "orange",Message: deleteEpisodeInfoCount + " Episodes Info Removed.",});
  refLog.loggedData.push({ color: "lawngreen", Message: "Info Sync Complete" });
 }catch(error)
 {
  refLog.loggedData.push({color: "red",Message:  getErrorLineNumber(error)+ ": Error: "+error,});
  refLog.result='Failed';
 }
}

async function syncPlaybackPluginData()
{
  // socket.sendMessageToClients({ color: "lawngreen", Message: "Syncing... 5/5" });
  // socket.sendMessageToClients({color: "yellow", Message: "Beginning File Info Sync",});

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
      console.log(getErrorLineNumber(error)+ ": "+error);
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
  refLog.loggedData.push({color: "red",Message: getErrorLineNumber(error)+ ': Error:'+error,});
  refLog.loggedData.push({ color: "red", Message: getErrorLineNumber(error)+ ": Cleanup Failed with errors" });
  refLog.result='Failed';
 }

}

async function updateLibraryStatsData(refLog)
{
 try{
  refLog.loggedData.push({color: "yellow", Message: "Updating Library Stats",});

  await db.query('CALL ju_update_library_stats_data()');

  refLog.loggedData.push({color: "dodgerblue",Message: "Library Stats Updated.",});

 }catch(error)
 {
  refLog.loggedData.push({color: "red",Message: getErrorLineNumber(error)+ ': Error:'+error,});
  refLog.loggedData.push({ color: "red", Message: getErrorLineNumber(error)+ ": Stats update Failed with errors" });
  refLog.result='Failed';
 }

}


async function fullSync(taskType)
{
  try
  {
    let startTime = moment();
    let refLog={loggedData:[],result:'Success'};
  
    const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
    if (rows[0].JF_HOST === null || rows[0].JF_API_KEY === null) {
      res.send({ error: "Config Details Not Found" });
      refLog.loggedData.push({ Message: "Error: Config details not found!" });
      refLog.result='Failed';
      return;
    }
  
    const _sync = new sync(rows[0].JF_HOST, rows[0].JF_API_KEY);
  
    const admins = await _sync.getAdminUser(refLog);
    const userid = admins[0].Id;
    const libraries = await _sync.getItems('userid',userid,{recursive:false}); //getting all root folders aka libraries + items
    const data=[];

    //for each item in library run get item using that id as the ParentId (This gets the children of the parent id)
  for (let i = 0; i < libraries.length; i++) {
    const item = libraries[i];
    let libraryItems = await _sync.getItems('parentId',item.Id);
    const libraryItemsWithParent = libraryItems.map((items) => ({
      ...items,
      ...{ ParentId: item.Id },
    }));
    data.push(...libraryItemsWithParent);
  }
    const library_items=data.filter((item) => ['Movie','Audio','Series'].includes(item.Type));
    const seasons_and_episodes=data.filter((item) => ['Season','Episode'].includes(item.Type));

    await syncUserData(refLog);
  
    await syncLibraryFolders(refLog,libraries);
    await syncLibraryItems(refLog,library_items);
    await syncShowItems(refLog,seasons_and_episodes);
    await syncItemInfo(refLog);
    await updateLibraryStatsData(refLog);
    await removeOrphanedData(refLog);
    const uuid = randomUUID();
  
    let endTime = moment();
   
    let diffInSeconds = endTime.diff(startTime, 'seconds');
  
    const log=
    {
      "Id":uuid,
      "Name":"Jellyfin Sync",
      "Type":"Task",
      "ExecutionType":taskType,
      "Duration":diffInSeconds,
      "TimeRun":startTime,
      "Log":JSON.stringify(refLog.loggedData),
      "Result":refLog.result
  
    };
     logging.insertLog(log);
  
    
  }catch(error)
  {
    console.log(error);
  }
  

}


////////////////////////////////////////API Calls

///////////////////////////////////////Sync All
router.get("/beingSync", async (req, res) => {

  const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
  if (rows[0].JF_HOST === null || rows[0].JF_API_KEY === null) {
    res.send({ error: "Config Details Not Found" });
    return;
  }

  await fullSync('Manual');
  res.send();

});

///////////////////////////////////////Write Users
router.post("/fetchItem", async (req, res) => {
  try{
    const { itemId } = req.body;
    if(itemId===undefined)
    {
      res.status(400);
      res.send('The itemId field is required.');
    }

    const { rows:config } = await db.query('SELECT * FROM app_config where "ID"=1');
    const { rows:temp_lib_id } = await db.query('SELECT "Id" FROM jf_libraries limit 1');

    if (config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
      res.status(503);
      res.send({ error: "Config Details Not Found" });
      return;
    }
  
    const _sync = new sync(config[0].JF_HOST, config[0].JF_API_KEY);
    const admins = await _sync.getAdminUser();
    const userid = admins[0].Id;

    let item=await _sync.getItem(itemId);
    const libraryItemWithParent = item.map((items) => ({
      ...items,
      ...{ ParentId: temp_lib_id[0].Id },
    }));


    let item_info= await _sync.getItemInfo(itemId,userid);


    let itemToInsert = await libraryItemWithParent.map(jf_library_items_mapping);
    let itemInfoToInsert = await item_info.map(jf_item_info_mapping);

    if (itemToInsert.length !== 0) {
      let result = await db.insertBulk("jf_library_items",itemToInsert,jf_library_items_columns);
      if (result.Result === "SUCCESS") {
        let result_info = await db.insertBulk("jf_item_info",itemInfoToInsert,jf_item_info_columns);
        if (result_info.Result === "SUCCESS") {
          res.send('Item Synced');
        } else {
          res.status(500);
          res.send('Unable to insert Item Info: '+result_info.message);
        }
      } else {
        res.status(500);
        res.send('Unable to insert Item: '+result.message);
      }
    }else
    {
      res.status(404);
        res.send('Unable to find Item');
    }

  }catch(error)
  {
    // console.log(error);
    res.status(500);
    res.send(error);
  }
  
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
