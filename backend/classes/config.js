const db = require("../db");

class Config {
  async getConfig() {
    try {
      //Manual overrides
      process.env.POSTGRES_USER = process.env.POSTGRES_USER ?? "postgres";

      //
      const { rows: config } = await db.query('SELECT * FROM app_config where "ID"=1');

      const state = this.#getConfigState(config);

      if (state < 1) {
        return { state: 0, error: "Config Details Not Found" };
      }

      const _config = config[0];

      return {
        JF_HOST: process.env.JF_HOST ?? _config.JF_HOST,
        JF_EXTERNAL_HOST: _config.settings?.EXTERNAL_URL,
        JF_API_KEY: process.env.JF_API_KEY ?? _config.JF_API_KEY,
        APP_USER: _config.APP_USER,
        APP_PASSWORD: _config.APP_PASSWORD,
        REQUIRE_LOGIN: _config.REQUIRE_LOGIN,
        settings: _config.settings,
        api_keys: _config.api_keys,
        state: state,
        IS_JELLYFIN: (process.env.IS_EMBY_API || "false").toLowerCase() === "false",
      };
    } catch (error) {
      return { error: "Config Details Not Found" };
    }
  }

  async getPreferedAdmin() {
    const config = await this.getConfig();
    return config.settings?.preferred_admin?.userid;
  }

  async getExcludedLibraries() {
    const config = await this.getConfig();
    return config.settings?.ExcludedLibraries ?? [];
  }

  #getConfigState(Configured) {
    let state = 0;
    try {
      //state 0 = not configured
      //state 1 = configured and user set
      //state 2 = configured and user and api key set

      if (Configured.length > 0 && Configured[0].APP_USER !== null) {
        if (
          Configured[0].JF_API_KEY === null ||
          (typeof Configured[0].JF_API_KEY === "string" && Configured[0].JF_API_KEY.trim() === "")
        ) {
          //check if user is configured but API is not configured then return state 1
          state = 1;
        } else {
          //check if user is configured and API is configured then return state 2
          state = 2;
        }
      }
      return state;
    } catch (error) {
      return state;
    }
  }
}

module.exports = Config;
