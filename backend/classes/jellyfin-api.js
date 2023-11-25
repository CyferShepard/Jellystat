const db = require("../db");
const configClass = require("./config");
const {axios} = require("./axios");

class JellyfinAPI {
    constructor() {
        this.config = null;
        this.configReady = new Promise(resolve => {
          new configClass().getConfig().then(config => {
            this.config = config;
            resolve();
          });
        });
      }
    //Helper classes
    #errorHandler(error)
    {
        if (error.response) {
            switch (error.response.status) {
                case 400:
                  console.log('[JELLYFIN-API]: Bad Request');
                  break;
                case 401:
                  console.log('[JELLYFIN-API]: Unauthorized');
                  break;
                case 403:
                  console.log('[JELLYFIN-API]: Forbidden');
                  break;
                case 404:
                  console.log('[JELLYFIN-API]: Not Found');
                  break;
                default:
                  console.log(`[JELLYFIN-API]: Unexpected status code: ${error.response.status}`);
              }
          } else {
            console.log('Error', ({ErrorAt: this.#getErrorLineNumber(error), Message:error.message}));
          }
    }

    #getErrorLineNumber(error) {
        const stackTrace = error.stack.split('\n');
        const errorLine = stackTrace[1].trim();
        const lineNumber = errorLine.substring(
          errorLine.lastIndexOf('\\') + 1,
          errorLine.lastIndexOf(')')
        );
        return lineNumber;
      }
      

    //Functions

    async getUsers() {
        await this.configReady;
        try {
          const url = `${this.config.JF_HOST}/Users`;

          const response = await axios.get(url, {
            headers: {
              "X-MediaBrowser-Token": this.config.JF_API_KEY,
            },
          });

          return response.data;
        } catch (error) {
            this.#errorHandler(error);
          return [];
        }
    }

    async getAdmins() {
      try {
        const users=await this.getUsers();
        return users.filter(user=>user.Policy.IsAdministrator);
      } catch (error) {
          this.#errorHandler(error);
        return [];
      }
    }

    async getItemsByID(ids,params) {
      await this.configReady;
      try {
        let url = `${this.config.JF_HOST}/Items?ids=${ids}`;
        let startIndex=params && params.startIndex ? params.startIndex :0;
        let increment=params && params.increment ? params.startIndex :200;
        let recursive=params && params.recursive!==undefined  ? params.recursive :true;
        let total=200;

        let final_response=[];
        while(startIndex<total && total !== undefined)
        {
          const response = await axios.get(url, {
            headers: {
              "X-MediaBrowser-Token": this.config.JF_API_KEY,
            },
            params:{
              startIndex:startIndex,
              recursive:recursive,
              limit:increment,
            },
          });

          total=response.data.TotalRecordCount;
          startIndex+=increment;

           final_response.push(...response.data.Items);

        }


        return final_response;
      } catch (error) {
        this.#errorHandler(error);
        return [];
      }
    }

    async getItemsFromParentId(id,params) {
        await this.configReady;
        try {   
          let url = `${this.config.JF_HOST}/Items?ParentId=${id}`;
          let startIndex=params && params.startIndex ? params.startIndex :0;
          let increment=params && params.increment ? params.startIndex :200;
          let recursive=params && params.recursive!==undefined  ? params.recursive :true;
          let total=200;
    
          let AllItems=[];
          while(startIndex<total && total !== undefined)
          {
            const response = await axios.get(url, {
              headers: {
                "X-MediaBrowser-Token": this.config.JF_API_KEY,
              },
              params:{
                startIndex:startIndex,
                recursive:recursive,
                limit:increment
              },
            });
    
            total=response.data.TotalRecordCount;
            startIndex+=increment;
    
            AllItems.push(...response.data.Items);
    
          }
    
    
          return AllItems;
        } catch (error) {
          this.#errorHandler(error);
          return [];
        }
    }

    async getItemInfo(itemID,userid) {
        await this.configReady;
        try {

          if(!userid || userid==null)
          {
              await new configClass().getPreferedAdmin().then(async (adminid)=>{  
                  if(!adminid || adminid==null)
                  {
                      userid=(await this.getAdmins())[0].Id;
                  }
                  else
                  {
                      userid=adminid; 
                  }
              }); 
          }

          let url = `${this.config.JF_HOST}/Items/${itemID}/playbackinfo?userId=${userid}`;
    
          const response = await axios.get(url, {
            headers: {
              "X-MediaBrowser-Token": this.config.JF_API_KEY,
            },
          });
    
          return response.data.MediaSources;
        } catch (error) {
          this.#errorHandler(error);
          return [];
        }
    }
      
    async getLibraries() {
        await this.configReady;
        try {
          let url = `${this.config.JF_HOST}/Library/MediaFolders`;
    
    
          const response = await axios.get(url, {
            headers: {
              "X-MediaBrowser-Token": this.config.JF_API_KEY,
            },
          });
    
          const libraries = response.data.Items.filter(
            (library) => !["boxsets", "playlists"].includes(library.CollectionType)
          );

          return libraries || [];
        } catch (error) {
          this.#errorHandler(error);
          return [];
        }
    }

    async getSeasons(SeriesId) {
        await this.configReady;
        try {
          let url = `${this.config.JF_HOST}/Shows/${SeriesId}/Seasons`;
    
          const response = await axios.get(url, {
            headers: {
              "X-MediaBrowser-Token": this.config.JF_API_KEY,
            },
          });
    
          return response.data.Items.filter((item) => item.LocationType !== "Virtual");
        } catch (error) {
          this.#errorHandler(error);
          return [];
        }
    }

    async getEpisodes(SeriesId,SeasonId) {
      await this.configReady;
      try {

        let url = `${this.config.JF_HOST}/Shows/${SeriesId}/Episodes?seasonId=${SeasonId}`;

        const response = await axios.get(url, {
          headers: {
            "X-MediaBrowser-Token": this.config.JF_API_KEY,
          },
        });

        return response.data.Items.filter((item) => item.LocationType !== "Virtual");
      } catch (error) {
        this.#errorHandler(error);
        return [];
      }
    }
    
    async getRecentlyAdded(libraryid,limit = 20,userid ) {
      await this.configReady;
      try {
        if(!userid || userid==null)
        {
            let adminid=await new configClass().getPreferedAdmin(); 
            if(!adminid || adminid==null)
            {
                userid=(await this.getAdmins())[0].Id;
            }
            else
            {
                userid=adminid; 
            }
        }

        let url = `${this.config.JF_HOST}/Users/${userid}/Items/Latest?Limit=${limit}`;

        if(libraryid && libraryid!=null)
        {
          url+=`&ParentId=${libraryid}`;
        }

        const response = await axios.get(url, {
          headers: {
            "X-MediaBrowser-Token": this.config.JF_API_KEY,
          },
        });


        return response.data.filter((item) => item.LocationType !== "Virtual");
      } catch (error) {
        this.#errorHandler(error);
        return [];
      }
    }

    async getSessions()
    {
        await this.configReady;
        try {     
            let url = `${this.config.JF_HOST}/sessions`;
        
            const response = await axios.get(url, {
              headers: {
                "X-MediaBrowser-Token": this.config.JF_API_KEY,
              },
            });
            return response.data
        } catch (error) {
            this.#errorHandler(error);
            return [];
        }
    }

    async getInstalledPlugins()
    {
        await this.configReady;
        try {     
            let url = `${this.config.JF_HOST}/plugins`;
        
            const response = await axios.get(url, {
              headers: {
                "X-MediaBrowser-Token": this.config.JF_API_KEY,
              },
            });
            return response.data
        } catch (error) {
            this.#errorHandler(error);
            return [];
        }
    }

    async StatsSubmitCustomQuery(query)
    {
        await this.configReady;
        try {     
            let url = `${this.config.JF_HOST}/user_usage_stats/submit_custom_query`;
        
            const response = await axios.post(url,{
                CustomQueryString: query,
              }, {
              headers: {
                "X-MediaBrowser-Token": this.config.JF_API_KEY,
              },
            });
            return response.data.results;
        } catch (error) {
            this.#errorHandler(error);
            return [];
        }
    }

}

module.exports = JellyfinAPI;