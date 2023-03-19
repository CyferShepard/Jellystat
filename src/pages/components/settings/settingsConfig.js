import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../../../lib/config";
import Loading from "../loading";

import "../../css/settings.css";

export default function SettingsConfig() {

      // const [config, setConfig] = useState({});
  const [formValues, setFormValues] = useState({});
  const [isSubmitted, setisSubmitted] = useState("");
  const [loadSate, setloadSate] = useState("Loading");
  const [submissionMessage, setsubmissionMessage] = useState("");

  useEffect(() => {
    Config()
      .then((config) => {
        setFormValues({ JF_HOST: config.hostUrl, JF_API_KEY: config.apiKey });
        setloadSate("Loaded");
      })
      .catch((error) => {
        console.log("Error updating config:", error);
        setloadSate("Critical");
        setsubmissionMessage(
          "Error Retrieving Configuration. Unable to contact Backend Server"
        );
      });
  }, []);

  async function validateSettings(_url, _apikey) {
    let isValid = false;
    let errorMessage = "";
    await axios
      .get(_url + "/system/configuration", {
        headers: {
          "X-MediaBrowser-Token": _apikey,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          isValid = true;
        }
      })
      .catch((error) => {
        // console.log(error.code);
        if (error.code === "ERR_NETWORK") {
          isValid = false;
          errorMessage = `Error : Unable to connect to Jellyfin Server`;
        } else if (error.response.status === 401) {
          isValid = false;
          errorMessage = `Error: ${error.response.status} Not Authorized. Please check API key`;
        } else if (error.response.status === 404) {
          isValid = false;
          errorMessage = `Error ${error.response.status}: The requested URL was not found.`;
        } else {
          isValid = false;
          errorMessage = `Error : ${error.response.status}`;
        }
      });

    return { isValid: isValid, errorMessage: errorMessage };
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    let validation = await validateSettings(
      formValues.JF_HOST,
      formValues.JF_API_KEY
    );
    console.log(validation);
    if (!validation.isValid) {
      setisSubmitted("Failed");
      setsubmissionMessage(validation.errorMessage);
      return;
    }

    setisSubmitted("");

    // Send a POST request to /api/setconfig/ with the updated configuration
    axios
      .post("/api/setconfig/", formValues, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        console.log("Config updated successfully:", response.data);
        setisSubmitted("Success");
        setsubmissionMessage("Success Updated Configuration");
      })
      .catch((error) => {
        console.log("Error updating config:", error);
        setisSubmitted("Failed");
        setsubmissionMessage("Error Updating Configuration: ", error);
      });
  }

  function handleFormChange(event) {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
  }
  if (loadSate === "Loading") {
    return <Loading />;
  }

  if (loadSate === "Critical") {
    return <div className="submit critical">{submissionMessage}</div>;
  }




    return (
        <form onSubmit={handleFormSubmit} className="settings-form">
          <div>
            <label htmlFor="JF_HOST">Jellyfin Server</label>
            <input
              type="text"
              id="JF_HOST"
              name="JF_HOST"
              value={formValues.JF_HOST || ""}
              onChange={handleFormChange}
            />
          </div>
          <div>
            <label htmlFor="JF_API_KEY">API Key</label>
            <input
              type="text"
              id="JF_API_KEY"
              name="JF_API_KEY"
              value={formValues.JF_API_KEY || ""}
              onChange={handleFormChange}
            />
          </div>
    
          {isSubmitted !== "" ? (
            <div
              className={
                isSubmitted === "Failed" ? "submit error" : "submit success"
              }
            >
              {submissionMessage}
            </div>
          ) : (
            <></>
          )}
    
          <button type="submit">Save</button>
        </form>
      );


}