const JellyfinAPI = require("./jellyfin-api");
const EmbyAPI = require("./emby-api");

function API() {
  const USE_EMBY_API = (process.env.IS_EMBY_API || "false").toLowerCase() === "true";
  if (USE_EMBY_API) {
    return new EmbyAPI();
  } else {
    return new JellyfinAPI();
  }
}

module.exports = API();
