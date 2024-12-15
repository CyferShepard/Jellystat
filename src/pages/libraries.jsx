import { useState, useEffect } from "react";
import axios from "../lib/axios_instance";
import Config from "../lib/config";

import "./css/library/libraries.css";
import Loading from "./components/general/loading";
import LibraryCard from "./components/library/library-card";
import ErrorBoundary from "./components/general/ErrorBoundary";
import EyeOffFillIcon from "remixicon-react/EyeOffFillIcon";
import EyeFillIcon from "remixicon-react/EyeFillIcon";
import { Tooltip } from "react-bootstrap";
import { Trans } from "react-i18next";
import i18next from "i18next";

function Libraries() {
  const [data, setData] = useState();
  const [metadata, setMetaData] = useState();
  const [config, setConfig] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

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
        const url = `/stats/getLibraryCardStats`;
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

        const metadataurl = `/stats/getLibraryMetadata`;

        axios
          .get(metadataurl, {
            headers: {
              Authorization: `Bearer ${config.token}`,
              "Content-Type": "application/json",
            },
          })
          .then((data) => {
            setMetaData(data.data);
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

  if (!data || !metadata) {
    return <Loading />;
  }

  return (
    <div className="libraries">
      <div className="d-flex flex-row justify-content-between align-items-center">
        <h1 className="py-4">
          <Trans i18nKey="LIBRARIES" />
        </h1>
        {data.filter((library) => library.archived === true).length > 0 &&
          (showArchived ? (
            <Tooltip title={i18next.t("HIDE_ARCHIVED_LIBRARIES")} className="tooltip-icon-button">
              <button className="btn" onClick={() => setShowArchived(!showArchived)}>
                <EyeFillIcon />
              </button>
            </Tooltip>
          ) : (
            <Tooltip title={i18next.t("SHOW_ARCHIVED_LIBRARIES")} className="tooltip-icon-button">
              <button className="btn" onClick={() => setShowArchived(!showArchived)}>
                <EyeOffFillIcon />
              </button>
            </Tooltip>
          ))}
      </div>

      <div xs={1} md={2} lg={4} className="g-0 libraries-container">
        {data &&
          data
            .filter((library) => library.archived === false || library.archived === showArchived)
            .sort((a, b) => a.Name - b.Name)
            .map((item) => (
              <ErrorBoundary key={item.Id}>
                <LibraryCard
                  data={item}
                  metadata={metadata.find((data) => data.Id === item.Id)}
                  base_url={config.settings?.EXTERNAL_URL ?? config.hostUrl}
                />
              </ErrorBoundary>
            ))}
      </div>
    </div>
  );
}

export default Libraries;
