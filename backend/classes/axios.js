const axios = require("axios");
const https = require('https');

const agent = new https.Agent({
    rejectUnauthorized: (process.env.REJECT_SELF_SIGNED_CERTIFICATES || 'true').toLowerCase() ==='true'
  });


const axios_instance = axios.create({
    httpsAgent: agent
  });

  module.exports =
  {
    axios:axios_instance
  };
  