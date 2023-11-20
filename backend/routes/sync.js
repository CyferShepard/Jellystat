const express = require("express");
const pgp = require("pg-promise")();
const db = require("../db");
const axios = require("axios");
const https = require('https');
const moment = require('moment');
const { randomUUID }  = require('crypto');

const { sendUpdate } = require('../ws');

const logging=require("./logging");
const taskName=require("../logging/taskName");
const triggertype=require("../logging/triggertype");

const agent = new https.Agent({
  rejectUnauthorized: (process.env.REJECT_SELF_SIGNED_CERTIFICATES || 'true').toLowerCase() ==='true'
});



const axios_instance = axios.create({
  httpsAgent: agent
});

const router = express.Router();

const {jf_libraries_columns,jf_libraries_mapping,} = require("../models/jf_libraries");
const {jf_library_items_columns,jf_library_items_mapping,} = require("../models/jf_library_items");
const {jf_library_seasons_columns,jf_library_seasons_mapping,} = require("../models/jf_library_seasons");
const {jf_library_episodes_columns,jf_library_episodes_mapping,} = require("../models/jf_library_episodes");
const {jf_item_info_columns,jf_item_info_mapping,} = require("../models/jf_item_info");
const {columnsPlaybackReporting,mappingPlaybackReporting}= require("../models/jf_playback_reporting_plugin_data");

const {jf_users_columns,jf_users_mapping,} = require("../models/jf_users");
const taskstate = require("../logging/taskstate");

let syncTask;
let PlaybacksyncTask;

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

        console.log("Invalid Response from Users API Call: "+response);
        return [];
      }

      const adminUser = response.data.filter(
        (user) => user.Policy.IsAdministrator === true
      );
      return adminUser || null;
    } catch (error) {
      console.log(error);
      syncTask.loggedData.push({ Message: "Error Getting AdminId: "+error});
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
            limit:increment,
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

  async getLibrariesFromApi() {
    try {


      let url = `${this.hostUrl}/Library/MediaFolders`;


      const response_data = await axios_instance.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.apiKey,
        },
      });

      const filtered_libraries = response_data.data.Items.filter(
        (type) => !["boxsets", "playlists"].includes(type.CollectionType)
      );



      return filtered_libraries;
    } catch (error) {
      // console.log(error);
      return [];
    }
  }


  async getItemsFromParent(key,id,params) {
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

  async getSeasons(SeriesId) {
    try {
      let url = `${this.hostUrl}/Shows/${SeriesId}/Seasons`;

      const response = await axios_instance.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.apiKey,
        },
      });

      const results = response.data.Items.filter((item) => item.LocationType !== "Virtual");
      return results;
    } catch (error) {
      console.log(error);
      return [];
    }
  }
  async getEpisodes(SeriesId,SeasonId) {
    try {
      let url = `${this.hostUrl}/Shows/${SeriesId}/Episodes?seasonId=${SeasonId}`;

      const response = await axios_instance.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.apiKey,
        },
      });

      const results = response.data.Items.filter((item) => item.LocationType !== "Virtual");
      return results;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getRecentlyAdded(userid,limit = 20, parentId) {
    try {
      let url = `${this.hostUrl}/Users/${userid}/Items/Latest?Limit=${limit}`;
      if(parentId && parentId!=null)
      {
        url+=`&ParentId=${parentId}`;
      }

      const response = await axios_instance.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.apiKey,
        },
      });


      const results = response.data.filter((item) => item.LocationType !== "Virtual");
      return results;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getExistingIDsforTable(tablename)
  {
    return  await db
      .query(`SELECT "Id" FROM ${tablename}`)
      .then((res) => res.rows.map((row) => row.Id));
  }

  async insertData(tablename,dataToInsert,column_mappings)
  {
    let result = await db.insertBulk(tablename,dataToInsert,column_mappings);
    if (result.Result === "SUCCESS") {
      syncTask.loggedData.push(dataToInsert.length + " Rows Inserted.");
    } else {
      syncTask.loggedData.push({
        color: "red",
        Message: "Error performing bulk insert:" + result.message,
      });
      throw new Error("Error performing bulk insert:" + result.message);
    }
  }

  async removeData(tablename,dataToRemove)
  {
    let result = await db.deleteBulk(tablename,dataToRemove);
    if (result.Result === "SUCCESS") {
      syncTask.loggedData.push(dataToRemove.length + " Rows Removed.");
    } else {
      syncTask.loggedData.push({color: "red",Message: "Error: "+result.message,});
      throw new Error("Error :" + result.message);
    }
  }

  async updateSingleFieldOnDB(tablename,dataToUpdate,field_name,field_value)
  {
    let result = await db.updateSingleFieldBulk(tablename,dataToUpdate,field_name,field_value);
    if (result.Result === "SUCCESS") {
      syncTask.loggedData.push(dataToUpdate.length + " Rows updated.");
    } else {
      syncTask.loggedData.push({color: "red",Message: "Error: "+result.message,});
      throw new Error("Error :" + result.message);
    }
  }
}
////////////////////////////////////////API Methods

