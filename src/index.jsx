import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";

import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";

import i18n from "i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import Loading from "./pages/components/general/loading.jsx";
import baseUrl from "./lib/baseurl.jsx";

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
