const express = require("express");
const pgp = require("pg-promise")();
const db = require("./db");
const axios = require("axios");

const ws = require("./WebsocketHandler");
const sendMessageToClients = ws(8080);

const router = express.Router();



/////////////////////////////////////////Functions
class sync {
  constructor(hostUrl, apiKey) {
    this.hostUrl = hostUrl;
    this.apiKey = apiKey;
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

  async getItem(itemID) {
    try {
      const admins = await this.getAdminUser();
      const userid = admins[0].Id;
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
          ["tvshows", "movies"].includes(type.CollectionType)
        );
      } else {
        return results;
      }
    } catch (error) {
      console.log(error);
      return [];
    }
  }
  async getSeasonsAndEpisodes(showId) {
    const allSeasons = [];
    const allEpisodes = [];

    let seasonItems = await this.getItem(showId);
    const seasonWithParent = seasonItems.map((items) => ({
      ...items,
      ...{ ParentId: showId },
    }));
    allSeasons.push(...seasonWithParent);
    for (let e = 0; e < seasonItems.length; e++) {
      const season = seasonItems[e];
      let episodeItems = await this.getItem(season.Id);
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

///////////////////////////////////////writeLibraries
router.get("/writeLibraries", async (req, res) => {
  let message = [];

  const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
  if (rows[0].JF_HOST === null || rows[0].JF_API_KEY === null) {
    res.send({ error: "Config Details Not Found" });
      sendMessageToClients({Message:"Error: Config details not found!" });
    return;
  }

  const _sync = new sync(rows[0].JF_HOST, rows[0].JF_API_KEY);
  const data = await _sync.getItem(); //getting all root folders aka libraries

  const columns = [
    "Id",
    "Name",
    "ServerId",
    "IsFolder",
    "Type",
    "CollectionType",
    "ImageTagsPrimary",
  ]; // specify the columns to insert into

  const existingIds = await db
    .query('SELECT "Id" FROM jf_libraries')
    .then((res) => res.rows.map((row) => row.Id)); // get existing library Ids from the db

  //data mapping
  const mapping = (item) => ({
    Id: item.Id,
    Name: item.Name,
    ServerId: item.ServerId,
    IsFolder: item.IsFolder,
    Type: item.Type,
    CollectionType: item.CollectionType,
    ImageTagsPrimary:
      item.ImageTags && item.ImageTags.Primary ? item.ImageTags.Primary : null,
  });
  let dataToInsert = [];
  //filter fix if jf_libraries is empty

  if (existingIds.length === 0) {
    // if there are no existing Ids in the table, map all items in the data array to the expected format
    dataToInsert = await data.map(mapping);
  } else {
    // otherwise, filter only new data to insert
    dataToInsert = await data
      .filter((row) => !existingIds.includes(row.Id))
      .map(mapping);
  }

  //Bulkinsert new data not on db
  if (dataToInsert.length !== 0) {
    //insert new
    await (async () => {
      try {
        await db.query("BEGIN");

        const query = pgp.helpers.insert(dataToInsert, columns, "jf_libraries");
        await db.query(query);

        await db.query("COMMIT");
        message.push({
          Type: "Success",
          Message: dataToInsert.length + " Rows Inserted.",
        });
        sendMessageToClients(dataToInsert.length + " Rows Inserted.");
      } catch (error) {
        await db.query("ROLLBACK");
        message.push({
          Type: "Error",
          Message: "Error performing bulk insert:" + error,
        });
        sendMessageToClients({Message:"Error performing bulk insert:" + error});
      }
    })();
  } else {
    message.push({ Type: "Success", Message: "No new data to bulk insert" });
    sendMessageToClients({Message:"No new data to bulk insert"});
  }
  //Bulk delete from db thats no longer on api
  if (existingIds.length > data.length) {
    await (async () => {
      try {
        await db.query("BEGIN");

        const AllIds = data.map((row) => row.Id);

        const deleteQuery = {
          text: `DELETE FROM jf_libraries WHERE "Id" NOT IN (${pgp.as.csv(
            AllIds
          )})`,
        };
        const queries = [deleteQuery];
        for (let query of queries) {
          await db.query(query);
        }

        await db.query("COMMIT");

        message.push({
          Type: "Success",
          Message: existingIds.length - data.length + " Rows Removed.",
        });
        sendMessageToClients(existingIds.length - data.length + " Rows Removed.");
      } catch (error) {
        await db.query("ROLLBACK");

        message.push({
          Type: "Error",
          Message: "Error performing bulk removal:" + error,
        });
        sendMessageToClients({Message:"Error performing bulk removal:" + error});
      }
    })();
  } else {
    message.push({ Type: "Success", Message: "No new data to bulk delete" });
    sendMessageToClients({Message:"No new data to bulk delete"});
  }
  //Sent logs


  res.send(message);

  console.log(`ENDPOINT CALLED: /writeLibraries: `);
});

//////////////////////////////////////////////////////writeLibraryItems
router.get("/writeLibraryItems", async (req, res) => {
  let message = [];
  const { rows: config } = await db.query(
    'SELECT * FROM app_config where "ID"=1'
  );
  if (config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
    res.send({ error: "Config Details Not Found" });
    return;
  }

  const _sync = new sync(config[0].JF_HOST, config[0].JF_API_KEY);

  //Get all Library items
  //gets all libraries
  const libraries = await _sync.getItem();
  const data = [];
  //for each item in library run get item using that id as the ParentId (This gets the children of the parent id)
  for (let i = 0; i < libraries.length; i++) {
    const item = libraries[i];
    let libraryItems = await _sync.getItem(item.Id);
    const libraryItemsWithParent = libraryItems.map((items) => ({
      ...items,
      ...{ ParentId: item.Id },
    }));
    data.push(...libraryItemsWithParent);
  }

  /////////////////////

  const existingIds = await db
    .query('SELECT "Id" FROM jf_library_items')
    .then((res) => res.rows.map((row) => row.Id));

  //Mappings to store data in DB
  const columns = [
    "Id",
    "Name",
    "ServerId",
    "PremiereDate",
    "EndDate",
    "CommunityRating",
    "RunTimeTicks",
    "ProductionYear",
    "IsFolder",
    "Type",
    "Status",
    "ImageTagsPrimary",
    "ImageTagsBanner",
    "ImageTagsLogo",
    "ImageTagsThumb",
    "BackdropImageTags",
    "ParentId",
  ]; // specify the columns to insert into

  //data mapping
  const mapping = (item) => ({
    Id: item.Id,
    Name: item.Name,
    ServerId: item.ServerId,
    PremiereDate: item.PremiereDate,
    EndDate: item.EndDate,
    CommunityRating: item.CommunityRating,
    RunTimeTicks: item.RunTimeTicks,
    ProductionYear: item.ProductionYear,
    IsFolder: item.IsFolder,
    Type: item.Type,
    Status: item.Status,
    ImageTagsPrimary:
      item.ImageTags && item.ImageTags.Primary ? item.ImageTags.Primary : null,
    ImageTagsBanner:
      item.ImageTags && item.ImageTags.Banner ? item.ImageTags.Banner : null,
    ImageTagsLogo:
      item.ImageTags && item.ImageTags.Logo ? item.ImageTags.Logo : null,
    ImageTagsThumb:
      item.ImageTags && item.ImageTags.Thumb ? item.ImageTags.Thumb : null,
    BackdropImageTags: item.BackdropImageTags[0],
    ParentId: item.ParentId,
  });
  let dataToInsert = [];
  //filter fix if jf_libraries is empty

  if (existingIds.length === 0) {
    // if there are no existing Ids in the table, map all items in the data array to the expected format
    dataToInsert = await data.map(mapping);
  } else {
    // otherwise, filter only new data to insert
    dataToInsert = await data
      .filter((row) => !existingIds.includes(row.Id))
      .map(mapping);
  }

  //Bulkinsert new data not on db
  if (dataToInsert.length !== 0) {
    //insert new
    await (async () => {
      try {
        await db.query("BEGIN");

        const query = pgp.helpers.insert(
          dataToInsert,
          columns,
          "jf_library_items"
        );
        await db.query(query);

        await db.query("COMMIT");
        message.push({
          Type: "Success",
          Message: dataToInsert.length + " Rows Inserted.",
        });
      } catch (error) {
        await db.query("ROLLBACK");
        message.push({
          Type: "Error",
          Message: "Error performing bulk insert:" + error,
        });
      }
    })();
  } else {
    message.push({ Type: "Success", Message: "No new data to bulk insert" });
  }
  //Bulk delete from db thats no longer on api
  if (existingIds.length > data.length) {
    await (async () => {
      try {
        await db.query("BEGIN");

        const AllIds = data.map((row) => row.Id);

        const deleteQuery = {
          text: `DELETE FROM jf_library_items WHERE "Id" NOT IN (${pgp.as.csv(
            AllIds
          )})`,
        };
        const queries = [deleteQuery];
        for (let query of queries) {
          await db.query(query);
        }

        await db.query("COMMIT");

        message.push({
          Type: "Success",
          Message: existingIds.length - data.length + " Rows Removed.",
        });
      } catch (error) {
        await db.query("ROLLBACK");

        message.push({
          Type: "Error",
          Message: "Error performing bulk removal:" + error,
        });
      }
    })();
  } else {
    message.push({ Type: "Success", Message: "No new data to bulk delete" });
  }
  //Sent logs

  res.send(message);

  console.log(`ENDPOINT CALLED: /writeLibraryItems: `);
});

//////////////////////////////////////////////////////writeSeasonsAndEpisodes
router.get("/writeSeasonsAndEpisodes", async (req, res) => {
  sendMessageToClients({color:'yellow',Message:"Beginning Seasons and Episode sync"});
  const message = [];
  const { rows: config } = await db.query(
    'SELECT * FROM app_config where "ID"=1'
  );
  if (config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
    res.send({ error: "Config Details Not Found" });
    return;
  }

  const _sync = new sync(config[0].JF_HOST, config[0].JF_API_KEY);
  const { rows: shows } = await db.query(
    `SELECT *	FROM public.jf_library_items where "Type"='Series'`
  );

  //loop for each show
  for (const show of shows) {
    const data = await _sync.getSeasonsAndEpisodes(show.Id);

    //
    //get existing seasons and episodes
    console.log(show.Id);
    const existingIdsSeasons = await db
      .query(
        `SELECT *	FROM public.jf_library_seasons where "SeriesId" = '${show.Id}'`
      )
      .then((res) => res.rows.map((row) => row.Id));

    let existingIdsEpisodes = [];
    if (existingIdsSeasons.length > 0) {
      existingIdsEpisodes = await db
        .query(
          `SELECT * FROM public.jf_library_episodes WHERE "SeasonId" IN (${existingIdsSeasons
            .filter((seasons) => seasons !== "")
            .map((seasons) => pgp.as.value(seasons))
            .map((value) => "'" + value + "'")
            .join(", ")})`
        )
        .then((res) => res.rows.map((row) => row.Id));
    }

    //Mappings to store data in DB
    const columnSeasons = [
      "Id",
      "Name",
      "ServerId",
      "IndexNumber",
      "Type",
      "ParentLogoItemId",
      "ParentBackdropItemId",
      "ParentBackdropImageTags",
      "SeriesName",
      "SeriesId",
      "SeriesPrimaryImageTag",
    ]; // specify the columns to insert into
    const columnEpisodes = [
      "Id",
      "EpisodeId",
      "Name",
      "ServerId",
      "PremiereDate",
      "OfficialRating",
      "CommunityRating",
      "RunTimeTicks",
      "ProductionYear",
      "IndexNumber",
      "ParentIndexNumber",
      "Type",
      "ParentLogoItemId",
      "ParentBackdropItemId",
      "ParentBackdropImageTags",
      "SeriesId",
      "SeasonId",
      "SeasonName",
      "SeriesName",
    ]; // specify the columns to insert into

    //data mapping
    const seasonsmapping = (item) => ({
      Id: item.Id,
      Name: item.Name,
      ServerId: item.ServerId,
      IndexNumber: item.IndexNumber,
      Type: item.Type,
      ParentLogoItemId: item.ParentLogoItemId,
      ParentBackdropItemId: item.ParentBackdropItemId,
      ParentBackdropImageTags:
        item.ParentBackdropImageTags !== undefined
          ? item.ParentBackdropImageTags[0]
          : null,
      SeriesName: item.SeriesName,
      SeriesId: item.ParentId,
      SeriesPrimaryImageTag: item.SeriesPrimaryImageTag,
    });

    const episodemapping = (item) => ({
      Id: item.Id + item.ParentId,
      EpisodeId: item.Id,
      Name: item.Name,
      ServerId: item.ServerId,
      PremiereDate: item.PremiereDate,
      OfficialRating: item.OfficialRating,
      CommunityRating: item.CommunityRating,
      RunTimeTicks: item.RunTimeTicks,
      ProductionYear: item.ProductionYear,
      IndexNumber: item.IndexNumber,
      ParentIndexNumber: item.ParentIndexNumber,
      Type: item.Type,
      ParentLogoItemId: item.ParentLogoItemId,
      ParentBackdropItemId: item.ParentBackdropItemId,
      ParentBackdropImageTags:
        item.ParentBackdropImageTags !== undefined
          ? item.ParentBackdropImageTags[0]
          : null,
      SeriesId: item.SeriesId,
      SeasonId: item.ParentId,
      SeasonName: item.SeasonName,
      SeriesName: item.SeriesName,
    });

    //

    let seasonsToInsert = [];
    let episodesToInsert = [];
    //filter fix if jf_libraries is empty

    if (existingIdsSeasons.length === 0) {
      // if there are no existing Ids in the table, map all items in the data array to the expected format
      seasonsToInsert = await data.allSeasons.map(seasonsmapping);
    } else {
      // otherwise, filter only new data to insert
      seasonsToInsert = await data.allSeasons
        .filter((row) => !existingIdsSeasons.includes(row.Id))
        .map(seasonsmapping);
    }

    if (existingIdsEpisodes.length === 0) {
      // if there are no existing Ids in the table, map all items in the data array to the expected format
      episodesToInsert = await data.allEpisodes.map(episodemapping);
    } else {
      // otherwise, filter only new data to insert
      episodesToInsert = await data.allEpisodes
        .filter((row) => !existingIdsEpisodes.includes(row.Id + row.ParentId))
        .map(episodemapping);
    }

    ///insert delete seasons
    //Bulkinsert new data not on db
    if (seasonsToInsert.length !== 0) {
      //insert new
      await (async () => {
        try {
          await db.query("BEGIN");

          const query = pgp.helpers.insert(
            seasonsToInsert,
            columnSeasons,
            "jf_library_seasons"
          );
          await db.query(query);

          await db.query("COMMIT");
          message.push({
            Type: "Success",
            Message: seasonsToInsert.length + " Rows Inserted for " + show.Name,
            ItemId: show.Id,
            TableName: "jf_library_seasons",
          });
          sendMessageToClients({color:'cornflowerblue',Message:seasonsToInsert.length + " Rows Inserted for " + show.Name});
        } catch (error) {
          await db.query("ROLLBACK");
          message.push({
            Type: "Error",
            Message: "Error performing bulk insert:" + error,
            ItemId: show.Id,
            TableName: "jf_library_seasons",
          });
          sendMessageToClients({color:'red',Message:"Error performing bulk insert:" + error});
        }
      })();
    } else {
      message.push({
        Type: "Success",
        Message: "No new data to bulk insert for " + show.Name,
        ItemId: show.Id,
        TableName: "jf_library_seasons",
      });
      sendMessageToClients({Message:"No new data to bulk insert for " + show.Name});
    }
    //Bulk delete from db thats no longer on api
    if (existingIdsSeasons.length > data.allSeasons.length) {
      await (async () => {
        try {
          await db.query("BEGIN");

          const AllIds = data.allSeasons.map((row) => row.Id);

          const deleteQuery = {
            text: `DELETE FROM jf_library_seasons WHERE "Id" NOT IN (${pgp.as.csv(
              AllIds
            )})`,
          };
          const queries = [deleteQuery];
          for (let query of queries) {
            await db.query(query);
          }

          await db.query("COMMIT");

          message.push({
            Type: "Success",
            Message:
              existingIdsSeasons.length -
              data.allSeasons.length +
              " Rows Removed for " +
              show.Name,
            ItemId: show.Id,
            TableName: "jf_library_seasons",
          });
          sendMessageToClients({color:'orange',Message:existingIdsSeasons.length -data.allSeasons.length +" Rows Removed for " +show.Name});
        } catch (error) {
          await db.query("ROLLBACK");

          message.push({
            Type: "Error",
            Message: "Error performing bulk removal:" + error,
            ItemId: show.Id,
            TableName: "jf_library_seasons",
          });
          sendMessageToClients({color:'red',Message:"Error performing bulk removal:" + error});
        }
      })();
    } else {
      message.push({
        Type: "Success",
        Message: "No new data to bulk delete for " + show.Name,
        ItemId: show.Id,
        TableName: "jf_library_seasons",
      });
      sendMessageToClients({Message:"No new data to bulk delete for " + show.Name});
    }
    //insert delete episodes
    //Bulkinsert new data not on db
    if (episodesToInsert.length !== 0) {
      //insert new
      await (async () => {
        try {
          await db.query("BEGIN");

          const query = pgp.helpers.insert(
            episodesToInsert,
            columnEpisodes,
            "jf_library_episodes"
          );
          await db.query(query);

          await db.query("COMMIT");
          message.push({
            Type: "Success",
            Message:
              episodesToInsert.length + " Rows Inserted for " + show.Name,
            ItemId: show.Id,
            TableName: "jf_library_episodes",
          });
          sendMessageToClients({color:'cornflowerblue',Message:episodesToInsert.length + " Rows Inserted for " + show.Name});
        } catch (error) {
          await db.query("ROLLBACK");
          message.push({
            Type: "Error",
            Message: "Error performing bulk insert:" + error,
            ItemId: show.Id,
            TableName: "jf_library_episodes",
          });
          sendMessageToClients({color:'red',Message:"Error performing bulk insert:" + error});
        }
      })();
    } else {
      message.push({
        Type: "Success",
        Message: "No new data to bulk insert for " + show.Name,
        ItemId: show.Id,
        TableName: "jf_library_episodes",
      });
      sendMessageToClients({Message:"No new data to bulk insert for " + show.Name});
    }
    //Bulk delete from db thats no longer on api
    if (existingIdsEpisodes.length > data.allEpisodes.length) {
      await (async () => {
        try {
          await db.query("BEGIN");

          const AllIds = data.allEpisodes.map((row) => row.Id + row.ParentId);

          const deleteQuery = {
            text: `DELETE FROM jf_library_episodes WHERE "Id" NOT IN (${pgp.as.csv(
              AllIds
            )})`,
          };
          const queries = [deleteQuery];
          for (let query of queries) {
            await db.query(query);
          }

          await db.query("COMMIT");

          message.push({
            Type: "Success",
            Message:
              existingIdsEpisodes.length -
              data.allEpisodes.length +
              " Rows Removed for " +
              show.Name,
            ItemId: show.Id,
            TableName: "jf_library_episodes",
          });
          sendMessageToClients({color:'orange',Message: existingIdsEpisodes.length - data.allEpisodes.length + " Rows Removed for " + show.Name});
        } catch (error) {
          await db.query("ROLLBACK");

          message.push({
            Type: "Error",
            Message: "Error performing bulk removal:" + error,
            ItemId: show.Id,
            TableName: "jf_library_episodes",
          });
          sendMessageToClients({color:'red',Message:"Error performing bulk removal:" + error});
        }
      })();
    } else {
      message.push({
        Type: "Success",
        Message: "No new data to bulk delete for " + show.Name,
        ItemId: show.Id,
        TableName: "jf_library_episodes",
      });
      sendMessageToClients({Message:"No new data to bulk delete for " + show.Name});
    }
  }
  sendMessageToClients({color:'lightgreen',Message:"Sync Complete"});
  res.send(message);

  console.log(`ENDPOINT CALLED: /writeSeasonsAndEpisodes: `);
});

//////////////////////////////////////

module.exports = router;
