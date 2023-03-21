const express = require("express");
const pgp = require("pg-promise")();
const db = require("./db");
const axios = require("axios");

const ws = require("./WebsocketHandler");
const sendMessageToClients = ws(8080);

const router = express.Router();

const {jf_libraries_columns,jf_libraries_mapping,} = require("./models/jf_libraries");
const {jf_library_items_columns,jf_library_items_mapping,} = require("./models/jf_library_items");
const {jf_library_seasons_columns,jf_library_seasons_mapping,} = require("./models/jf_library_seasons");
const {jf_library_episodes_columns,jf_library_episodes_mapping,} = require("./models/jf_library_episodes");

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
      console.log("getAdminUser: ", url);
      const response = await axios.get(url, {
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
      console.log("getAdminUser: ", url);
      const response = await axios.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.apiKey,
        },
      });
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
      const response = await axios.get(url, {
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
        return results;
      }
    } catch (error) {
      console.log(error);
      return [];
    }
  }
  async getSeasonsAndEpisodes(showId,userid) {
    const allSeasons = [];
    const allEpisodes = [];
    let seasonItems = await this.getItem(showId,userid);
    const seasonWithParent = seasonItems.map((items) => ({
      ...items,
      ...{ ParentId: showId },
    }));
    allSeasons.push(...seasonWithParent);
    for (let e = 0; e < seasonItems.length; e++) {
      const season = seasonItems[e];
      let episodeItems = await this.getItem(season.Id,userid);
      const episodeWithParent = episodeItems.map((items) => ({
        ...items,
        ...{ ParentId: season.Id },
      }));
      allEpisodes.push(...episodeWithParent);
    }

    return { allSeasons: allSeasons, allEpisodes: allEpisodes };
  }
}
////////////////////////////////////////API Methods

///////////////////////////////////////Write Users
router.get("/writeUsers", async (req, res) => {

  const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
  if (rows[0].JF_HOST === null || rows[0].JF_API_KEY === null) {
    res.send({ error: "Config Details Not Found" });
    sendMessageToClients({ Message: "Error: Config details not found!" });
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
      sendMessageToClients(dataToInsert.length + " Rows Inserted.");
    } else {
      sendMessageToClients({
        color: "red",
        Message: "Error performing bulk insert:" + result.message,
      });
    }
  }
  
  const toDeleteIds = existingIds.filter((id) =>!data.some((row) => row.Id === id ));
  if (toDeleteIds.length > 0) {
    let result = await db.deleteBulk("jf_users",toDeleteIds);
    if (result.Result === "SUCCESS") {
      sendMessageToClients(toDeleteIds.length + " Rows Removed.");
    } else {
      sendMessageToClients({color: "red",Message: result.message,});
    }
  
  }

  res.send();
});

///////////////////////////////////////writeLibraries
router.get("/writeLibraries", async (req, res) => {

  const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
  if (rows[0].JF_HOST === null || rows[0].JF_API_KEY === null) {
    res.send({ error: "Config Details Not Found" });
    sendMessageToClients({ Message: "Error: Config details not found!" });
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
      sendMessageToClients(dataToInsert.length + " Rows Inserted.");
    } else {
      sendMessageToClients({
        color: "red",
        Message: "Error performing bulk insert:" + result.message,
      });
    }
  }

  const toDeleteIds = existingIds.filter((id) =>!data.some((row) => row.Id === id ));
  if (toDeleteIds.length > 0) {
    let result = await db.deleteBulk("jf_libraries",toDeleteIds);
    if (result.Result === "SUCCESS") {
      sendMessageToClients(toDeleteIds.length + " Rows Removed.");
    } else {
      sendMessageToClients({color: "red",Message: result.message,});
    }
  
  } 

  res.send();

});

//////////////////////////////////////////////////////writeLibraryItems
router.get("/writeLibraryItems", async (req, res) => {

  const { rows: config } = await db.query('SELECT * FROM app_config where "ID"=1' );
  const { rows: cleanup } = await db.query('DELETE FROM jf_playback_activity where "NowPlayingItemId" not in (select "Id" from jf_library_items)' );
  sendMessageToClients({ color: "orange", Message: cleanup.length+" orphaned activity logs removed" });

  if (config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
    res.send({ error: "Config Details Not Found" });
    return;
  }

  const _sync = new sync(config[0].JF_HOST, config[0].JF_API_KEY);
  sendMessageToClients({ color: "lawngreen", Message: "Syncing... 1/2" });

  sendMessageToClients({color: "yellow",Message: "Beginning Library Item Sync",});

  const admins = await _sync.getAdminUser();
  const userid = admins[0].Id;
  const libraries = await _sync.getItem(undefined,userid);
  const data = [];
  let insertCounter = 0;
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

  if (existingIds.length === 0) {
    dataToInsert = await data.map(jf_library_items_mapping);
  } else {
    dataToInsert = await data
      .filter((row) => !existingIds.includes(row.Id))
      .map(jf_library_items_mapping);
  }


  if (dataToInsert.length !== 0) {
    let result = await db.insertBulk("jf_library_items",dataToInsert,jf_library_items_columns);
    if (result.Result === "SUCCESS") {
      insertCounter += dataToInsert.length;
    } else {
      sendMessageToClients({
        color: "red",
        Message: "Error performing bulk insert:" + result.message,
      });
    }
  }
  
  const toDeleteIds = existingIds.filter((id) =>!data.some((row) => row.Id === id ));
  if (toDeleteIds.length > 0) {
    let result = await db.deleteBulk("jf_library_items",toDeleteIds);
    if (result.Result === "SUCCESS") {
      deleteCounter +=toDeleteIds.length;
    } else {
      sendMessageToClients({color: "red",Message: result.message,});
    }
  } 
  
  sendMessageToClients({color: "dodgerblue",Message: insertCounter + " Library Items Inserted.",});
  sendMessageToClients({color: "orange",Message: deleteCounter + " Library Items Removed.",});
  sendMessageToClients({ color: "yellow", Message: "Item Sync Complete" });

  res.send();

});

