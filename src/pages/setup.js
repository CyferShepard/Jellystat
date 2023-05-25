import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../lib/config";

import "./css/setup.css";
const token = localStorage.getItem('token');
// import LibrarySync from "./components/settings/librarySync";

// import Loading from './components/loading';

function Setup() {
  const [config, setConfig] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [processing, setProcessing] = useState(false);
  const [submitButtonText, setsubmitButtonText] = useState("Save");

  function handleFormChange(event) {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
  }
  async function beginSync() {


      setProcessing(true);
      await axios
      .get("/sync/beingSync", {
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        if (response.status === 200) {
          // isValid = true;
        }
      })
      .catch((error) => {
         console.log(error);
      });
      setProcessing(false);
  }

  async function validateSettings(_url, _apikey) {
    const result = await axios
    .post("/api/validateSettings", {
      url:_url,
      apikey: _apikey

    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    .catch((error) => {
     
    });

    let data=result.data;
    return { isValid:data.isValid, errorMessage:data.errorMessage} ;
  }

  async function handleFormSubmit(event) {
    setProcessing(true);
    event.preventDefault();

    let validation = await validateSettings(
      formValues.JF_HOST,
      formValues.JF_API_KEY
    );

    if (!validation.isValid) {
      setsubmitButtonText(validation.errorMessage);
      setProcessing(false);
      return;
    }

    // Send a POST request to /api/setconfig/ with the updated configuration
    axios
      .post("/api/setconfig/", formValues, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
      })
      .then(async (response) => {
        setsubmitButtonText("Settings Saved");
        setProcessing(false);
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
        await beginSync();

        return;
      })
      .catch((error) => {
        let errorMessage = "";
        if (error.code === "ERR_NETWORK") {
          errorMessage = `Unable to connect to Jellyfin Server`;
        } else if (error.response.status === 401) {
          errorMessage = `Error ${error.response.status} Unauthorized`;
        } else if (error.response.status === 404) {

          errorMessage = `Error ${error.response.status}: The requested URL was not found.`;
        } else {

          errorMessage = `Error : ${error.response.status}`;
        }
        console.log(error);
        setsubmitButtonText(errorMessage);
        setProcessing(false);
      });
  }

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config();
        setConfig(newConfig);
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
          console.log(error);
        }
      }
    };

    if (!config) {
      fetchConfig();
    }
  }, [config]);

  return (
    <section>
      <div className="form-box">
        <form onSubmit={handleFormSubmit}>
          <h2>Setup</h2>
          <div className="inputbox">
            <input
              type="text"
              id="JF_HOST"
              name="JF_HOST"
              value={formValues.JF_HOST || ""}
              onChange={handleFormChange}
              required
            />
            <label htmlFor="JF_HOST">Server URL</label>
          </div>
          <div className="inputbox">
            <input
              type="text"
              id="JF_API_KEY"
              name="JF_API_KEY"
              value={formValues.JF_API_KEY || ""}
              onChange={handleFormChange}
              required
            />
            <label htmlFor="JF_API_KEY">API Key</label>
          </div>

          <button type="submit" className="setup-button">
            {processing ? "Validating..." : submitButtonText}
          </button>
        </form>
      </div>
    </section>
  );
}

export default Setup;
