const configClass = require("./config");
const { axios } = require("./axios");

class EmbyAPI {
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

  #errorHandler(error, url) {
    if (error.response) {
      console.log("[EMBY-API]: " + this.#httpErrorMessageHandler(error));
    } else {
      console.log("[EMBY-API]", {
        ErrorAt: this.#getErrorLineNumber(error),
        ErrorLines: this.#getErrorLineNumbers(error),
        Message: error.message,
        url: url,
        // StackTrace: this.#getStackTrace(error),
      });
    }
  }

  #httpErrorMessageHandler(error) {
    let message = "";
    switch (error.response.status) {
      case 400:
        message = "400 Bad Request";
        break;
      case 401:
        message = "401 Unauthorized";
        break;
      case 403:
        message = "403 Access Forbidden";
        break;
      case 404:
        message = `404 URL Not Found : ${error.request.path}`;
        break;
      case 503:
        message = `503 Service Unavailable : ${error.request.path}`;
        break;
      default:
        message = `Unexpected status code: ${error.response.status}`;
    }
    return message;
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

      if (Array.isArray(response?.data)) {
        return response?.data || [];
      }

      console.log("[JELLYFIN-API] : getUsers - " + (response?.data || response));

      return [];
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
      let limit = params && params.limit !== undefined ? params.limit : increment;
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
            limit: limit,
            isMissing: false,
            excludeLocationTypes: "Virtual",
          },
        });

        total = response?.data?.TotalRecordCount ?? 0;
        startIndex += increment;

        const result = response?.data?.Items || [];

        final_response.push(...result);
        if (response.data.TotalRecordCount === undefined || final_response.length >= limit) {
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

      let userid;
      if (!userid || userid == null) {
        await new configClass().getPreferedAdmin().then(async (adminid) => {
          if (!adminid || adminid == null) {
            userid = (await this.getAdmins())[0].Id;
          } else {
            userid = adminid;
          }
        });
      }
      url += `&userId=${userid}`;

      if (itemid && itemid != null) {
        url += `&Ids=${itemid}`;
      }

      let startIndex = params && params.startIndex !== undefined ? params.startIndex : 0;
      let increment = params && params.increment !== undefined ? params.increment : 200;
      let recursive = params && params.recursive !== undefined ? params.recursive : true;
      let limit = params && params.limit !== undefined ? params.limit : increment;
      let total = startIndex + increment;

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
            limit: limit,
            isMissing: false,
            excludeLocationTypes: "Virtual",
            sortBy: "DateCreated",
            sortOrder: "Descending",
          },
        });

        total = response?.data?.TotalRecordCount || 0;
        startIndex += increment;

        const result = response?.data?.Items || [];

        AllItems.push(...result);

        if (ws && syncTask && wsMessage) {
          ws(syncTask.wsKey, {
            type: "Update",
            message: `${wsMessage} - ${((Math.min(startIndex, total) / total) * 100).toFixed(2)}%`,
          });
        }

        if (
          response.data.TotalRecordCount === undefined ||
          (params && params.startIndex !== undefined) ||
          AllItems.length >= limit
        ) {
          break;
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
    let url = `${this.config.JF_HOST}/Shows/${SeriesId}/Seasons`;
    try {
      const response = await axios.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.config.JF_API_KEY,
        },
      });

      return response?.data?.Items?.filter((item) => item.LocationType !== "Virtual") || [];
    } catch (error) {
      this.#errorHandler(error, url);
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
          const admins = await this.getAdmins();
          if (admins.length > 0) {
            userid = admins[0].Id;
          }
        } else {
          userid = adminid;
        }
      }

      if (!userid || userid == null) {
        console.log("[JELLYFIN-API]: getRecentlyAdded - No Admins/UserIds found");
        return [];
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
      let result = response.data && Array.isArray(response.data) ? response.data : [];

      if (result.length > 0) {
        result = result.filter(
          (session) =>
            session.NowPlayingItem !== undefined &&
            session.NowPlayingItem.Type != "Trailer" &&
            session.NowPlayingItem.ProviderIds["prerolls.video"] == undefined
        );
      }
      return result;
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

  #isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (err) {
      return false;
    }
  }

  async validateSettings(url, apikey) {
    let result = { isValid: false, status: 400, errorMessage: "Invalid URL", url: url, cleanedUrl: "" };
    try {
      let _url = url.replace(/\/web\/index\.html#!\/home\.html$/, "");

      _url = _url.replace(/\/$/, "");
      if (!/^https?:\/\//i.test(_url)) {
        _url = "http://" + _url;
      }

      if (!url.includes("/emby")) {
        _url = _url + "/emby";
      }

      result.cleanedUrl = _url;

      console.log(_url, this.#isValidUrl(_url));
      if (!this.#isValidUrl(_url)) {
        return result;
      }

      const validation_url = _url.replace(/\/$/, "") + "/system/configuration";

      const response = await axios.get(validation_url, {
        headers: {
          "X-MediaBrowser-Token": apikey,
        },
      });
      result.isValid = response.status == 200;
      return result;
    } catch (error) {
      this.#errorHandler(error);
      result.isValid = false;
      result.status = error?.response?.status ?? 400;
      result.errorMessage =
        error?.response != null
          ? this.#httpErrorMessageHandler(error)
          : error.code == "ENOTFOUND"
          ? "Unable to connect. Please check the URL and your network connection."
          : error.message;
      return result;
    }
  }

  async systemInfo() {
    if (!this.configReady) {
      return [];
    }
    let url = `${this.config.JF_HOST}/system/info`;
    try {
      const response = await axios.get(url, {
        headers: {
          "X-MediaBrowser-Token": this.config.JF_API_KEY,
        },
      });

      return response?.data || {};
    } catch (error) {
      this.#errorHandler(error, url);
      return {};
    }
  }
}

module.exports = EmbyAPI;