async function syncUserData()
{
  sendUpdate(syncTask.wsKey,{type:"Update",message:"Syncing User Data"});
  const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');

  const _sync = new sync(rows[0].JF_HOST, rows[0].JF_API_KEY);

  const data = await _sync.getUsers();

  const existingIds = await _sync.getExistingIDsforTable('jf_users');// get existing user Ids from the db

  let dataToInsert = await data.map(jf_users_mapping);


  if (dataToInsert.length > 0) {
    await _sync.insertData("jf_users",dataToInsert,jf_users_columns);
  }

  const toDeleteIds = existingIds.filter((id) =>!data.some((row) => row.Id === id ));
  if (toDeleteIds.length > 0) {
    await _sync.removeData("jf_users",toDeleteIds);
  }

  //update usernames on log table where username does not match the user table
  await db.query('UPDATE jf_playback_activity a SET "UserName" = u."Name" FROM jf_users u WHERE u."Id" = a."UserId" AND u."Name" <> a."UserName"');

}

async function syncLibraryFolders(data,existing_excluded_libraries)
{
  sendUpdate(syncTask.wsKey,{type:"Update",message:"Syncing Library Folders"});
    const _sync = new sync();
    const existingIds = await _sync.getExistingIDsforTable('jf_libraries');// get existing library Ids from the db


    let dataToInsert = await data.map(jf_libraries_mapping);

    if (dataToInsert.length !== 0) {
      await _sync.insertData("jf_libraries",dataToInsert,jf_libraries_columns);
    }

    //archive libraries and items instead of deleting them

    const toArchiveLibraryIds = existingIds.filter((id) =>!data.some((row) => row.Id === id ));
    if (toArchiveLibraryIds.length > 0) {
      sendUpdate(syncTask.wsKey,{type:"Update",message:"Archiving old Library Data"});

      //dont archive items that exist on jellyfin but where marked as excluded in the config
      if(toArchiveLibraryIds.filter((id) => !existing_excluded_libraries.some((row) => row.Id === id )).length>0)
      {
        const ItemsToArchive=await db.query(`SELECT "Id" FROM jf_library_items where "ParentId" in (${toArchiveLibraryIds.filter((id) => !existing_excluded_libraries.some((row) => row.Id === id )).map(id => `'${id}'`).join(',')})`).then((res) => res.rows.map((row) => row.Id));
        if (ItemsToArchive.length > 0) {
          await _sync.updateSingleFieldOnDB("jf_library_items",ItemsToArchive,"archived",true);
        }

      }

      await _sync.updateSingleFieldOnDB("jf_libraries",toArchiveLibraryIds,"archived",true);

    }



}
async function syncLibraryItems(data)
{
  const _sync = new sync();
  const existingLibraryIds = await _sync.getExistingIDsforTable('jf_libraries');// get existing library Ids from the db

  syncTask.loggedData.push({ color: "lawngreen", Message: "Syncing... 1/4" });
  sendUpdate(syncTask.wsKey,{type:"Update",message:"Beginning Library Item Sync (1/4)"});
  syncTask.loggedData.push({color: "yellow",Message: "Beginning Library Item Sync",});

  data=data.filter((row) => existingLibraryIds.includes(row.ParentId));

  const existingIds = await _sync.getExistingIDsforTable('jf_library_items where archived=false');

  let dataToInsert = [];
  //filter fix if jf_libraries is empty

  dataToInsert = await data.map(jf_library_items_mapping);
  dataToInsert=dataToInsert.filter((item)=>item.Id !== undefined);
  if(syncTask.taskName===taskName.partialsync)
  {
    dataToInsert=dataToInsert.filter((item)=>!existingIds.includes(item.Id));
  }


  if (dataToInsert.length > 0) {
    await _sync.insertData("jf_library_items",dataToInsert,jf_library_items_columns);
  }

  syncTask.loggedData.push({color: "dodgerblue",Message: `${syncTask.taskName===taskName.partialsync ? dataToInsert.length : Math.max((dataToInsert.length-existingIds.length),0)} Rows Inserted. ${syncTask.taskName===taskName.partialsync ? 0 : existingIds.length} Rows Updated.`,});
  
  if(syncTask.taskName===taskName.fullsync)
  {
    let toArchiveIds = existingIds.filter((id) =>!data.some((row) => row.Id === id ));
  
    if (toArchiveIds.length > 0) {
      await _sync.updateSingleFieldOnDB("jf_library_items",toArchiveIds,"archived",true);
    }

    syncTask.loggedData.push({color: "orange",Message: toArchiveIds.length + " Library Items Archived.",});
  
  }



  syncTask.loggedData.push({ color: "yellow", Message: "Item Sync Complete" });
}

