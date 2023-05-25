import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../lib/config";

import "./css/library/libraries.css";
import Loading from "./components/general/loading";
import LibraryCard from "./components/library/library-card";



function Libraries() {
  const [data, setData] = useState();
  const [metadata, setMetaData] = useState();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config();
        setConfig(newConfig);
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
          console.log(error);
        }
      }
    };

    const fetchLibraries = () => {
      if(config)
      {
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
  }, [ config]);

  if (!data || !metadata) {
    return <Loading />;
  }

  return (
    <div className="libraries">
      <h1 className="py-4">Libraries</h1>

      <div xs={1} md={2} lg={4} className="g-0 libraries-container">
      {data &&
          data.map((item) => (
    
                <LibraryCard key={item.Id} data={item} metadata={metadata.find(data => data.Id === item.Id)} base_url={config.hostUrl}/>
     

            ))}
      </div>
      
    </div>
  );
}

export default Libraries;
