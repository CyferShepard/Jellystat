// api.js
const express = require('express');
const pgp = require('pg-promise')();
const db = require('./db');

const router = express.Router();

router.get('/test', async (req, res) => {
  console.log(`ENDPOINT CALLED: /test`);
  res.send('Backend Responded Succesfully');
});

router.get('/getconfig', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
  console.log(`ENDPOINT CALLED: /getconfig: ` + rows);
  // console.log(`ENDPOINT CALLED: /setconfig: `+rows.length);
  res.send(rows);

});

router.post('/setconfig', async (req, res) => {
  const { JF_HOST, JF_API_KEY } = req.body;

  const { rows } = await db.query('UPDATE app_config SET "JF_HOST"=$1, "JF_API_KEY"=$2 where "ID"=1', [JF_HOST, JF_API_KEY]);
  console.log({ JF_HOST: JF_HOST, JF_API_KEY: JF_API_KEY });
  res.send(rows);


  console.log(`ENDPOINT CALLED: /setconfig: `);

});


router.get('/getAllFromJellyfin', async (req, res) => {

  const sync = require('./sync');
  const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
  if (rows[0].JF_HOST === null || rows[0].JF_API_KEY === null) {
    res.send({ error: 'Config Details Not Found' });
    return;
  }

  const _sync = new sync(rows[0].JF_HOST, rows[0].JF_API_KEY);
  const results = await _sync.getAllItems();

  res.send(results);



  console.log(`ENDPOINT CALLED: /getAllFromJellyfin: `);

});
router.get('/getShows', async (req, res) => {

  const sync = require('./sync');
  const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
  if (rows[0].JF_HOST === null || rows[0].JF_API_KEY === null) {
    res.send({ error: 'Config Details Not Found' });
    return;
  }

  const _sync = new sync(rows[0].JF_HOST, rows[0].JF_API_KEY);
  const results = await _sync.getShows();

  res.send(results);



  console.log(`ENDPOINT CALLED: /getShows: `);

});

router.get('/writeAllShows', async (req, res) => {

  const sync = require('./sync');
  const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
  if (rows[0].JF_HOST === null || rows[0].JF_API_KEY === null) {
    res.send({ error: 'Config Details Not Found' });
    return;
  }

  const _sync = new sync(rows[0].JF_HOST, rows[0].JF_API_KEY);
  const data = await _sync.getShows();
  const existingIds = await db.query('SELECT "Id" FROM jf_library_shows').then(res => res.rows.map(row => row.Id));


  const columns = ['Id', 'Name', 'ServerId', 'PremiereDate', 'EndDate', 'CommunityRating', 'RunTimeTicks', 'ProductionYear', 'IsFolder', 'Type', 'Status', 'ImageTagsPrimary', 'ImageTagsBanner', 'ImageTagsLogo', 'ImageTagsThumb', 'BackdropImageTags', 'ParentId']; // specify the columns to insert into

  const dataToInsert = data.filter(row => !existingIds.includes(row.Id)).map(item => ({
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
    ImageTagsPrimary: item.ImageTags && item.ImageTags.Primary ? item.ImageTags.Primary : null,
    ImageTagsBanner: item.ImageTags && item.ImageTags.Banner ? item.ImageTags.Banner : null,
    ImageTagsLogo: item.ImageTags && item.ImageTags.Logo ? item.ImageTags.Logo : null,
    ImageTagsThumb: item.ImageTags && item.ImageTags.Thumb ? item.ImageTags.Thumb : null,
    BackdropImageTags: item.BackdropImageTags[0],
    ParentId: item.ParentId
  }));

  if(!dataToInsert || dataToInsert.length==0)
  {
    res.send(('No new shows to insert'));
    return;
  }


  (async () => {
    // const client = await pool.connect();

    try {
      await db.query('BEGIN');

      const query = pgp.helpers.insert(dataToInsert, columns, 'jf_library_shows');
      await db.query(query);

      await db.query('COMMIT');
      console.log('Bulk insert successful');
      res.send('Bulk insert successful');
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error performing bulk insert:', error);
      res.send(('Error performing bulk insert:', error));
    }
  })();



  console.log(`ENDPOINT CALLED: /getShows: `);

});

