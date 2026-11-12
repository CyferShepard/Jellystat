import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";

import "./pages/css/variables.css";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./pages/css/width_breakpoint_css.css";
import "./pages/css/radius_breakpoint_css.css";

import i18n from "i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import Loading from "./pages/components/general/loading.jsx";
import baseUrl from "./lib/baseurl.jsx";

// PWA: register the service worker (only available on HTTPS or localhost)
if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${baseUrl}/sw.js`, { scope: `${baseUrl}/` }).catch((e) => console.log("SW:", e));
  });
}

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en-GB",
    debug: false,
    backend: {
      loadPath: `${baseUrl}/locales/{{lng}}/{{ns}}.json`,
    },
    detection: {
      order: ["cookie", "localStorage", "sessionStorage", "navigator", "htmlTag", "querystring", "path", "subdomain"],
      cache: ["cookie"],
    },
    interpolation: {
      escapeValue: false,
    },
  })
  .then(() => {
    createRoot(document.getElementById("root")).render(
      <React.StrictMode>
        <Suspense fallback={<Loading />}>
          <BrowserRouter basename={baseUrl}>
            <App />
          </BrowserRouter>
        </Suspense>
      </React.StrictMode>
    );
  });
