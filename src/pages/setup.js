import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../lib/config";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { InputGroup, Row } from "react-bootstrap";

import EyeFillIcon from "remixicon-react/EyeFillIcon";
import EyeOffFillIcon from "remixicon-react/EyeOffFillIcon";
import logo_dark from "./images/icon-b-512.png";

import "./css/setup.css";
const token = localStorage.getItem("token");

function Setup() {
  const [config, setConfig] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [processing, setProcessing] = useState(false);
  const [submitButtonText, setsubmitButtonText] = useState(
    "Save Jellyfin Details",
  );
  const [showPassword, setShowPassword] = useState(false);

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
      .post(
        "/api/validateSettings",
        {
          url: _url,
          apikey: _apikey,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )
      .catch((error) => {});

    let data = result.data;
    return { isValid: data.isValid, errorMessage: data.errorMessage };
  }

  async function handleFormSubmit(event) {
    setProcessing(true);
    event.preventDefault();

    let validation = await validateSettings(
      formValues.JF_HOST,
      formValues.JF_API_KEY,
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
      <div className="form-box d-flex flex-column">
        <img
          src={logo_dark}
          style={{ height: "100px" }}
          className="px-2"
          alt=""
        />
        <h1>Jellystat</h1>
        <span className="fts-text">First Time Setup Step 2 of 2</span>

        <Form onSubmit={handleFormSubmit} className="mt-5">
          <Form.Group as={Row} className="inputbox">
            <Form.Control
              id="JF_HOST"
              name="JF_HOST"
              value={formValues.JF_HOST || ""}
              onChange={handleFormChange}
              placeholder=" "
            />

            <Form.Label column>URL</Form.Label>
          </Form.Group>

          <Form.Group as={Row} className="inputbox">
            <InputGroup>
              <Form.Control
                className="px-0"
                id="JF_API_KEY"
                name="JF_API_KEY"
                value={formValues.JF_API_KEY || ""}
                onChange={handleFormChange}
                type={showPassword ? "text" : "password"}
                placeholder=" "
              />
              <Button
                className="login-show-password"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeFillIcon /> : <EyeOffFillIcon />}
              </Button>
              <Form.Label column>API Key</Form.Label>
            </InputGroup>
          </Form.Group>

          <Button type="submit" className="setup-button">
            {processing ? "Validating..." : submitButtonText}
          </Button>
        </Form>
      </div>
    </section>
  );
}

export default Setup;