async function syncShowItems(data)
{

  syncTask.loggedData.push({ color: "lawngreen", Message: "Syncing... 2/4" });
  sendUpdate(syncTask.wsKey,{type:"Update",message:"Beginning Show Item Sync (2/4)"});
  syncTask.loggedData.push({color: "yellow", Message: "Beginning Seasons and Episode sync",});

  const { rows: shows } = await db.query(`SELECT *	FROM public.jf_library_items where "Type"='Series'`);


  let insertSeasonsCount = 0;
  let insertEpisodeCount = 0;
  let updateSeasonsCount = 0;
  let updateEpisodeCount = 0;


  //loop for each show
  for (const show of shows) {

    //get all seasons and episodes for this show from the data
    const allSeasons =  data.filter((item) => item.Type==='Season' && item.SeriesId===show.Id);
    const allEpisodes =data.filter((item) => item.Type==='Episode' && item.SeriesId===show.Id);

    if(allSeasons.length>0 || allEpisodes.length>0)
    {

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


    //for partial sync, dont overwrite existing data
    if(syncTask.taskName===taskName.partialsync)
    {
      seasonsToInsert=seasonsToInsert.filter((season) => !existingIdsSeasons.some((id) => id === season.Id));
      episodesToInsert=episodesToInsert.filter((episode) => !existingIdsEpisodes.some((id) => id === episode.EpisodeId ));
    }


    //Bulkinsert new data not on db
    if (seasonsToInsert.length !== 0) {
      let result = await db.insertBulk("jf_library_seasons",seasonsToInsert,jf_library_seasons_columns);
      if (result.Result === "SUCCESS") {
        insertSeasonsCount+= syncTask.taskName===taskName.partialsync ? seasonsToInsert.length : Math.max((seasonsToInsert.length-existingIdsSeasons.length),0);
        updateSeasonsCount+= syncTask.taskName===taskName.partialsync ? 0: existingIdsSeasons.length;
        } else {
        syncTask.loggedData.push({
          color: "red",
          Message: "Error performing bulk insert:" + result.message,
        });
        logging.updateLog(syncTask.uuid,syncTask.loggedData,taskstate.FAILED);
      }
    }


    //Bulkinsert new data not on db
    if (episodesToInsert.length !== 0) {
      let result = await db.insertBulk("jf_library_episodes",episodesToInsert,jf_library_episodes_columns);
      if (result.Result === "SUCCESS") {
        insertEpisodeCount+=syncTask.taskName===taskName.partialsync ? episodesToInsert.length : Math.max((episodesToInsert.length-existingIdsEpisodes.length),0);
        updateEpisodeCount+=syncTask.taskName===taskName.partialsync ? 0 :existingIdsEpisodes.length;
      } else {
        syncTask.loggedData.push({
          color: "red",
          Message: "Error performing bulk insert:" + result.message,
        });
        logging.updateLog(syncTask.uuid,syncTask.loggedData,taskstate.FAILED);
      }
    }

  }




  }

  syncTask.loggedData.push({color: "dodgerblue",Message: `Seasons: ${insertSeasonsCount} Rows Inserted. ${updateSeasonsCount} Rows Updated.`});
  syncTask.loggedData.push({color: "dodgerblue",Message: `Episodes: ${insertEpisodeCount} Rows Inserted. ${updateEpisodeCount} Rows Updated.`});
  syncTask.loggedData.push({ color: "yellow", Message: "Sync Complete" });
}

