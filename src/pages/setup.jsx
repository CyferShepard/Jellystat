import { useState, useEffect } from "react";
import axios from "../lib/axios_instance";
import Config from "../lib/config";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { InputGroup, Row } from "react-bootstrap";

import EyeFillIcon from "remixicon-react/EyeFillIcon";
import EyeOffFillIcon from "remixicon-react/EyeOffFillIcon";
import logo_dark from "./images/icon-b-512.png";

import "./css/setup.css";
import i18next from "i18next";
import { Trans } from "react-i18next";

function Setup() {
  const [config, setConfig] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [processing, setProcessing] = useState(false);
  const [submitButtonText, setsubmitButtonText] = useState(i18next.t("SAVE_JELLYFIN_DETAILS"));
  const [showPassword, setShowPassword] = useState(false);

  function handleFormChange(event) {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
  }
  async function beginSync() {
    await axios
      .get("/sync/beginSync", {
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
      })
      .catch((error) => {
        console.log(error);
      });
  }

  async function handleFormSubmit(event) {
    setProcessing(true);
    event.preventDefault();

    // Send a POST request to /api/setconfig/ with the updated configuration
    axios
      .post("/auth/configSetup/", formValues)
      .then(async () => {
        await Config.setConfig();
        setsubmitButtonText(i18next.t("SETTINGS_SAVED"));
        setProcessing(false);
        setTimeout(async () => {
          setTimeout(async () => {
            beginSync();
            window.location.href = "/";
          }, 1000);
        }, 1000);

        return;
      })
      .catch((error) => {
        let errorMessage = "";
        if (error.code === "ERR_NETWORK") {
          errorMessage = i18next.t("ERROR_MESSAGES.NETWORK_ERROR");
        } else if (error.response.status === 401) {
          errorMessage = i18next.t("ERROR_MESSAGES.INVALID_LOGIN");
        } else if (error.response.status === 404) {
          errorMessage = i18next.t("ERROR_MESSAGES.INVALID_URL").replace("{STATUS}", error.response.status);
        } else {
          errorMessage = `Error : ${error.errorMessage ?? error.response.status}`;
        }
        console.log(error);
        setsubmitButtonText(errorMessage);
        setProcessing(false);
      });
  }

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.getConfig();
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
        <img src={logo_dark} style={{ height: "100px" }} className="px-2" alt="" />
        <h1>
          <Trans i18nKey={"JELLYSTAT"} />
        </h1>
        <span className="fts-text">{i18next.t("FT_SETUP_PROGRESS").replace("{STEP}", "2").replace("{TOTAL}", "2")}</span>

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
                autoComplete="off"
              />
              <Button className="login-show-password" type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeFillIcon /> : <EyeOffFillIcon />}
              </Button>
              <Form.Label column>
                <Trans i18nKey={"SETTINGS_PAGE.API_KEY"} />
              </Form.Label>
            </InputGroup>
          </Form.Group>

          <Button type="submit" className="setup-button">
            {processing ? `${i18next.t("VALIDATING")}...` : submitButtonText}
          </Button>
        </Form>
      </div>
    </section>
  );
}

export default Setup;