router.get('/getSeasonsAndEpisodes', async (req, res) => {

  const sync = require('./sync');
  const results=[];
  const { rows:config } = await db.query('SELECT * FROM app_config where "ID"=1');
  if (config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
    res.send({ error: 'Config Details Not Found' });
    return;
  }

  const { rows:shows } = await db.query('SELECT * FROM jf_library_shows');
  const _sync = new sync(config[0].JF_HOST, config[0].JF_API_KEY);

  if (shows && shows.length > 0) {
    for (const show of shows) {
      const data = await _sync.getSeasonsAndEpisodes(show.Id);
      results.push(data);
     
    }

  } else {
    console.log("No shows found.");
    results.push({Status:'Error',Message:'No shows found.'});

  }




  res.send(results);

  console.log(`ENDPOINT CALLED: /writeSeasonsAndEpisodes: `);

});


router.get('/writeSeasonsAndEpisodes', async (req, res) => {

  const sync = require('./sync');
  const results=[];
  const { rows:config } = await db.query('SELECT * FROM app_config where "ID"=1');
  if (config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
    res.send({ error: 'Config Details Not Found' });
    return;
  }

  const { rows:shows } = await db.query('SELECT * FROM jf_library_shows');
  const _sync = new sync(config[0].JF_HOST, config[0].JF_API_KEY);

  if (shows && shows.length > 0) {
    for (const show of shows) {
      const data = await _sync.getSeasonsAndEpisodes(show.Id);
      const columnSeasons = ['Id', 'Name', 'ServerId', 'IndexNumber', 'Type', 'ParentLogoItemId', 'ParentBackdropItemId', 'ParentBackdropImageTags', 'SeriesName', 'SeriesId', 'SeriesPrimaryImageTag']; // specify the columns to insert into
      const columnEpisodes = ['Id', 'EpisodeId', 'Name', 'ServerId', 'PremiereDate', 'OfficialRating', 'CommunityRating', 'RunTimeTicks', 'ProductionYear', 'IndexNumber', 'ParentIndexNumber', 'Type', 'ParentLogoItemId', 'ParentBackdropItemId', 'ParentBackdropImageTags', 'SeriesId', 'SeasonId', 'SeasonName', 'SeriesName']; // specify the columns to insert into

      const existingSeasons = await db.query('SELECT "Id" FROM jf_library_seasons').then(res => res.rows.map(row => row.Id));
      const existingEpisodes = await db.query('SELECT "Id" FROM jf_library_episodes').then(res => res.rows.map(row => row.Id));

      const seasonsToInsert = await data.allSeasons.filter(row => !existingSeasons.includes(row.Id)).map(item => ({
        Id: item.Id,
        Name: item.Name,
        ServerId: item.ServerId,
        IndexNumber: item.IndexNumber,
        Type: item.Type,
        ParentLogoItemId: item.ParentLogoItemId,
        ParentBackdropItemId: item.ParentBackdropItemId,
        ParentBackdropImageTags: item.ParentBackdropImageTags!==undefined ? item.ParentBackdropImageTags[0] : null,
        SeriesName: item.SeriesName,
        SeriesId: item.ParentId,
        SeriesPrimaryImageTag: item.SeriesPrimaryImageTag
      }));

      const episodesToInsert =await data.allEpisodes.filter(row => !existingEpisodes.includes((row.Id+row.ParentId))).map(item => ({
        Id: (item.Id+item.ParentId),
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
        ParentBackdropImageTags:item.ParentBackdropImageTags!==undefined ? item.ParentBackdropImageTags[0] : null,
        SeriesId: item.SeriesId,
        SeasonId: item.ParentId,
        SeasonName: item.SeasonName,
        SeriesName: item.SeriesName
      }));




      if(seasonsToInsert.length>0)
      {
        await (async () => {
          // const client = await pool.connect();
  
          try {
            await db.query('BEGIN');
  
  
            //insert seasons
  
            const queryseasons = pgp.helpers.insert(seasonsToInsert, columnSeasons, 'jf_library_seasons');
            await db.query(queryseasons);
  
            //
  
            await db.query('COMMIT');
            console.log('Bulk insert successful');
            results.push({Status:'Success',Message:('Season insert successful for '+ show.Name)});
          } catch (error) {
            await db.query('ROLLBACK');
            console.error('Error performing bulk insert:', error);
            results.push({Status:'Error',Message:('Error performing bulk insert:', error)});
          }
        })();
      }else{
        results.push({Status:'Information',Message:'No new seasons to insert for '+ show.Name});
      }



      if(episodesToInsert.length>0)
      {
      await (async () => {
        // const client = await pool.connect();

        try {
          await db.query('BEGIN');

          //insert episodes

          const queryepisodes = pgp.helpers.insert(episodesToInsert, columnEpisodes, 'jf_library_episodes');
          await db.query(queryepisodes);

          //

          await db.query('COMMIT');
          console.log('Bulk insert successful');
          results.push({Status:'Success',Message:('Episode insert successful for '+ show.Name)});
        } catch (error) {
          await db.query('ROLLBACK');
          console.error('Error performing bulk insert:', error);
          results.push({Status:'Error',Message:('Error performing bulk insert:', error)});
        }
      })();
    }else{
      results.push({Status:'Information',Message:'No new episodes to insert for '+ show.Name});
    }



    }

  } else {
    console.log("No shows found.");
    results.push({Status:'Error',Message:'No shows found.'});

  }




  res.send(results);

  console.log(`ENDPOINT CALLED: /writeSeasonsAndEpisodes: `);

});



