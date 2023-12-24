const axios = require("axios");
const https = require('https');
const CacheableLookup = require('cacheable-lookup');

const cacheable = new CacheableLookup();

const agent = new https.Agent({
  rejectUnauthorized: (process.env.REJECT_SELF_SIGNED_CERTIFICATES || 'true').toLowerCase() === 'true'
});

cacheable.install(agent);

const axios_instance = axios.create({
  httpsAgent: agent
});

module.exports =
{
  axios: axios_instance
};
