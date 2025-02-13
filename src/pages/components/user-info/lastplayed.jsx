import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import LastWatchedCard from "../general/last-watched-card";
import ErrorBoundary from "../general/ErrorBoundary";

import Config from "../../../lib/config";
import "../../css/users/user-details.css";
import { Trans } from "react-i18next";

function LastPlayed(props) {
  const [data, setData] = useState();
  const [config, setConfig] = useState();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.getConfig();
        setConfig(newConfig);
      } catch (error) {
        console.log(error);
      }
    };

    const fetchData = async () => {
      if (config) {
        try {
          const itemData = await axios.post(
            `/stats/getUserLastPlayed`,
            {
              userid: props.UserId,
            },
            {
              headers: {
                Authorization: `Bearer ${config.token}`,
                "Content-Type": "application/json",
              },
            }
          );
          setData(itemData.data);
        } catch (error) {
          console.log(error);
        }
      }
    };

    if (!data) {
      fetchData();
    }

    if (!config) {
      fetchConfig();
    }

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data, config, props.UserId]);

  if (!data || !config) {
    return <></>;
  }

  return (
    <div className="last-played">
      <h1 className="my-3">
        <Trans i18nKey="LAST_WATCHED" />
      </h1>
      <div className="last-played-container">
        {data.map((item, index) => (
          <ErrorBoundary key={`${item.Id}${item.EpisodeNumber}${index}`}>
            <LastWatchedCard data={item} base_url={config.settings?.EXTERNAL_URL ?? config.hostUrl} />
          </ErrorBoundary>
        ))}
      </div>
    </div>
  );
}

export default LastPlayed;