async function syncItemInfo(seasons_and_episodes,library_items)
{
  syncTask.loggedData.push({ color: "lawngreen", Message: "Syncing... 3/4" });
  sendUpdate(syncTask.wsKey,{type:"Update",message:"Beginning Item Info Sync (3/4)"});
  syncTask.loggedData.push({color: "yellow", Message: "Beginning File Info Sync",});

  const { rows: config } = await db.query('SELECT * FROM app_config where "ID"=1');

  const _sync = new sync(config[0].JF_HOST, config[0].JF_API_KEY);
  let Items=library_items.filter((item) => item.Type !== 'Series' && item.Type !== 'Folder' && item.Id !== undefined).map(jf_library_items_mapping);
  let Episodes=seasons_and_episodes.filter((item) => item.Type === 'Episode' && item.LocationType !== 'Virtual' && item.Id !== undefined).map(jf_library_episodes_mapping);
  


  if(syncTask.taskName===taskName.fullsync)
  {
    const { rows: _Items } = await db.query(`SELECT *	FROM public.jf_library_items where "Type" not in ('Series','Folder')`);
    const { rows: _Episodes } = await db.query(`SELECT *	FROM public.jf_library_episodes e join jf_library_items i on i."Id"=e."SeriesId" where i.archived=false`);
    Items=_Items;
    Episodes=_Episodes;
  }



  let insertItemInfoCount = 0;
  let insertEpisodeInfoCount = 0;
  let updateItemInfoCount = 0;
  let updateEpisodeInfoCount = 0;



  let userid=config[0].settings?.preferred_admin?.userid;

  if(!userid)
  {
    const admins = await _sync.getAdminUser();
    if(admins.length===0)
    {
      syncTask.loggedData.push({
        color: "red",
        Message: "Error fetching Admin ID (syncItemInfo)",
      });
      logging.updateLog(syncTask.uuid,syncTask.loggedData,taskstate.FAILED);
      throw new Error('Error fetching Admin ID (syncItemInfo)');
    }

    userid = admins[0].Id;
  }


  let current_item=0;
  let all_items=Items.length;
  //loop for each Movie
  for (const Item of Items) {
    current_item++;
    sendUpdate(syncTask.wsKey,{type:"Update",message:`Syncing Item Info ${((current_item/all_items)*100).toFixed(2)}%`});
    const existingItemInfo = await db.query(`SELECT *	FROM public.jf_item_info where "Id" = '${Item.Id}'`).then((res) => res.rows.map((row) => row.Id));

    if((existingItemInfo.length==0 && syncTask.taskName===taskName.partialsync) || syncTask.taskName===taskName.fullsync)
    {
      //dont update item info if it already exists and running a partial sync
      const data = await _sync.getItemInfo(Item.Id,userid);

    
    let ItemInfoToInsert = await data.map(item => jf_item_info_mapping(item, 'Item'));


    if (ItemInfoToInsert.length !== 0) {
      let result = await db.insertBulk("jf_item_info",ItemInfoToInsert,jf_item_info_columns);
      if (result.Result === "SUCCESS") {
        insertItemInfoCount +=ItemInfoToInsert.length- existingItemInfo.length;
        updateItemInfoCount+=existingItemInfo.length;

      } else {
        syncTask.loggedData.push({
          color: "red",
          Message: "Error performing bulk insert:" + result.message,
        });
        logging.updateLog(syncTask.uuid,syncTask.loggedData,taskstate.FAILED);
      }
    }
    }
    

  }

  let current_episode=0;
  let all_episodes=Episodes.length;
   //loop for each Episode
   for (const Episode of Episodes) {
    current_episode++;
    sendUpdate(syncTask.wsKey,{type:"Update",message:`Syncing Episode Info ${((current_episode/all_episodes)*100).toFixed(2)}%`});
    
    const existingEpisodeItemInfo = await db.query(`SELECT *	FROM public.jf_item_info where "Id" = '${Episode.EpisodeId}'`).then((res) => res.rows.map((row) => row.Id));

    if((existingEpisodeItemInfo.length==0 && syncTask.taskName===taskName.partialsync) ||syncTask.taskName===taskName.fullsync )
    {

      //dont update item info if it already exists and running a partial sync
      const episodedata = await _sync.getItemInfo(Episode.EpisodeId,userid);

      let EpisodeInfoToInsert =  await episodedata.map(item => jf_item_info_mapping(item, 'Episode'));
     
      //filter fix if jf_libraries is empty


      if (EpisodeInfoToInsert.length !== 0) {
        let result = await db.insertBulk("jf_item_info",EpisodeInfoToInsert,jf_item_info_columns);
        if (result.Result === "SUCCESS") {
          insertEpisodeInfoCount += EpisodeInfoToInsert.length-existingEpisodeItemInfo.length;
          updateEpisodeInfoCount+= existingEpisodeItemInfo.length;
        } else {
          syncTask.loggedData.push({
            color: "red",
            Message: "Error performing bulk insert:" + result.message,
          });
          logging.updateLog(syncTask.uuid,syncTask.loggedData,taskstate.FAILED);
        }
      }
    }
    

  }

  syncTask.loggedData.push({color: "dodgerblue",Message: (insertItemInfoCount >0 ? insertItemInfoCount : 0) + " Item Info inserted. "+updateItemInfoCount +" Item Info Updated"});
  syncTask.loggedData.push({color: "dodgerblue",Message: (insertEpisodeInfoCount > 0 ? insertEpisodeInfoCount:0) + " Episodes Info inserted. "+updateEpisodeInfoCount +" Episodes Info Updated"});
  syncTask.loggedData.push({ color: "yellow", Message: "Info Sync Complete" });
  sendUpdate(syncTask.wsKey,{type:"Update",message:"Info Sync Complete"});
}

