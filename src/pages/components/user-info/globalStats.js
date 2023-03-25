import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../css/users/globalstats.css";

import WatchTimeStats from "./globalstats/watchtimestats";

function GlobalStats(props) {
  const [dayStats, setDayStats] = useState({});
  const [weekStats, setWeekStats] = useState({});
  const [monthStats, setMonthStats] = useState({});
  const [allStats, setAllStats] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dayData = await axios.post(`/stats/getGlobalUserStats`, {
          hours: (24*1),
          userid: props.UserId,
        });
        setDayStats(dayData.data);

        const weekData = await axios.post(`/stats/getGlobalUserStats`, {
          hours: (24*7),
          userid: props.UserId,
        });
        setWeekStats(weekData.data);

        const monthData = await axios.post(`/stats/getGlobalUserStats`, {
          hours: (24*30),
          userid: props.UserId,
        });
        setMonthStats(monthData.data);

        const allData = await axios.post(`/stats/getGlobalUserStats`, {
          hours: (24*999),
          userid: props.UserId,
        });
        setAllStats(allData.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [props.UserId]);

  return (
    <div>
      <h1>User Stats</h1>
      <div  className="global-stats-container">
        <WatchTimeStats data={dayStats} heading={"Last 24 Hours"} />
        <WatchTimeStats data={weekStats} heading={"Last 7 Days"} />
        <WatchTimeStats data={monthStats} heading={"Last 30 Days"} />
        <WatchTimeStats data={allStats} heading={"All Time"} />
      </div>
    </div>
  );
}

export default GlobalStats;
