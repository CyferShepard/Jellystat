const { axios } = require("../classes/axios");
const express = require("express");

const router = express.Router();

const geoliteUrlBase = "https://geolite.info/geoip/v2.1/city";

const geoliteAccountId = process.env.JS_GEOLITE_ACCOUNT_ID;
const geoliteLicenseKey = process.env.JS_GEOLITE_LICENSE_KEY;

//https://stackoverflow.com/a/29268025
const ipRegex = new RegExp(
  /\b(?!(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168))(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))\b/
);

router.post("/geolocateIp", async (req, res) => {
  try {
    if (!(geoliteAccountId && geoliteLicenseKey)) {
      return res.status(501).send("GeoLite information missing!");
    }

    const { ipAddress } = req.body;
    ipRegex.lastIndex = 0;

    if (!ipAddress || !ipRegex.test(ipAddress)) {
      return res.status(400).send("Invalid IP address sent!");
    }

    const response = await axios.get(`${geoliteUrlBase}/${ipAddress}`, {
      auth: {
        username: geoliteAccountId,
        password: geoliteLicenseKey,
      },
    });
    return res.send(response.data);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

// Handle other routes
router.use((req, res) => {
  res.status(404).send({ error: "Not Found" });
});

module.exports = router;