async function removeOrphanedData()
{
  syncTask.loggedData.push({ color: "lawngreen", Message: "Syncing... 4/4" });
  sendUpdate(syncTask.wsKey,{type:"Update",message:"Cleaning up FileInfo/Episode/Season Records (4/4)"});
  syncTask.loggedData.push({color: "yellow", Message: "Removing Orphaned FileInfo/Episode/Season Records",});

  await db.query('CALL jd_remove_orphaned_data()');

  syncTask.loggedData.push({color: "dodgerblue",Message: "Orphaned FileInfo/Episode/Season Removed.",});

  syncTask.loggedData.push({ color: "Yellow", Message: "Sync Complete" });

}

async function syncPlaybackPluginData()
{
  PlaybacksyncTask.loggedData.push({ color: "lawngreen", Message: "Syncing..." });
  const { rows: config } = await db.query(
    'SELECT * FROM app_config where "ID"=1'
  );


  if(config.length===0)
  {
    PlaybacksyncTask.loggedData.push({ Message: "Error: Config details not found!" });
    logging.updateLog(PlaybacksyncTask.uuid,PlaybacksyncTask.loggedData,taskstate.FAILED);
    return;
  }

  const base_url = config[0]?.JF_HOST;
  const apiKey = config[0]?.JF_API_KEY;

  if (base_url === null || apiKey === null) {
    PlaybacksyncTask.loggedData.push({ Message: "Error: Config details not found!" });
    logging.updateLog(PlaybacksyncTask.uuid,PlaybacksyncTask.loggedData,taskstate.FAILED);
    return;
  }

  //Playback Reporting Plugin Check
  const pluginURL = `${base_url}/plugins`;

  const pluginResponse = await axios_instance.get(pluginURL,
  {
    headers: {
      "X-MediaBrowser-Token": apiKey,
    },
  });


  const hasPlaybackReportingPlugin=pluginResponse.data?.filter((plugins) => plugins?.ConfigurationFileName==='Jellyfin.Plugin.PlaybackReporting.xml');

  if(!hasPlaybackReportingPlugin || hasPlaybackReportingPlugin.length===0)
  {
    PlaybacksyncTask.loggedData.push({color: "lawngreen", Message: "Playback Reporting Plugin not detected. Skipping step.",});
    logging.updateLog(PlaybacksyncTask.uuid,PlaybacksyncTask.loggedData,taskstate.FAILED);
    return;
  }

  //

  PlaybacksyncTask.loggedData.push({color: "dodgerblue", Message: "Determining query constraints.",});
  const OldestPlaybackActivity = await db
  .query('SELECT  MIN("ActivityDateInserted") "OldestPlaybackActivity" FROM public.jf_playback_activity')
  .then((res) => res.rows[0]?.OldestPlaybackActivity);

  const MaxPlaybackReportingPluginID = await db
  .query('SELECT MAX(rowid) "MaxRowId" FROM jf_playback_reporting_plugin_data')
  .then((res) => res.rows[0]?.MaxRowId);


  //Query Builder
  let query=`SELECT rowid, * FROM PlaybackActivity`;

  if(OldestPlaybackActivity)
  {
    const formattedDateTime = moment(OldestPlaybackActivity).format('YYYY-MM-DD HH:mm:ss');

    query=query+` WHERE DateCreated < '${formattedDateTime}'`;

    if(MaxPlaybackReportingPluginID)
    {

      query=query+` AND rowid > ${MaxPlaybackReportingPluginID}`;

    }

  }else if(MaxPlaybackReportingPluginID)
  {
    query=query+` WHERE rowid > ${MaxPlaybackReportingPluginID}`;
  }

  query+=' order by rowid';

  PlaybacksyncTask.loggedData.push({color: "dodgerblue", Message: "Query built. Executing.",});
  //

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


  if (DataToInsert.length > 0) {
    PlaybacksyncTask.loggedData.push({color: "dodgerblue", Message: `Inserting ${DataToInsert.length} Rows.`,});
    let result=await db.insertBulk("jf_playback_reporting_plugin_data",DataToInsert,columnsPlaybackReporting);

    if (result.Result === "SUCCESS") {
      PlaybacksyncTask.loggedData.push({color: "dodgerblue", Message: `${DataToInsert.length} Rows have been inserted.`,});
      PlaybacksyncTask.loggedData.push({ color: "yellow", Message: "Running process to format data to be inserted into the Activity Table" });
      await db.query('CALL ji_insert_playback_plugin_data_to_activity_table()');
      PlaybacksyncTask.loggedData.push({color: "dodgerblue",Message: "Process complete. Data has been inserted.",});

    } else {

      PlaybacksyncTask.loggedData.push({color: "red",Message:  "Error: "+result.message,});
      logging.updateLog(PlaybacksyncTask.uuid,PlaybacksyncTask.loggedData,taskstate.FAILED);
    }


  }else
  {
    PlaybacksyncTask.loggedData.push({color: "dodgerblue", Message: `No new data to insert.`,});
  }


    PlaybacksyncTask.loggedData.push({color: "lawngreen", Message: `Playback Reporting Plugin Sync Complete`,});


}

