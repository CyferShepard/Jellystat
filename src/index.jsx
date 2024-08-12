import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";

import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";

import i18n from "i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import Loading from "./pages/components/general/loading.jsx";
import routes from "./routes.jsx";

const baseUrl = import.meta.env.JS_BASE_URL ?? "/";
const validBaseUrls = [...new Set([baseUrl, ...routes.map((route) => "/" + route.path.split("/")[1])])];
const locationBase = "/" + window.location.pathname.split("/")[1];

if (!validBaseUrls.includes(locationBase)) {
  window.location.assign(baseUrl);
}

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en-UK",
    debug: false,
    detection: {
      order: ["cookie", "localStorage", "sessionStorage", "navigator", "htmlTag", "querystring", "path", "subdomain"],
      cache: ["cookie"],
    },
    interpolation: {
      escapeValue: false,
    },
  })
  .then(() => {
    ReactDOM.createRoot(document.getElementById("root")).render(
      <React.StrictMode>
        <Suspense fallback={<Loading />} />
        <BrowserRouter basename={import.meta.env.JS_BASE_URL ?? "/"}>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  });
