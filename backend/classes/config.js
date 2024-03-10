const db = require("../db");

class Config {
  async getConfig() {
    try {
      const { rows: config } = await db.query('SELECT * FROM app_config where "ID"=1');

      const state = await this.getConfigState(config);

      if (state < 1) {
        return { error: "Config Details Not Found" };
      }

      return {
        JF_HOST: config[0].JF_HOST,
        JF_API_KEY: config[0].JF_API_KEY,
        APP_USER: config[0].APP_USER,
        APP_PASSWORD: config[0].APP_PASSWORD,
        REQUIRE_LOGIN: config[0].REQUIRE_LOGIN,
        settings: config[0].settings,
        api_keys: config[0].api_keys,
        state: state,
      };
    } catch (error) {
      return { error: "Config Details Not Found" };
    }
  }

  async getPreferedAdmin() {
    const config = await this.getConfig();
    return config.settings?.preferred_admin?.userid;
  }

  async getConfigState(Configured) {
    let state = 0;
    try {
      //state 0 = not configured
      //state 1 = configured and user set
      //state 2 = configured and user and api key set

      if (Configured.length > 0) {
        if (Configured[0].APP_USER === null) {
          //safety check if user is null still return state 0
          return state;
        }

        if (Configured[0].APP_USER !== null && Configured[0].JF_API_KEY === null) {
          //check if user is configured but API is not configured then return state 1
          state = 1;
          return state;
        }

        if (Configured[0].APP_USER !== null && Configured[0].JF_API_KEY !== null) {
          //check if user is configured and API is configured then return state 2
          state = 2;
          return state;
        }
      } else {
        return state;
      }
    } catch (error) {
      return state;
    }
  }
}

module.exports = Config;
