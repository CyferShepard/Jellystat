const express = require('express');
const axios = require("axios");
const db = require("../db");
const https = require('https');

const agent = new https.Agent({
  rejectUnauthorized: (process.env.REJECT_SELF_SIGNED_CERTIFICATES || 'true').toLowerCase() ==='true'
});


const axios_instance = axios.create({
  httpsAgent: agent
});

const router = express.Router();

router.get('/web/assets/img/devices/', async(req, res) => {
  const { devicename } = req.query; // Get the image URL from the query string
  const { rows: config } = await db.query('SELECT * FROM app_config where "ID"=1');

  if (config[0].JF_HOST === null || config[0].JF_API_KEY === null || devicename===undefined) {
    res.send({ error: "Config Details Not Found" });
    return;
  }

  let url=`${config[0].JF_HOST}/web/assets/img/devices/${devicename}.svg`;

  axios_instance.get(url, {
    responseType: 'arraybuffer'
  })
  .then((response) => {
    res.set('Content-Type', 'image/svg+xml');
    res.status(200);
  
    if (response.headers['content-type'].startsWith('image/')) {
      res.send(response.data);
    } else {
      res.status(500).send('Error fetching image');
    }
  
    return; // Add this line
  })
  .catch((error) => {
    res.status(error?.response?.status || 500).send('Error fetching image: '+error);
  });
  
});



router.get('/Items/Images/Backdrop/', async(req, res) => {
    const { id,fillWidth,quality,blur } = req.query; // Get the image URL from the query string
    const { rows: config } = await db.query('SELECT * FROM app_config where "ID"=1');

    if (config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
      res.send({ error: "Config Details Not Found" });
      return;
    }
  

    let url=`${config[0].JF_HOST}/Items/${id}/Images/Backdrop?fillWidth=${fillWidth || 800}&quality=${quality || 100}&blur=${blur || 0}`;


    axios_instance.get(url, {
      responseType: 'arraybuffer'
    })
    .then((response) => {
      res.set('Content-Type', 'image/jpeg');
      res.status(200);

      if (response.headers['content-type'].startsWith('image/')) {
        res.send(response.data);
      } else {
        res.status(500).send('Error fetching image');
      }
    })
    .catch((error) => {
      res.status(error?.response?.status || 500).send('Error fetching image: '+error);
    });
  });

  router.get('/Items/Images/Primary/', async(req, res) => {
    const { id,fillWidth,quality } = req.query; // Get the image URL from the query string
    const { rows: config } = await db.query('SELECT * FROM app_config where "ID"=1');

    if (config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
      res.send({ error: "Config Details Not Found" });
      return;
    }
  

    let url=`${config[0].JF_HOST}/Items/${id}/Images/Primary?fillWidth=${fillWidth || 400}&quality=${quality || 100}`;

    axios_instance.get(url, {
      responseType: 'arraybuffer'
    })
    .then((response) => {
      res.set('Content-Type', 'image/jpeg');
      res.status(200);

      if (response.headers['content-type'].startsWith('image/')) {
        res.send(response.data);
      } else {
        res.status(500).send('Error fetching image');
      }
    })
    .catch((error) => {
      res.status(error?.response?.status || 500).send('Error fetching image: '+error);
    });
  });

  
  router.get('/Users/Images/Primary/', async(req, res) => {
    const { id,fillWidth,quality } = req.query; // Get the image URL from the query string
    const { rows: config } = await db.query('SELECT * FROM app_config where "ID"=1');

    if (config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
      res.send({ error: "Config Details Not Found" });
      return;
    }
  

    let url=`${config[0].JF_HOST}/Users/${id}/Images/Primary?fillWidth=${fillWidth || 100}&quality=${quality || 100}`;

    axios_instance.get(url, {
      responseType: 'arraybuffer'
    })
    .then((response) => {
      res.set('Content-Type', 'image/jpeg');
      res.status(200);

      if (response.headers['content-type'].startsWith('image/')) {
        res.send(response.data);
      } else {
        res.status(500).send('Error fetching image');
      }
    })
    .catch((error) => {
      res.status(error?.response?.status || 500).send('Error fetching image: '+error);
    });
  });

  router.get("/getSessions", async (req, res) => {
    try {
      const { rows: config } = await db.query(
        'SELECT * FROM app_config where "ID"=1'
      );
  
      if (
        config.length === 0 ||
        config[0].JF_HOST === null ||
        config[0].JF_API_KEY === null
      ) {
        res.status(503);
        res.send({ error: "Config Details Not Found" });
        return;
      }
  
      let url = `${config[0].JF_HOST}/sessions`;
  
      const response_data = await axios_instance.get(url, {
        headers: {
          "X-MediaBrowser-Token": config[0].JF_API_KEY,
        },
      });
      res.send(response_data.data);
    } catch (error) {
      res.status(503);
      res.send(error);
    }
  });
  
  router.get("/getAdminUsers", async (req, res) => {
    try {
      const { rows: config } = await db.query(
        'SELECT * FROM app_config where "ID"=1'
      );
  
      if (
        config.length === 0 ||
        config[0].JF_HOST === null ||
        config[0].JF_API_KEY === null
      ) {
        res.status(503);
        res.send({ error: "Config Details Not Found" });
        return;
      }
  
      let url = `${config[0].JF_HOST}/Users`;
  
      const response = await axios_instance.get(url, {
        headers: {
          "X-MediaBrowser-Token": config[0].JF_API_KEY,
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
  
      res.send(adminUser);
    } catch (error) {
      res.status(503);
      res.send(error);
    }
  });
  
  router.get("/getRecentlyAdded", async (req, res) => {
    try {
  
      const { libraryid } = req.query;
      const { rows: config } = await db.query('SELECT * FROM app_config where "ID"=1');
  
      if (config.length===0 || config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
        res.status(503);
        res.send({ error: "Config Details Not Found" });
        return;
      }
  


      let userid=config[0].settings?.preferred_admin?.userid;

      if(!userid)
      {
        const adminurl = `${config[0].JF_HOST}/Users`;
  
        const response = await axios_instance.get(adminurl, {
          headers: {
            "X-MediaBrowser-Token":  config[0].JF_API_KEY ,
          },
        });
    
        if(!response || typeof response.data !== 'object' || !Array.isArray(response.data))
        {
          res.status(503);
          res.send({ error: "Invalid Response from Users API Call.", user_response:response });
          return;
        }

        const admins = response.data.filter(
          (user) => user.Policy.IsAdministrator === true
        );
        userid = admins[0].Id;
      }
  
  
     
  
      let url=`${config[0].JF_HOST}/users/${userid}/Items/latest`;
      if(libraryid)
      {
        url+=`?parentId=${libraryid}`;
      }
  
      
      
      const response_data = await axios_instance.get(url, {
        headers: {
          "X-MediaBrowser-Token":  config[0].JF_API_KEY ,
        },
      });
      res.send(response_data.data);
    } catch (error) {
      res.status(503);
      res.send(error);
    }
  });
  
  

  

module.exports = router;