async function updateLibraryStatsData()
{
  syncTask.loggedData.push({color: "yellow", Message: "Updating Library Stats",});

  await db.query('CALL ju_update_library_stats_data()');

  syncTask.loggedData.push({color: "dodgerblue",Message: "Library Stats Updated.",});

}


async function fullSync(triggertype)
{

  const uuid = randomUUID();
  syncTask={loggedData:[],uuid:uuid, wsKey:"FullSyncTask", taskName:taskName.fullsync};
  try
  {
    sendUpdate(syncTask.wsKey,{type:"Start",message:triggertype+" "+taskName.fullsync+" Started"});
    logging.insertLog(uuid,triggertype,taskName.fullsync);
    const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
    if (rows[0]?.JF_HOST === null || rows[0]?.JF_API_KEY === null) {
      syncTask.loggedData.push({ Message: "Error: Config details not found!" });
      logging.updateLog(syncTask.uuid,syncTask.loggedData,taskstate.FAILED);
      return;
    }

    const _sync = new sync(rows[0].JF_HOST, rows[0].JF_API_KEY);

    const libraries = await _sync.getLibrariesFromApi();
    if(libraries.length===0)
    {
      syncTask.loggedData.push({ Message: "Error: No Libararies found to sync." });
      logging.updateLog(syncTask.uuid,syncTask.loggedData,taskstate.FAILED);
      sendUpdate(syncTask.wsKey,{type:"Success",message:triggertype+" "+taskName.fullsync+" Completed"});
      return;
    }

    const excluded_libraries= rows[0].settings.ExcludedLibraries||[];

    const filtered_libraries=libraries.filter((library)=> !excluded_libraries.includes(library.Id));
    const existing_excluded_libraries=libraries.filter((library)=> excluded_libraries.includes(library.Id));

    const data=[];

    //for each item in library run get item using that id as the ParentId (This gets the children of the parent id)
  for (let i = 0; i < filtered_libraries.length; i++) {
    const item = filtered_libraries[i];
    sendUpdate(syncTask.wsKey,{type:"Update",message:"Fetching Data for Library : "+item.Name + ` (${(i+1)}/${filtered_libraries.length})`});
    let libraryItems = await _sync.getItemsFromParent('parentId',item.Id);
    sendUpdate(syncTask.wsKey,{type:"Update",message:"Mapping Data for Library : "+item.Name});
    const libraryItemsWithParent = libraryItems.map((items) => ({
      ...items,
      ...{ ParentId: item.Id },
    }));
    data.push(...libraryItemsWithParent);
    sendUpdate(syncTask.wsKey,{type:"Update",message:"Data Fetched for Library : "+item.Name});

  }
    const library_items=data.filter((item) => ['Movie','Audio','Series'].includes(item.Type));
    const seasons_and_episodes=data.filter((item) => ['Season','Episode'].includes(item.Type));


    //syncUserData
    await syncUserData();

    //syncLibraryFolders
    await syncLibraryFolders(filtered_libraries,existing_excluded_libraries);

    //syncLibraryItems
    await syncLibraryItems(library_items);

    //syncShowItems
    await syncShowItems(seasons_and_episodes);

    //syncItemInfo
    await syncItemInfo(seasons_and_episodes,library_items);

    //removeOrphanedData
    await removeOrphanedData();

    await updateLibraryStatsData();

    logging.updateLog(syncTask.uuid,syncTask.loggedData,taskstate.SUCCESS);

    sendUpdate(syncTask.wsKey,{type:"Success",message:triggertype+" Sync Completed"});


  }catch(error)
  {
    syncTask.loggedData.push({color: "red",Message: getErrorLineNumber(error)+ ": Error: "+error,});
    logging.updateLog(syncTask.uuid,syncTask.loggedData,taskstate.FAILED);
    sendUpdate(syncTask.wsKey,{type:"Error",message:triggertype+" Sync Halted with Errors"});
  }


}

