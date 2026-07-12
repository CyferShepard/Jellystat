import { useState, useEffect } from "react";
import axios from "../lib/axios_instance";
import Config from "../lib/config";
import CryptoJS from "crypto-js";
import "./css/setup.css";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { InputGroup, Row } from "react-bootstrap";

import EyeFillIcon from "remixicon-react/EyeFillIcon";
import EyeOffFillIcon from "remixicon-react/EyeOffFillIcon";
import logo_dark from "./images/icon-b-512.png";

// import LibrarySync from "./components/settings/librarySync";

import Loading from "./components/general/loading";
import { Trans } from "react-i18next";
import i18next from "i18next";
import { getServerIconUrl, getServerSplashscreenUrl, getThemeSettings, JELLYFIN_ICON_URL } from "../lib/theme";
import baseUrl from "../lib/baseurl";

function Login() {
  const [config, setConfig] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [submitButtonText, setsubmitButtonText] = useState(i18next.t("LOGIN"));
  const [loginProvider, setLoginProvider] = useState("jellystat");
  const [quickConnectEnabled, setQuickConnectEnabled] = useState(false);
  const [quickConnectState, setQuickConnectState] = useState({ status: "idle" });
  const themeSettings = getThemeSettings();
  const selectedIcon = themeSettings.icon || themeSettings.brand;
  const selectedSplash = themeSettings.splash || "off";
  const serverName =
    config?.serverName ||
    (() => {
      try {
        return config?.hostUrl ? new URL(config.hostUrl).hostname : "Server";
      } catch {
        return "Server";
      }
    })();

  function handleFormChange(event) {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
  }

  async function handleFormSubmit(event) {
    setProcessing(true);
    event.preventDefault();

    if (loginProvider === "jellyfin") {
      beginLogin(formValues.JS_USERNAME, formValues.JS_PASSWORD, "/auth/jellyfinLogin");
      return;
    }

    const hashedPassword = CryptoJS.SHA3(formValues.JS_PASSWORD).toString();
    beginLogin(formValues.JS_USERNAME, hashedPassword, "/auth/login");
  }

  async function beginLogin(JS_USERNAME, password, endpoint = "/auth/login") {
    axios
      .post(
        endpoint,
        {
          username: JS_USERNAME,
          password: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then(async (response) => {
        handleLoginSuccess(response);
      })
      .catch((error) => {
        let errorMessage = `Error : ${error.response?.status ?? error.code}`;
        if (error.code === "ERR_NETWORK") {
          errorMessage = i18next.t("ERROR_MESSAGES.NETWORK_ERROR");
        } else if (error.response?.status === 401) {
          errorMessage = i18next.t("ERROR_MESSAGES.INVALID_LOGIN");
        } else if (error.response?.status === 403) {
          errorMessage = "Jellyfin administrator account required";
        } else if (error.response?.status === 404) {
          errorMessage = i18next.t("ERROR_MESSAGES.INVALID_URL").replace("{STATUS}", error.response.status);
        }
        if (JS_USERNAME) {
          setsubmitButtonText(errorMessage);
        }

        setProcessing(false);
      });
  }

  async function handleLoginSuccess(response) {
    localStorage.setItem("token", response.data.token);
    setProcessing(false);
    await Config.setConfig();
    setsubmitButtonText(i18next.t("SUCCESS"));
    window.location.reload();
  }

  async function copyQuickConnectCode(code) {
    if (!code) {
      return false;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
        return true;
      }
    } catch {
      // Fall through to the textarea fallback below.
    }

    const input = document.createElement("textarea");
    input.value = code;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.focus();
    input.select();

    const copied = document.execCommand("copy");
    document.body.removeChild(input);
    return copied;
  }

  async function handleQuickConnectCopy() {
    const copied = await copyQuickConnectCode(quickConnectState.code);
    setQuickConnectState((currentState) => ({
      ...currentState,
      copied: copied,
      copyAttempted: true,
    }));
  }

  async function handleQuickConnectStart() {
    setQuickConnectState({ status: "starting" });
    try {
      const response = await axios.post("/auth/jellyfinQuickConnect/initiate");
      const code = response.data.Code || response.data.code;
      const authorizeUrl = response.data.AuthorizeUrl || response.data.authorizeUrl;
      const copied = await copyQuickConnectCode(code);

      if (authorizeUrl) {
        window.open(authorizeUrl, "_blank", "noopener,noreferrer");
      }

      setQuickConnectState({
        status: "pending",
        code: code,
        secret: response.data.Secret || response.data.secret,
        copied: copied,
        copyAttempted: true,
        authorizeUrl: authorizeUrl,
      });
    } catch (error) {
      const status = error.response?.status;
      setQuickConnectState({
        status: "error",
        message: status === 401 || status === 403 ? "Quick Connect unavailable" : `Error : ${status ?? error.code}`,
      });
    }
  }

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.setConfig();
        setConfig(newConfig);
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
          if (error.response.status !== 401 && error.response.status !== 403) {
            // console.log(error);
          }
        }
      }
    };

    if (!config) {
      fetchConfig();
      beginLogin();
    }
  }, [config]);

  useEffect(() => {
    if (!config) {
      setQuickConnectEnabled(false);
      return;
    }

    axios
      .get("/auth/jellyfinQuickConnect/enabled")
      .then((response) => setQuickConnectEnabled(response.data.enabled))
      .catch(() => setQuickConnectEnabled(false));
  }, [config]);

  useEffect(() => {
    if (quickConnectState.status !== "pending" || !quickConnectState.secret) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const statusResponse = await axios.get("/auth/jellyfinQuickConnect/status", {
          params: { secret: quickConnectState.secret },
        });

        const isAuthenticated = statusResponse.data.Authenticated || statusResponse.data.authenticated;
        if (!isAuthenticated) {
          return;
        }

        clearInterval(interval);
        setQuickConnectState((currentState) => ({ ...currentState, status: "approved" }));
        const loginResponse = await axios.post("/auth/jellyfinQuickConnect/login", {
          secret: quickConnectState.secret,
        });
        await handleLoginSuccess(loginResponse);
      } catch (error) {
        const status = error.response?.status;
        clearInterval(interval);
        setQuickConnectState({
          status: "error",
          message: status === 403 ? "Jellyfin administrator account required" : `Error : ${status ?? error.code}`,
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [quickConnectState.secret, quickConnectState.status]);

  if (!config || config.token) {
    return <Loading />;
  }

  return (
    <section
      className={`login-page${selectedSplash === "server" ? " has-server-splash" : ""}`}
      style={selectedSplash === "server" ? { backgroundImage: `url(${getServerSplashscreenUrl(baseUrl)})` } : undefined}
    >
      <div className="form-box login-card d-flex flex-column">
        <div className="login-brand">
          {selectedIcon === "server" ? (
            <img className="login-server-icon" src={getServerIconUrl(baseUrl)} alt="" />
          ) : selectedIcon === "jellyfin" ? (
            <img className="login-jellyfin-logo" src={JELLYFIN_ICON_URL} alt="" />
          ) : (
            <img src={logo_dark} alt="" />
          )}
          <h1>
            {selectedIcon === "server" ? serverName : selectedIcon === "jellyfin" ? "Jellyfin" : <Trans i18nKey={"JELLYSTAT"} />}
          </h1>
        </div>

        <Form onSubmit={handleFormSubmit} className="login-form">
          <div className="login-provider-toggle">
            <Button
              type="button"
              className={loginProvider === "jellystat" ? "active" : ""}
              onClick={() => {
                setLoginProvider("jellystat");
                setsubmitButtonText(i18next.t("LOGIN"));
              }}
            >
              Jellystat
            </Button>
            <Button
              type="button"
              className={loginProvider === "jellyfin" ? "active" : ""}
              onClick={() => {
                setLoginProvider("jellyfin");
                setsubmitButtonText(i18next.t("LOGIN"));
              }}
            >
              Jellyfin
            </Button>
          </div>

          <Form.Group as={Row} className="inputbox">
            <Form.Control
              id="JS_USERNAME"
              name="JS_USERNAME"
              value={formValues.JS_USERNAME || ""}
              onChange={handleFormChange}
              placeholder=" "
            />

            <Form.Label column>
              <Trans i18nKey={"USERNAME"} />
            </Form.Label>
          </Form.Group>

          <Form.Group as={Row} className="inputbox">
            <InputGroup>
              <Form.Control
                className="px-0"
                id="JS_PASSWORD"
                name="JS_PASSWORD"
                value={formValues.JS_PASSWORD || ""}
                onChange={handleFormChange}
                type={showPassword ? "text" : "password"}
                placeholder=" "
              />
              <Button className="login-show-password" type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeFillIcon /> : <EyeOffFillIcon />}
              </Button>
              <Form.Label column>
                <Trans i18nKey={"PASSWORD"} />
              </Form.Label>
            </InputGroup>
          </Form.Group>

          <Button type="submit" className="setup-button">
            {processing ? `${i18next.t("VALIDATING")}...` : submitButtonText}
          </Button>

          {loginProvider === "jellyfin" && quickConnectEnabled && (
            <div className="quick-connect-panel">
              {quickConnectState.status === "pending" || quickConnectState.status === "approved" ? (
                <>
                  <div className="quick-connect-code">{quickConnectState.code}</div>
                  <div className="quick-connect-status">
                    {quickConnectState.status === "approved"
                      ? "Approved"
                      : quickConnectState.copied
                      ? "Code copied. Approve it in Jellyfin."
                      : quickConnectState.copyAttempted
                      ? "Could not copy automatically. Use Copy code."
                      : "Copy this code, then approve it in Jellyfin."}
                  </div>
                  <Button type="button" className="quick-connect-copy" onClick={handleQuickConnectCopy}>
                    {quickConnectState.copied ? "Copied" : "Copy code"}
                  </Button>
                  {quickConnectState.authorizeUrl && (
                    <Button
                      type="button"
                      className="quick-connect-link"
                      onClick={() => window.open(quickConnectState.authorizeUrl, "_blank", "noopener,noreferrer")}
                    >
                      Open Jellyfin
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  type="button"
                  className="quick-connect-button"
                  disabled={quickConnectState.status === "starting"}
                  onClick={handleQuickConnectStart}
                >
                  {quickConnectState.status === "starting" ? "Starting..." : "Quick Connect"}
                </Button>
              )}
              {quickConnectState.status === "error" && <div className="quick-connect-error">{quickConnectState.message}</div>}
            </div>
          )}
        </Form>
      </div>
    </section>
  );
}

export default Login;