//////////////////////////////////////////////////////writeSeasonsAndEpisodes
router.get("/writeSeasonsAndEpisodes", async (req, res) => {
  sendMessageToClients({ color: "lawngreen", Message: "Syncing... 2/2" });
  sendMessageToClients({color: "yellow", Message: "Beginning Seasons and Episode sync",});

  const { rows: config } = await db.query('SELECT * FROM app_config where "ID"=1');

  if (config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
    res.send({ error: "Config Details Not Found" });
    return;
  }

  const _sync = new sync(config[0].JF_HOST, config[0].JF_API_KEY);
  const { rows: shows } = await db.query(`SELECT *	FROM public.jf_library_items where "Type"='Series'`);

  let insertSeasonsCount = 0;
  let insertEpisodeCount = 0;
  let deleteSeasonsCount = 0;
  let deleteEpisodeCount = 0;

  const admins = await _sync.getAdminUser();
  const userid = admins[0].Id;
  //loop for each show
  for (const show of shows) {
    const data = await _sync.getSeasonsAndEpisodes(show.Id,userid);

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
        .then((res) => res.rows.map((row) => row.Id));
    }

    //

    let seasonsToInsert = [];
    let episodesToInsert = [];
    //filter fix if jf_libraries is empty

    if (existingIdsSeasons.length === 0) {
      // if there are no existing Ids in the table, map all items in the data array to the expected format
      seasonsToInsert = await data.allSeasons.map(jf_library_seasons_mapping);
    } else {
      // otherwise, filter only new data to insert
      seasonsToInsert = await data.allSeasons
        .filter((row) => !existingIdsSeasons.includes(row.Id))
        .map(jf_library_seasons_mapping);
    }

    if (existingIdsEpisodes.length === 0) {
      // if there are no existing Ids in the table, map all items in the data array to the expected format
      episodesToInsert = await data.allEpisodes.map(jf_library_episodes_mapping);
    } else {
      // otherwise, filter only new data to insert
      episodesToInsert = await data.allEpisodes.filter((row) => !existingIdsEpisodes.includes(row.Id + row.ParentId)).map(jf_library_episodes_mapping);
    }

    ///insert delete seasons
    //Bulkinsert new data not on db
    if (seasonsToInsert.length !== 0) {
      let result = await db.insertBulk("jf_library_seasons",seasonsToInsert,jf_library_seasons_columns);
      if (result.Result === "SUCCESS") {
        insertSeasonsCount += seasonsToInsert.length;
      } else {
        sendMessageToClients({
          color: "red",
          Message: "Error performing bulk insert:" + result.message,
        });
      }
    } 
    const toDeleteIds = existingIdsSeasons.filter((id) =>!data.allSeasons.some((row) => row.Id === id ));
    //Bulk delete from db thats no longer on api
    if (toDeleteIds.length > 0) {
      let result = await db.deleteBulk("jf_library_seasons",toDeleteIds);
      if (result.Result === "SUCCESS") {
        deleteSeasonsCount +=toDeleteIds.length;
      } else {
        sendMessageToClients({color: "red",Message: result.message,});
      }
    
    } 
    //insert delete episodes
    //Bulkinsert new data not on db
    if (episodesToInsert.length !== 0) {
      let result = await db.insertBulk("jf_library_episodes",episodesToInsert,jf_library_episodes_columns);
      if (result.Result === "SUCCESS") {
        insertEpisodeCount += episodesToInsert.length;
      } else {
        sendMessageToClients({
          color: "red",
          Message: "Error performing bulk insert:" + result.message,
        });
      }
    } 

    const toDeleteEpisodeIds = existingIdsEpisodes.filter((id) =>!data.allEpisodes.some((row) => (row.Id + row.ParentId) === id ));
    //Bulk delete from db thats no longer on api
    if (toDeleteEpisodeIds.length > 0) {
      let result = await db.deleteBulk("jf_library_episodes",toDeleteEpisodeIds);
      if (result.Result === "SUCCESS") {
        deleteEpisodeCount +=toDeleteEpisodeIds.length;
      } else {
        sendMessageToClients({color: "red",Message: result.message,});
      }
    
    } 


    
    sendMessageToClients({ Message: "Sync complete for " + show.Name });
  }

  sendMessageToClients({color: "dodgerblue",Message: insertSeasonsCount + " Seasons inserted.",});
  sendMessageToClients({color: "orange",Message: deleteSeasonsCount + " Seasons Removed.",});
  sendMessageToClients({color: "dodgerblue",Message: insertEpisodeCount + " Episodes inserted.",});
  sendMessageToClients({color: "orange",Message: deleteEpisodeCount + " Episodes Removed.",});
  sendMessageToClients({ color: "lawngreen", Message: "Sync Complete" });
  res.send();

});

//////////////////////////////////////

module.exports = router;
