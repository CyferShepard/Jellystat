import React, { useState, useEffect } from "react";
import axios from '../../../lib/axios_instance';
import Config from "../../../lib/config";
// import API from "../../../classes/jellyfin-api";

import "../../css/sessions.css";
import ErrorBoundary from "../general/ErrorBoundary";
import SessionCard from "./session-card";

import Loading from "../general/loading";

function Sessions() {
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

    const getSubtitleStream = (row) => {
      let result = 'No subtitles';

      if(!row.PlayState) {
        return result;
      }

      let subStreamIndex = row.PlayState.SubtitleStreamIndex;

      if(subStreamIndex === undefined || subStreamIndex === -1) {
        return result;
      }

      if(row.NowPlayingItem.MediaStreams && row.NowPlayingItem.MediaStreams.length) {
        result = `Subtitles: ${row.NowPlayingItem.MediaStreams[subStreamIndex].DisplayTitle}`;
      }

      return result;
  }

    const fetchData = () => {

      if (config) {
        const url = `/proxy/getSessions`;

        axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
          cache: false,
        })
          .then((data) => {
            if(data && typeof data.data === 'object' && Array.isArray(data.data))
            {
              let toSet = data.data.filter(row => row.NowPlayingItem !== undefined);
              toSet.forEach(s => s.NowPlayingItem.SubtitleStream = getSubtitleStream(s));
              setData(toSet);
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
              <ErrorBoundary key={session.Id} >
                <SessionCard data={{ session: session, base_url: config.base_url }} />
              </ErrorBoundary>
            ))}
      </div>
    </div>
  );
}

export default Sessions;
