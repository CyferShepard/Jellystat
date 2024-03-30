const configClass = require("./config");
const { axios } = require("./axios");

class JellyfinAPI {
  constructor() {
    this.config = null;
    this.configReady = false;
    this.#checkReadyStatus();
  }
  //Helper classes
  #checkReadyStatus() {
    let checkConfigError = setInterval(async () => {
      const _config = await new configClass().getConfig();
      if (!_config.error && _config.state === 2) {
        clearInterval(checkConfigError);
        this.config = _config;
        this.configReady = true;
      }
    }, 5000); // Check every 5 seconds
  }

  #errorHandler(error) {
    if (error.response) {
      switch (error.response.status) {
        case 400:
          console.log("[JELLYFIN-API]: 400 Bad Request");
          break;
        case 401:
          console.log("[JELLYFIN-API]: 401 Unauthorized");
          break;
        case 403:
          console.log("[JELLYFIN-API]: 403 Access Forbidden");
          break;
        case 404:
          console.log(`[JELLYFIN-API]: 404 URL Not Found : ${error.request.path}`);
          break;
        case 503:
          console.log(`[JELLYFIN-API]: 503 Service Unavailable : ${error.request.path}`);
          break;
        default:
          console.log(`[JELLYFIN-API]: Unexpected status code: ${error.response.status}`);
      }
    } else {
      console.log("[JELLYFIN-API]", {
        ErrorAt: this.#getErrorLineNumber(error),
        ErrorLines: this.#getErrorLineNumbers(error),
        Message: error.message,
        // StackTrace: this.#getStackTrace(error),
      });
    }
  }

  #getErrorLineNumber(error) {
    const stackTrace = this.#getStackTrace(error);
    const errorLine = stackTrace[1].trim();
    const lineNumber = errorLine.substring(errorLine.lastIndexOf("\\") + 1, errorLine.lastIndexOf(")"));
    return lineNumber;
  }

  #getErrorLineNumbers(error) {
    const stackTrace = this.#getStackTrace(error);
    let errorLines = [];

    for (const [index, line] of stackTrace.entries()) {
      if (line.trim().startsWith("at")) {
        const errorLine = line.trim();
        const startSubstring = errorLine.lastIndexOf("\\") == -1 ? errorLine.indexOf("(") + 1 : errorLine.lastIndexOf("\\") + 1;
        const endSubstring = errorLine.lastIndexOf(")") == -1 ? errorLine.length : errorLine.lastIndexOf(")");
        const lineNumber = errorLine.substring(startSubstring, endSubstring);
        errorLines.push({ TraceIndex: index, line: lineNumber });
      }
    }

    return errorLines;
  }

  #getStackTrace(error) {
    const stackTrace = error.stack.split("\n");
    return stackTrace;
  }

  #delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  //Functions

  async getUsers() {
    if (!this.configReady) {
      return [];
    }
    try {
      const url = `${this.config.JF_HOST}/Users`;

      const response = await axios.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.config.JF_API_KEY,
        },
      });

      return response?.data || [];
    } catch (error) {
      this.#errorHandler(error);
      return [];
    }
  }

  async getAdmins() {
    try {
      const users = await this.getUsers();
      return users?.filter((user) => user.Policy.IsAdministrator) || [];
    } catch (error) {
      this.#errorHandler(error);
      return [];
    }
  }

  async getItemsByID({ ids, params }) {
    if (!this.configReady) {
      return [];
    }
    try {
      let url = `${this.config.JF_HOST}/Items?ids=${ids}`;
      let startIndex = params && params.startIndex ? params.startIndex : 0;
      let increment = params && params.increment ? params.increment : 200;
      let recursive = params && params.recursive !== undefined ? params.recursive : true;
      let total = 200;

      let final_response = [];
      while (startIndex < total || total === undefined) {
        const response = await axios.get(url, {
          headers: {
            "X-MediaBrowser-Token": this.config.JF_API_KEY,
          },
          params: {
            fields: "MediaSources,DateCreated",
            startIndex: startIndex,
            recursive: recursive,
            limit: increment,
            isMissing: false,
            excludeLocationTypes: "Virtual",
          },
        });

        total = response?.data?.TotalRecordCount ?? 0;
        startIndex += increment;

        const result = response?.data?.Items || [];

        final_response.push(...result);
        if (response.data.TotalRecordCount === undefined) {
          break;
        }

        await this.#delay(10);
      }

      return final_response;
    } catch (error) {
      this.#errorHandler(error);
      return [];
    }
  }

  async getItemsFromParentId({ id, itemid, params, ws, syncTask, wsMessage }) {
    if (!this.configReady) {
      return [];
    }
    try {
      let url = `${this.config.JF_HOST}/Items?ParentId=${id}`;
      if (itemid && itemid != null) {
        url += `&Ids=${itemid}`;
      }

      let startIndex = params && params.startIndex ? params.startIndex : 0;
      let increment = params && params.increment ? params.increment : 200;
      let recursive = params && params.recursive !== undefined ? params.recursive : true;
      let total = 200;

      let AllItems = [];
      while (startIndex < total || total === undefined) {
        const response = await axios.get(url, {
          headers: {
            "X-MediaBrowser-Token": this.config.JF_API_KEY,
          },
          params: {
            fields: "MediaSources,DateCreated",
            startIndex: startIndex,
            recursive: recursive,
            limit: increment,
            isMissing: false,
            excludeLocationTypes: "Virtual",
          },
        });

        total = response?.data?.TotalRecordCount || 0;
        startIndex += increment;

        const result = response?.data?.Items || [];

        AllItems.push(...result);

        if (response.data.TotalRecordCount === undefined) {
          break;
        }
        if (ws && syncTask && wsMessage) {
          ws(syncTask.wsKey, { type: "Update", message: `${wsMessage} - ${((startIndex / total) * 100).toFixed(2)}%` });
        }

        await this.#delay(10);
      }

      return AllItems;
    } catch (error) {
      this.#errorHandler(error);
      return [];
    }
  }

  async getItemInfo({ itemID, userid }) {
    if (!this.configReady) {
      return [];
    }
    try {
      if (!userid || userid == null) {
        await new configClass().getPreferedAdmin().then(async (adminid) => {
          if (!adminid || adminid == null) {
            userid = (await this.getAdmins())[0].Id;
          } else {
            userid = adminid;
          }
        });
      }

      let url = `${this.config.JF_HOST}/Items/${itemID}/playbackinfo?userId=${userid}`;

      const response = await axios.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.config.JF_API_KEY,
        },
      });

      return response?.data?.MediaSources || 0;
    } catch (error) {
      this.#errorHandler(error);
      return [];
    }
  }

  async getLibraries() {
    if (!this.configReady) {
      return [];
    }
    try {
      let url = `${this.config.JF_HOST}/Library/MediaFolders`;

      const response = await axios.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.config.JF_API_KEY,
        },
      });

      const libraries =
        response?.data?.Items?.filter((library) => !["boxsets", "playlists"].includes(library.CollectionType)) || [];

      return libraries;
    } catch (error) {
      this.#errorHandler(error);
      return [];
    }
  }

  async getSeasons(SeriesId) {
    if (!this.configReady) {
      return [];
    }
    try {
      let url = `${this.config.JF_HOST}/Shows/${SeriesId}/Seasons`;

      const response = await axios.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.config.JF_API_KEY,
        },
      });

      return response?.data?.Items?.filter((item) => item.LocationType !== "Virtual") || [];
    } catch (error) {
      this.#errorHandler(error);
      return [];
    }
  }

  async getEpisodes({ SeriesId, SeasonId }) {
    if (!this.configReady) {
      return [];
    }
    try {
      let url = `${this.config.JF_HOST}/Shows/${SeriesId}/Episodes?seasonId=${SeasonId}`;

      const response = await axios.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.config.JF_API_KEY,
        },
      });

      return response?.data?.Items?.filter((item) => item.LocationType !== "Virtual") || [];
    } catch (error) {
      this.#errorHandler(error);
      return [];
    }
  }

  async getRecentlyAdded({ libraryid, limit = 20, userid }) {
    if (!this.configReady) {
      return [];
    }
    try {
      if (!userid || userid == null) {
        let adminid = await new configClass().getPreferedAdmin();
        if (!adminid || adminid == null) {
          userid = (await this.getAdmins())[0].Id;
        } else {
          userid = adminid;
        }
      }

      let url = `${this.config.JF_HOST}/Users/${userid}/Items/Latest?Limit=${limit}`;

      if (libraryid && libraryid != null) {
        url += `&ParentId=${libraryid}`;
      }

      const response = await axios.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.config.JF_API_KEY,
        },
        params: {
          fields: "MediaSources,DateCreated",
        },
      });

      const items = response?.data?.filter((item) => item.LocationType !== "Virtual") || [];

      return items;
    } catch (error) {
      this.#errorHandler(error);
      return [];
    }
  }

  async getSessions() {
    if (!this.configReady) {
      return [];
    }
    try {
      let url = `${this.config.JF_HOST}/sessions`;

      const response = await axios.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.config.JF_API_KEY,
        },
      });
      return response.data && Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      this.#errorHandler(error);
      return [];
    }
  }

  async getInstalledPlugins() {
    if (!this.configReady) {
      return [];
    }
    try {
      let url = `${this.config.JF_HOST}/plugins`;

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

  async StatsSubmitCustomQuery(query) {
    if (!this.configReady) {
      return [];
    }
    try {
      let url = `${this.config.JF_HOST}/user_usage_stats/submit_custom_query`;

      const response = await axios.post(
        url,
        {
          CustomQueryString: query,
        },
        {
          headers: {
            "X-MediaBrowser-Token": this.config.JF_API_KEY,
          },
        }
      );
      return response.data.results;
    } catch (error) {
      this.#errorHandler(error);
      return [];
    }
  }

  async validateSettings(url, apikey) {
    if (!this.configReady) {
      return [];
    }
    try {
      const response = await axios.get(url, {
        headers: {
          "X-MediaBrowser-Token": apikey,
        },
      });
      return {
        isValid: response.status === 200,
        errorMessage: "",
      };
    } catch (error) {
      this.#errorHandler(error);
      return {
        isValid: false,
        errorMessage: error.message,
      };
    }
  }
}

module.exports = JellyfinAPI;
