const express = require("express");

const { axios } = require("../classes/axios");
const configClass = require("../classes/config");
const API = require("../classes/api-loader");

const router = express.Router();

// The image endpoints are public, so only let their parameters into the Jellyfin URL in a safe form
// (otherwise e.g. an "id" containing "../" or "?" could be used to reach other Jellyfin endpoints).
const ID_RE = /^[0-9a-fA-F-]{32,36}$/;
const NAME_RE = /^[A-Za-z0-9_.\-]{1,64}$/;
const toBoundedInt = (value, fallback, max = 4000) => {
  const n = parseInt(value);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : fallback;
};
router.use(["/web/assets/img/devices", "/Items/Images", "/Users/Images"], (req, res, next) => {
  const { id, devicename } = req.query;
  if (id !== undefined && !ID_RE.test(String(id))) return res.status(400).send("Invalid id");
  if (devicename !== undefined && !NAME_RE.test(String(devicename))) return res.status(400).send("Invalid device name");
  req.query.fillWidth = toBoundedInt(req.query.fillWidth, undefined);
  req.query.quality = toBoundedInt(req.query.quality, undefined, 100);
  req.query.blur = toBoundedInt(req.query.blur, undefined, 100);
  next();
});

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
      if (config.IS_JELLYFIN == false) {
        res.set("Content-Type", "image/png");
      }
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
    const adminUser = await API.getAdmins(true);
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
