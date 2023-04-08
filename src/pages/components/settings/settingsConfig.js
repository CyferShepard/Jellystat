import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../../../lib/config";
import Loading from "../general/loading";
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';



import "../../css/settings.css";
import { ButtonGroup } from "react-bootstrap";

export default function SettingsConfig() {
  const [config, setConfig] = useState(null);
  const [showKey, setKeyState] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [isSubmitted, setisSubmitted] = useState("");
  const [loadSate, setloadSate] = useState("Loading");
  const [submissionMessage, setsubmissionMessage] = useState("");

  useEffect(() => {
    Config()
      .then((config) => {
        setFormValues({ JF_HOST: config.hostUrl, JF_API_KEY: config.apiKey });
        setConfig(config);
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
    axios
      .post("/api/setconfig/", formValues, {
        headers: {
          Authorization: `Bearer ${config.token}`,
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
      <div className="general-settings-page">
        <h1>General Settings</h1>
        <Form onSubmit={handleFormSubmit} className="settings-form">
          <Form.Group as={Row} className="mb-3" controlId="form_jellyfin_url">
            <Form.Label column className="fs-4">
              Jellyfin Url
            </Form.Label>
            <Col sm="10">
              <Form.Control  id="JF_HOST" name="JF_HOST" value={formValues.JF_HOST || ""} onChange={handleFormChange}  placeholder="http://127.0.0.1:8096 or http://example.jellyfin.server" />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="form_api_key">
            <Form.Label column  className="fs-4">
              API Key
            </Form.Label>
            <Col sm="10">
              <Form.Control id="JF_API_KEY"  value={formValues.JF_API_KEY || ""} onChange={handleFormChange} type={showKey ? "text" : "password"} />
            </Col>
          </Form.Group>
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
          <div className="d-flex flex-column flex-sm-row justify-content-end align-items-sm-center">
            <ButtonGroup >
              <Button variant="outline-success" type="submit"> Save </Button>
              <Button variant="outline-secondary" type="button" onClick={() => setKeyState(!showKey)}>Show Key</Button>
            </ButtonGroup>
          </div>
        </Form>

      </div>
      );


}