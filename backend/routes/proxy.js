const express = require("express");

const { axios } = require("../classes/axios");
const configClass = require("../classes/config");
const JellyfinAPI = require("../classes/jellyfin-api");

const Jellyfin = new JellyfinAPI();
const router = express.Router();

router.get("/web/assets/img/devices/", async (req, res) => {
  const { devicename } = req.query; // Get the image URL from the query string
  const config = await new configClass().getConfig();

  if (config.error) {
    res.send({ error: config.error });
    return;
  }

  let url = `${config.JF_HOST}/web/assets/img/devices/${devicename}.svg`;

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
    const sessions = await Jellyfin.getSessions();
    res.send(sessions);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.get("/getAdminUsers", async (req, res) => {
  try {
    const adminUser = await Jellyfin.getAdmins();
    res.send(adminUser);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.get("/getRecentlyAdded", async (req, res) => {
  try {
    const { libraryid } = req.query;

    const recentlyAdded = await Jellyfin.getRecentlyAdded({ libraryid: libraryid });
    res.send(recentlyAdded);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

//Jellyfin related functions

router.post("/validateSettings", async (req, res) => {
  const { url, apikey } = req.body;

  if (url === undefined || apikey === undefined) {
    res.status(400);
    res.send("URL or API Key not provided");
    return;
  }

  var _url = url;
  _url = _url.replace(/\/web\/index\.html#!\/home\.html$/, "");
  if (!/^https?:\/\//i.test(_url)) {
    _url = "http://" + _url;
  }
  console.log(_url, isValidUrl(_url));
  if (!isValidUrl(_url)) {
    res.status(400);

    res.send({
      isValid: false,
      errorMessage: "Invalid URL",
    });
    return;
  }

  _url = _url.replace(/\/$/, "") + "/system/configuration";

  const validation = await Jellyfin.validateSettings(_url, apikey);

  res.send(validation);
});

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = router;
