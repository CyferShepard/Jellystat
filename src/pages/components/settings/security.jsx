import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import CryptoJS from "crypto-js";
import EyeFillIcon from "remixicon-react/EyeFillIcon";
import EyeOffFillIcon from "remixicon-react/EyeOffFillIcon";

import Config from "../../../lib/config";

import "../../css/settings/settings.css";
import { InputGroup } from "react-bootstrap";
import { Trans } from "react-i18next";
import i18next from "i18next";

export default function SettingsConfig() {
  const [use_password, setuse_password] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [isSubmitted, setisSubmitted] = useState("");

  const [submissionMessage, setsubmissionMessage] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.getConfig();
        setuse_password(newConfig.requireLogin);
        setFormValues({ JS_USERNAME: newConfig.username });
      } catch (error) {
        console.log(error);
      }
    };

    fetchConfig();

    const intervalId = setInterval(fetchConfig, 60000 * 5);
    return () => clearInterval(intervalId);
  }, []);

  async function updateUser(_username, _current_password, _new_password) {
    const result = await axios
      .post(
        "/api/updateCredentials",
        {
          username: _username,
          current_password: _current_password,
          new_password: _new_password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      .catch((error) => {
        return error.response;
      });

    let data = result.data;
    return { isValid: data.isValid, errorMessage: data.errorMessage };
  }

  async function setRequireLogin(requireLogin) {
    await axios
      .post(
        "/api/setRequireLogin",
        {
          REQUIRE_LOGIN: requireLogin,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      .then((data) => {
        Config.setConfig();
        setuse_password(requireLogin);
      })
      .catch((error) => {
        // let errorMessage= `Error : ${error}`;
      });
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    setisSubmitted("");

    if (
      (formValues.JS_C_PASSWORD && !formValues.JS_PASSWORD) ||
      (formValues.JS_C_PASSWORD && formValues.JS_PASSWORD && formValues.JS_PASSWORD.length < 6)
    ) {
      setisSubmitted("Failed");
      setsubmissionMessage(i18next.t("ERROR_MESSAGES.PASSWORD_LENGTH"));
      return;
    }

    if (!formValues.JS_USERNAME || (formValues.JS_USERNAME && formValues.JS_USERNAME.length === 0)) {
      setisSubmitted("Failed");
      setsubmissionMessage(i18next.t("ERROR_MESSAGES.USERNAME_REQUIRED"));
      return;
    }
    let username = formValues.JS_USERNAME.toString();
    let hashedOldPassword;
    let hashedNewPassword;
    if (formValues.JS_C_PASSWORD) {
      hashedOldPassword = CryptoJS.SHA3(formValues.JS_C_PASSWORD).toString();
    }
    if (formValues.JS_PASSWORD) {
      hashedNewPassword = CryptoJS.SHA3(formValues.JS_PASSWORD).toString();
    }
    // let result = await updatePassword(hashedOldPassword, hashedNewPassword);
    let result = await updateUser(username, hashedOldPassword, hashedNewPassword);

    Config.setConfig();
    if (result.isValid) {
      setisSubmitted("Success");
      setsubmissionMessage(i18next.t("PASSWORD_UPDATE_SUCCESS"));
      return;
    } else {
      setisSubmitted("Failed");
      setsubmissionMessage(result.errorMessage);
      return;
    }
  }

  function handleFormChange(event) {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
  }

  function togglePasswordRequired(isRequired) {
    // console.log(isRequired);
    setRequireLogin(isRequired);
  }

  return (
    <div>
      <h1>
        <Trans i18nKey={"SETTINGS_PAGE.SECURITY"} />
      </h1>
      <Form onSubmit={handleFormSubmit} className="settings-form">
        <Form.Group as={Row} className="mb-3">
          <Form.Label column className="">
            <Trans i18nKey={"USERNAME"} />
          </Form.Label>
          <Col sm="10">
            <InputGroup>
              <Form.Control
                id="JS_USERNAME"
                name="JS_USERNAME"
                value={formValues.JS_USERNAME || ""}
                onChange={handleFormChange}
                autoComplete="username"
              />
            </InputGroup>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column className="">
            <Trans i18nKey={"SETTINGS_PAGE.CURRENT_PASSWORD"} />
          </Form.Label>
          <Col sm="10">
            <InputGroup>
              <Form.Control
                id="JS_C_PASSWORD"
                name="JS_C_PASSWORD"
                value={formValues.JS_C_PASSWORD || ""}
                onChange={handleFormChange}
                type={showCurrentPassword ? "text" : "password"}
                autoComplete="current-password"
              />
              <Button variant="outline-primary" type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                {showCurrentPassword ? <EyeFillIcon /> : <EyeOffFillIcon />}
              </Button>
            </InputGroup>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column className="">
            <Trans i18nKey={"SETTINGS_PAGE.NEW_PASSWORD"} />
          </Form.Label>
          <Col sm="10">
            <InputGroup>
              <Form.Control
                id="JS_PASSWORD"
                name="JS_PASSWORD"
                value={formValues.JS_PASSWORD || ""}
                onChange={handleFormChange}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
              />
              <Button variant="outline-primary" type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeFillIcon /> : <EyeOffFillIcon />}
              </Button>
            </InputGroup>
          </Col>
        </Form.Group>

        {isSubmitted !== "" ? (
          isSubmitted === "Failed" ? (
            <Alert bg="dark" data-bs-theme="dark" variant="danger">{submissionMessage}</Alert>
          ) : (
            <Alert bg="dark" data-bs-theme="dark" variant="success">{submissionMessage}</Alert>
          )
        ) : (
          <></>
        )}
        <div className="d-flex flex-column flex-md-row justify-content-end align-items-md-center">
          <Button variant="outline-success" type="submit">
            <Trans i18nKey={"SETTINGS_PAGE.UPDATE"} />
          </Button>
        </div>
      </Form>

      <Form className="settings-form">
        <Form.Group as={Row} className="mb-3">
          <Form.Label column className="">
            <Trans i18nKey={"SETTINGS_PAGE.REQUIRE_LOGIN"} />
          </Form.Label>
          <Col>
            <ToggleButtonGroup type="checkbox" className="d-flex">
              <ToggleButton
                variant="outline-primary"
                active={use_password}
                onClick={() => {
                  togglePasswordRequired(true);
                }}
              >
                <Trans i18nKey={"YES"} />
              </ToggleButton>
              <ToggleButton
                variant="outline-primary"
                active={!use_password}
                onClick={() => {
                  togglePasswordRequired(false);
                }}
              >
                <Trans i18nKey={"NO"} />
              </ToggleButton>
            </ToggleButtonGroup>
          </Col>
        </Form.Group>
      </Form>
    </div>
  );
}
