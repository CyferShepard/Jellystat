const db = require("../db");

class Config{

  async getConfig() {
      try {
          const { rows: config } = await db.query(
            'SELECT * FROM app_config where "ID"=1'
          );
          
          if (
            config.length === 0 ||
            config[0].JF_HOST === null ||
            config[0].JF_API_KEY === null
          ) {
            return { error: "Config Details Not Found" };
          } 


            return ({
              JF_HOST:config[0].JF_HOST , 
              JF_API_KEY:config[0].JF_API_KEY , 
              APP_USER:config[0].APP_USER , 
              APP_PASSWORD:config[0].APP_PASSWORD , 
              REQUIRE_LOGIN:config[0].REQUIRE_LOGIN , 
              settings:config[0].settings , 
              api_keys:config[0].api_keys , 
            });
          
      } catch (error) {
          return { error: "Config Details Not Found" };
      }
  }

  async getPreferedAdmin() {
    const config=await this.getConfig();
    return config.settings?.preferred_admin?.userid;
  }

}


module.exports = Config;