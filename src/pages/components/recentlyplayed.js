import React, { useState, useEffect } from "react";
// import axios from 'axios';
import Config from "../../lib/config";
import API from "../../classes/jellyfin-api";

import "../css/recent.css";
// import "../../App.css"

import RecentCard from "./recent-card";

import Loading from "./loading";

function RecentlyPlayed() {
  const [data, setData] = useState([]);
  const [base_url, setURL] = useState("");
  // const [errorHandler, seterrorHandler] = useState({ error_count: 0, error_message: '' })

  useEffect(() => {
    const _api = new API();
    const fetchData = () => {
      _api
        .getRecentlyPlayed("5f63950a2339462196eb8cead70cae7e", 10)
        .then((recentData) => {
          setData(recentData);
        });
    };

    Config()
      .then((config) => {
        setURL(config.hostUrl);
      })
      .catch((error) => {
        console.log(error);
      });

    const intervalId = setInterval(fetchData, 1000);
    return () => clearInterval(intervalId);
  }, []);

  if (!data || data.length === 0) {
    return <Loading />;
  }

  return (
    <div className="recent">
      {data &&
        data
          .sort((a, b) =>
            b.UserData.LastPlayedDate.localeCompare(a.UserData.LastPlayedDate)
          )
          .map((recent) => (
            <RecentCard data={{ recent: recent, base_url: base_url }} />
          ))}
    </div>
  );
}

export default RecentlyPlayed;