async function partialSync(triggertype)
{
  const uuid = randomUUID();
  syncTask={loggedData:[],uuid:uuid, wsKey:"PartialSyncTask", taskName:taskName.partialsync};
  try
  {
    sendUpdate(syncTask.wsKey,{type:"Start",message:triggertype+" "+taskName.partialsync+" Started"});
    logging.insertLog(uuid,triggertype,taskName.partialsync);
    const { rows: config } = await db.query('SELECT * FROM app_config where "ID"=1');
    if (config[0]?.JF_HOST === null || config[0]?.JF_API_KEY === null) {
      syncTask.loggedData.push({ Message: "Error: Config details not found!" });
      logging.updateLog(syncTask.uuid,syncTask.loggedData,taskstate.FAILED);
      return;
    }

    const _sync = new sync(config[0].JF_HOST, config[0].JF_API_KEY);

    let userid=config[0].settings?.preferred_admin?.userid;

    if(!userid)
    {
      const admins = await _sync.getAdminUser();
      if(admins.length===0)
      {
        syncTask.loggedData.push({
          color: "red",
          Message: "Error fetching Admin ID (syncItemInfo)",
        });
        logging.updateLog(syncTask.uuid,syncTask.loggedData,taskstate.FAILED);
        throw new Error('Error fetching Admin ID (syncItemInfo)');
      }

      userid = admins[0].Id;
    }

    const libraries = await _sync.getLibrariesFromApi();
    if(libraries.length===0)
    {
      syncTask.loggedData.push({ Message: "Error: No Libararies found to sync." });
      logging.updateLog(syncTask.uuid,syncTask.loggedData,taskstate.FAILED);
      sendUpdate(syncTask.wsKey,{type:"Success",message:triggertype+" "+taskName.fullsync+" Completed"});
      return;
    }

    const excluded_libraries= config[0].settings.ExcludedLibraries||[];

    const filtered_libraries=libraries.filter((library)=> !excluded_libraries.includes(library.Id));
    const existing_excluded_libraries=libraries.filter((library)=> excluded_libraries.includes(library.Id));

    const data=[];

    //for each item in library run get item using that id as the ParentId (This gets the children of the parent id)
    for (let i = 0; i < filtered_libraries.length; i++) {
      const item = filtered_libraries[i];
      sendUpdate(syncTask.wsKey,{type:"Update",message:"Fetching Data for Library : "+item.Name + ` (${(i+1)}/${filtered_libraries.length})`});
      let recentlyAddedForLibrary = await _sync.getRecentlyAdded(userid,10,item.Id);

      sendUpdate(syncTask.wsKey,{type:"Update",message:"Mapping Data for Library : "+item.Name});
      const libraryItemsWithParent = recentlyAddedForLibrary.map((items) => ({
        ...items,
        ...{ ParentId: item.Id },
      }));
      data.push(...libraryItemsWithParent);
      sendUpdate(syncTask.wsKey,{type:"Update",message:"Data Fetched for Library : "+item.Name});

    }


    const library_items=data.filter((item) => ['Movie','Audio','Series'].includes(item.Type));

    for(const item of library_items.filter((item) => item.Type==='Series'))
    {
      let dataForShow = await _sync.getItemsFromParent('ParentId',item.Id);
      const seasons_and_episodes_for_show = dataForShow.filter((item) => ['Season','Episode'].includes(item.Type));
      data.push(...seasons_and_episodes_for_show);

    }


    const seasons_and_episodes=data.filter((item) => ['Season','Episode'].includes(item.Type));

  //   //syncUserData
    await syncUserData();

  //   //syncLibraryFolders
    await syncLibraryFolders(filtered_libraries,existing_excluded_libraries);

    //syncLibraryItems
    await syncLibraryItems(library_items);

    //syncShowItems
    await syncShowItems(seasons_and_episodes);

    //syncItemInfo
    await syncItemInfo(seasons_and_episodes,library_items);

    //removeOrphanedData
    await removeOrphanedData();

    await updateLibraryStatsData();

    logging.updateLog(syncTask.uuid,syncTask.loggedData,taskstate.SUCCESS);

    sendUpdate(syncTask.wsKey,{type:"Success",message:triggertype+" Sync Completed"});


  }catch(error)
  {
    syncTask.loggedData.push({color: "red",Message: getErrorLineNumber(error)+ ": Error: "+error,});
    logging.updateLog(syncTask.uuid,syncTask.loggedData,taskstate.FAILED);
    sendUpdate(syncTask.wsKey,{type:"Error",message:triggertype+" Sync Halted with Errors"});
  }

}


