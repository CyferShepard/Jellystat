import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../lib/config";

import "./css/library/libraries.css";
// import "./css/users/users.css";

import Loading from "./components/general/loading";
import LibraryCard from "./components/library/library-card";



function Libraries() {
  const [data, setData] = useState();
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
        const url = `/stats/getLibraryStats`;
        axios
          .get(url, {
            headers: {
              Authorization: `Bearer ${config.token}`,
              "Content-Type": "application/json",
            },
          })
          .then((data) => {
            console.log("data");
            setData(data.data);
            console.log(data);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    };


    if (!config) {
      fetchConfig();
    }

    if (!data) {
      fetchLibraries();
    }

    const intervalId = setInterval(fetchLibraries, 60000 * 60);
    return () => clearInterval(intervalId);
  }, [data, config]);

  if (!data || !config) {
    return <Loading />;
  }

  return (
    <div className="libraries">
      <h1>Libraries</h1>
      <div className="libraries-container">
      {data &&
          data.map((item) => (

              <LibraryCard key={item.Id} data={item} base_url={config.hostUrl}/>

            ))}
      </div>
      
    </div>
  );
}

export default Libraries;