router.get('/writeLibraries', async (req, res) => {

  const sync = require('./sync');
  const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
  if (rows[0].JF_HOST === null || rows[0].JF_API_KEY === null) {
    res.send({ error: 'Config Details Not Found' });
    return;
  }

  const _sync = new sync(rows[0].JF_HOST, rows[0].JF_API_KEY);
  const data = await _sync.getLibraries();

  // res.send(data);
  // return;

  const columns = ['Id', 'Name', 'ServerId', 'IsFolder', 'Type', 'CollectionType', 'ImageTagsPrimary']; // specify the columns to insert into

  const existingIds = await db.query('SELECT "Id" FROM jf_libraries').then(res => res.rows.map(row => row.Id));


  const dataToInsert = data.filter(row => !existingIds.includes(row.Id)).map(item => ({
    Id: item.Id,
    Name: item.Name,
    ServerId: item.ServerId,
    IsFolder: item.IsFolder,
    Type: item.Type,
    CollectionType: item.CollectionType,
    ImageTagsPrimary: item.ImageTags && item.ImageTags.Primary ? item.ImageTags.Primary : null
  }));

  if(dataToInsert.length===0)
  {
    res.send('No new libraries to insert');
    return;
  }

  (async () => {
    // const client = await pool.connect();

    try {
      await db.query('BEGIN');

      const query = pgp.helpers.insert(dataToInsert, columns, 'jf_libraries');
      await db.query(query);

      await db.query('COMMIT');
      console.log('Bulk insert successful');
      res.send('Bulk insert successful');
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error performing bulk insert:', error);
      res.send(('Error performing bulk insert:', error));
    }
  })();


  // res.send(results);



  console.log(`ENDPOINT CALLED: /writeLibraries: `);

});

router.get('/writeLibraryItems', async (req, res) => {

  const sync = require('./sync');
  const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
  if (rows[0].JF_HOST === null || rows[0].JF_API_KEY === null) {
    res.send({ error: 'Config Details Not Found' });
    return;
  }

  const _sync = new sync(rows[0].JF_HOST, rows[0].JF_API_KEY);
  const data = await _sync.getAllItems();
  const existingIds = await db.query('SELECT "Id" FROM jf_library_items').then(res => res.rows.map(row => row.Id));

  // res.send(data);
  // return;

  const columns = ['Id', 'Name', 'ServerId', 'PremiereDate', 'EndDate', 'CommunityRating', 'RunTimeTicks', 'ProductionYear', 'IsFolder', 'Type', 'Status', 'ImageTagsPrimary', 'ImageTagsBanner', 'ImageTagsLogo', 'ImageTagsThumb', 'BackdropImageTags', 'ParentId']; // specify the columns to insert into

  const dataToInsert = data.filter(row => !existingIds.includes(row.Id)).map(item => ({
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
    ImageTagsPrimary: item.ImageTags && item.ImageTags.Primary ? item.ImageTags.Primary : null,
    ImageTagsBanner: item.ImageTags && item.ImageTags.Banner ? item.ImageTags.Banner : null,
    ImageTagsLogo: item.ImageTags && item.ImageTags.Logo ? item.ImageTags.Logo : null,
    ImageTagsThumb: item.ImageTags && item.ImageTags.Thumb ? item.ImageTags.Thumb : null,
    BackdropImageTags: item.BackdropImageTags[0],
    ParentId: item.ParentId
  }));

  if(dataToInsert.length===0)
  {
    res.send('No new library Items to insert');
    return;
  }

  (async () => {
    // const client = await pool.connect();

    try {
      await db.query('BEGIN');
      await db.query('TRUNCATE TABLE jf_library_items');
      const query = pgp.helpers.insert(dataToInsert, columns, 'jf_library_items');
      await db.query(query);

      await db.query('COMMIT');
      console.log('Bulk insert successful');
      res.send('Bulk insert successful');
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error performing bulk insert:', error);
      res.send(('Error performing bulk insert:', error));
    }
  })();


  // res.send(results);



  console.log(`ENDPOINT CALLED: /writeLibraryItems: `);

});

module.exports = router;
