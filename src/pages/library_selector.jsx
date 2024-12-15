import { useState, useEffect } from "react";
import axios from "../lib/axios_instance";
import Config from "../lib/config";

import "./css/library/libraries.css";
import Loading from "./components/general/loading";
import SelectionCard from "./components/LibrarySelector/SelectionCard";
import ErrorBoundary from "./components/general/ErrorBoundary";
import InformationLineIcon from "remixicon-react/InformationLineIcon";

import { Tooltip } from "@mui/material";
import { Trans } from "react-i18next";

function LibrarySelector() {
  const [data, setData] = useState();
  const [config, setConfig] = useState(null);

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

    const fetchLibraries = () => {
      if (config) {
        const url = `/api/TrackedLibraries`;
        axios
          .get(url, {
            headers: {
              Authorization: `Bearer ${config.token}`,
              "Content-Type": "application/json",
            },
          })
          .then((data) => {
            setData(data.data);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    };

    if (!config) {
      fetchConfig();
    }

    fetchLibraries();
    const intervalId = setInterval(fetchLibraries, 60000 * 60);
    return () => clearInterval(intervalId);
  }, [config]);

  if (!data) {
    return <Loading />;
  }

  return (
    <div className="libraries">
      <h1 className="py-4">
        <Trans i18nKey={"SETTINGS_PAGE.SELECT_LIBRARIES_TO_IMPORT"} />{" "}
        <Tooltip title={<Trans i18nKey={"SETTINGS_PAGE.SELECT_LIBRARIES_TO_IMPORT_TOOLTIP"} />}>
          <span>
            {" "}
            <InformationLineIcon />
          </span>
        </Tooltip>
      </h1>

      <div xs={1} md={2} lg={4} className="g-0 libraries-container">
        {data &&
          data.map((item) => (
            <ErrorBoundary key={item.Id}>
              <SelectionCard data={item} base_url={config.settings?.EXTERNAL_URL ?? config.hostUrl} />
            </ErrorBoundary>
          ))}
      </div>
    </div>
  );
}

export default LibrarySelector;