////////////////////////////////////////API Calls

///////////////////////////////////////Sync All
router.get("/beginSync", async (req, res) => {

  const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
  if (rows[0].JF_HOST === null || rows[0].JF_API_KEY === null) {
    res.send({ error: "Config Details Not Found" });
    return;
  }

  const last_execution=await db.query( `SELECT "Result"
  FROM public.jf_logging
  WHERE "Name"='${taskName.fullsync}'
  ORDER BY "TimeRun" DESC
  LIMIT 1`).then((res) => res.rows);

  if(last_execution.length!==0)
  {

    if(last_execution[0].Result ===taskstate.RUNNING)
    {
    sendUpdate("TaskError","Error: Sync is already running");
    res.send();
    return;
    }
  }


  await fullSync(triggertype.Manual);
  res.send();

});

router.get("/beginPartialSync", async (req, res) => {

  const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
  if (rows[0].JF_HOST === null || rows[0].JF_API_KEY === null) {
    res.send({ error: "Config Details Not Found" });
    return;
  }

  const last_execution=await db.query( `SELECT "Result"
  FROM public.jf_logging
  WHERE "Name"='${taskName.partialsync}'
  ORDER BY "TimeRun" DESC
  LIMIT 1`).then((res) => res.rows);

  if(last_execution.length!==0)
  {

    if(last_execution[0].Result ===taskstate.RUNNING)
    {
    sendUpdate("TaskError","Error: Sync is already running");
    res.send();
    return;
    }
  }


  await partialSync(triggertype.Manual);
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

    let userid=config[0].settings?.preferred_admin?.userid;

    if(!userid)
    {
      const admins = await _sync.getAdminUser();
      userid = admins[0].Id;
    }

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
  const uuid = randomUUID();
  PlaybacksyncTask={loggedData:[],uuid:uuid};
  try
  {
    logging.insertLog(uuid,triggertype.Manual,taskName.import);
    sendUpdate("PlaybackSyncTask",{type:"Start",message:"Playback Plugin Sync Started"});

    const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
    if (rows[0]?.JF_HOST === null || rows[0]?.JF_API_KEY === null) {
      res.send({ error: "Config Details Not Found" });
      PlaybacksyncTask.loggedData.push({ Message: "Error: Config details not found!" });
      logging.updateLog(uuid,PlaybacksyncTask.loggedData,taskstate.FAILED);
      return;
    }

    await sleep(5000);
    await syncPlaybackPluginData();

    logging.updateLog(PlaybacksyncTask.uuid,PlaybacksyncTask.loggedData,taskstate.SUCCESS);
    sendUpdate("PlaybackSyncTask",{type:"Success",message:"Playback Plugin Sync Completed"});
    res.send("syncPlaybackPluginData Complete");
  }catch(error)
  {
    PlaybacksyncTask.loggedData.push({color: "red",Message: getErrorLineNumber(error)+ ": Error: "+error,});
    logging.updateLog(PlaybacksyncTask.uuid,PlaybacksyncTask.loggedData,taskstate.FAILED);
    res.send("syncPlaybackPluginData Halted with Errors");
  }


});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

//////////////////////////////////////



module.exports =
{
  router,
  fullSync,
  partialSync,
};
