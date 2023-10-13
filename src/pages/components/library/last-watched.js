import React, { useState, useEffect } from "react";
import axios from "axios";

// import ItemCardInfo from "./LastWatched/last-watched-card";

import LastWatchedCard from "../general/last-watched-card";

import Config from "../../../lib/config";
import "../../css/users/user-details.css";

function LibraryLastWatched(props) {
  const [data, setData] = useState();
  const [config, setConfig] = useState();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config();
        setConfig(newConfig);
      } catch (error) {
        console.log(error);
      }
    };

    const fetchData = async () => {
      try {
        const itemData = await axios.post(
          `/stats/getLibraryLastPlayed`,
          {
            libraryid: props.LibraryId,
          },
          {
            headers: {
              Authorization: `Bearer ${config.token}`,
              "Content-Type": "application/json",
            },
          },
        );
        setData(itemData.data);
      } catch (error) {
        console.log(error);
      }
    };

    if (!config) {
      fetchConfig();
    }

    if (!data && config) {
      fetchData();
    }

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data, config, props.LibraryId]);

  if (!data || !config) {
    return <></>;
  }

  return (
    <div className="last-played">
      <h1 className="my-3">Last Watched</h1>
      <div className="last-played-container">
        {data.map((item) => (
          <LastWatchedCard
            data={item}
            base_url={config.hostUrl}
            key={item.Id + item.SeasonNumber + item.EpisodeNumber}
          />
        ))}
      </div>
    </div>
  );
}

export default LibraryLastWatched;
