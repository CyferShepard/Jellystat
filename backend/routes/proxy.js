const express = require("express");

const { axios } = require("../classes/axios");
const configClass = require("../classes/config");
const API = require("../classes/api-loader");

const router = express.Router();

router.get("/web/assets/img/devices/", async (req, res) => {
  const { devicename } = req.query; // Get the image URL from the query string
  const config = await new configClass().getConfig();

  if (config.error) {
    res.send({ error: config.error });
    return;
  }

  let url = `${config.JF_HOST}/web/assets/img/devices/${devicename}.svg`;
  if (config.IS_JELLYFIN == false) {
    url = `https://raw.githubusercontent.com/MediaBrowser/Emby.Resources/master/images/devices/${devicename}.png`;
  }

  axios
    .get(url, {
      responseType: "arraybuffer",
    })
    .then((response) => {
      res.set("Content-Type", "image/svg+xml");
      res.status(200);

      if (response.headers["content-type"].startsWith("image/")) {
        res.send(response.data);
      } else {
        res.status(500).send("Error fetching image");
      }

      return; // Add this line
    })
    .catch((error) => {
      res.status(error?.response?.status || 500).send("Error fetching image: " + error);
    });
});

router.get("/Items/Images/Backdrop/", async (req, res) => {
  const { id, fillWidth, quality, blur } = req.query; // Get the image URL from the query string
  const config = await new configClass().getConfig();

  if (config.error) {
    res.send({ error: config.error });
    return;
  }

  let url = `${config.JF_HOST}/Items/${id}/Images/Backdrop?fillWidth=${fillWidth || 800}&quality=${quality || 100}&blur=${
    blur || 0
  }`;

  axios
    .get(url, {
      responseType: "arraybuffer",
    })
    .then((response) => {
      res.set("Content-Type", "image/jpeg");
      res.status(200);

      if (response.headers["content-type"].startsWith("image/")) {
        res.send(response.data);
      } else {
        res.status(500).send("Error fetching image");
      }
    })
    .catch((error) => {
      res.status(error?.response?.status || 500).send("Error fetching image: " + error);
    });
});

router.get("/Items/Images/Primary/", async (req, res) => {
  const { id, fillWidth, quality } = req.query; // Get the image URL from the query string
  const config = await new configClass().getConfig();

  if (config.error) {
    res.send({ error: config.error });
    return;
  }

  let url = `${config.JF_HOST}/Items/${id}/Images/Primary?fillWidth=${fillWidth || 400}&quality=${quality || 100}`;

  axios
    .get(url, {
      responseType: "arraybuffer",
    })
    .then((response) => {
      res.set("Content-Type", "image/jpeg");
      res.status(200);

      if (response.headers["content-type"].startsWith("image/")) {
        res.send(response.data);
      } else {
        res.status(500).send("Error fetching image");
      }
    })
    .catch((error) => {
      res.status(error?.response?.status || 500).send("Error fetching image: " + error);
    });
});

router.get("/Users/Images/Primary/", async (req, res) => {
  const { id, fillWidth, quality } = req.query; // Get the image URL from the query string
  const config = await new configClass().getConfig();

  if (config.error) {
    res.send({ error: config.error });
    return;
  }

  let url = `${config.JF_HOST}/Users/${id}/Images/Primary?fillWidth=${fillWidth || 100}&quality=${quality || 100}`;

  axios
    .get(url, {
      responseType: "arraybuffer",
    })
    .then((response) => {
      res.set("Content-Type", "image/jpeg");
      res.status(200);

      if (response.headers["content-type"].startsWith("image/")) {
        res.send(response.data);
      } else {
        res.status(500).send("Error fetching image");
      }
    })
    .catch((error) => {
      res.status(error?.response?.status || 500).send("Error fetching image: " + error);
    });
});

router.get("/getSessions", async (req, res) => {
  try {
    const sessions = await API.getSessions();
    res.send(sessions);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.get("/getAdminUsers", async (req, res) => {
  try {
    const adminUser = await API.getAdmins();
    res.send(adminUser);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.get("/getRecentlyAdded", async (req, res) => {
  try {
    const { libraryid } = req.query;

    const recentlyAdded = await API.getRecentlyAdded({ libraryid: libraryid });
    res.send(recentlyAdded);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

//API related functions

router.post("/validateSettings", async (req, res) => {
  const { url, apikey } = req.body;

  if (url === undefined || apikey === undefined) {
    res.status(400);
    res.send("URL or API Key not provided");
    return;
  }

  const validation = await API.validateSettings(url, apikey);
  if (validation.isValid === false) {
    res.status(validation.status);
    res.send(validation.errorMessage);
  } else {
    res.send(validation);
  }
});

// Handle other routes
router.use((req, res) => {
  res.status(404).send({ error: "Not Found" });
});

module.exports = router;
