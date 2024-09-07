import axios from "../lib/axios_instance";

class Config {
  async fetchConfig() {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get("/api/getconfig", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const { JF_HOST, APP_USER, REQUIRE_LOGIN, settings, IS_JELLYFIN } = response.data;
      return {
        hostUrl: JF_HOST,
        username: APP_USER,
        token: token,
        requireLogin: REQUIRE_LOGIN,
        settings: settings,
        IS_JELLYFIN: IS_JELLYFIN,
      };
    } catch (error) {
      // console.log(error);
      return error;
    }
  }

  async setConfig(config) {
    if (config == undefined) {
      config = await this.fetchConfig();
    }

    localStorage.setItem("config", JSON.stringify(config));
    return config;
  }

  async getConfig(refreshConfig) {
    let config = localStorage.getItem("config");
    if (config != undefined && !refreshConfig) {
      return JSON.parse(config);
    } else {
      return await this.setConfig();
    }
  }
}

export default new Config();
