import React, { useState, useEffect } from "react";
import axios from 'axios';
import Config from "../../../lib/config";
// import API from "../../../classes/jellyfin-api";

import "../../css/sessions.css";
// import "../../App.css"

import SessionCard from "./session-card";

import Loading from "../general/loading";

function Sessions() {
  const [data, setData] = useState();

  const [config, setConfig] = useState();
  // const [errorHandler, seterrorHandler] = useState({ error_count: 0, error_message: '' })

  useEffect(() => {

    const fetchConfig = async () => {
      try {
        const newConfig = await Config();
        setConfig(newConfig);
      } catch (error) {
          console.log(error);
      }
    };

    const fetchData = () => {

      if (config) {
        const url = `/api/getSessions`;

        axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
        })
          .then((data) => {
            if(data && typeof data.data === 'object' && Array.isArray(data.data))
            {
              setData(data.data.filter(row => row.NowPlayingItem !== undefined));
            }

          })
          .catch((error) => {
            console.log(error);
          });
      }
    };
 

    if (!config) {
      fetchConfig();
    }else
    if(!data)
    {
      fetchData();
    }

    const intervalId = setInterval(fetchData, 1000);
    return () => clearInterval(intervalId);
  }, [data,config]);

  if (!data && !config) {
    return <Loading />;
  }


  if ((!data && config) || data.length === 0) {
    return(
    <div>
      <h1  className="my-3">Sessions</h1>
      <div style={{color:"grey", fontSize:"0.8em", fontStyle:"italic"}}>
      No Active Sessions Found
      </div>
    </div>);
  }

  return (
    <div>
      <h1  className="my-3">Sessions</h1>
      <div className="sessions-container">
        {data && data.length>0 &&
          data
            .sort((a, b) =>
              a.Id.padStart(12, "0").localeCompare(b.Id.padStart(12, "0"))
            )
            .map((session) => (
              <SessionCard key={session.Id} data={{ session: session, base_url: config.base_url }} />
            ))}
      </div>
    </div>
  );
}

export default Sessions;
