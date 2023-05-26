import React, { useState, useEffect } from "react";
import axios from "axios";

import RecentlyAddedCard from "./RecentlyAdded/recently-added-card";

import Config from "../../../lib/config";
import "../../css/users/user-details.css";

function RecentlyAdded(props) {
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
        let url=`/stats/getRecentlyAdded`;
        if(props.LibraryId)
        {
            url+=`?libraryid=${props.LibraryId}`;
        }
     
        const itemData = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
        });
        
        if(itemData && typeof itemData.data === 'object' && Array.isArray(itemData.data))
        {
          setData(itemData.data.filter((item) => ["Series", "Movie","Audio"].includes(item.Type)));
        }
      } catch (error) {
        console.log(error);
      }
    };

    if (!data && config) {
      fetchData();
    }

    if (!config) {
        fetchConfig();
    }

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data,config, props.LibraryId]);


  if (!data && !config) {
    return <></>;
  }

  if (!data && config) {
    return <></>;
  }

  return (
    <div className="last-played">
        <h1 className="my-3">Recently Added</h1>
        <div className="last-played-container">
        {data && data.map((item) => (
                    <RecentlyAddedCard data={item} base_url={config.hostUrl} key={item.Id}/>
          ))}

        </div>

    </div>
  );
}

export default RecentlyAdded;
