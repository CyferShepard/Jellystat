import React, { useState, useEffect } from "react";
import axios from "axios";

import RecentlyAddedCard from "./RecentlyAdded/recently-added-card";

import Config from "../../../lib/config";
import "../../css/users/user-details.css";

function RecentlyPlayed(props) {
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
        let url=`${config.hostUrl}/users/5f63950a2339462196eb8cead70cae7e/Items/latest?parentId=${props.LibraryId}`;
        const itemData = await axios.get(url, {
          headers: {
            "X-MediaBrowser-Token": config.apiKey,
          },
        });
        console.log(itemData);
        setData(itemData.data);
      } catch (error) {
        console.log(error);
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
  }, [data,config, props.LibraryId]);

  console.log(data);

  if (!data || !config) {
    return <></>;
  }

  return (
    <div className="last-played">
        <h1>Recently Added</h1>
        <div className="last-played-container">
        {data.filter((item) => ["Series", "Movie","Audio"].includes(item.Type)).map((item) => (
                    <RecentlyAddedCard data={item} base_url={config.hostUrl} key={item.Id}/>
          ))}

        </div>

    </div>
  );
}

export default RecentlyPlayed;
