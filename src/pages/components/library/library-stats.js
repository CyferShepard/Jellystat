import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../css/globalstats.css";

import WatchTimeStats from "./globalstats/watchtimestats";

function LibraryGlobalStats(props) {
  const [dayStats, setDayStats] = useState({});
  const [weekStats, setWeekStats] = useState({});
  const [monthStats, setMonthStats] = useState({});
  const [allStats, setAllStats] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dayData = await axios.post(`/stats/getGlobalLibraryStats`, {
          hours: (24*1),
          libraryid: props.LibraryId,
        });
        setDayStats(dayData.data);

        const weekData = await axios.post(`/stats/getGlobalLibraryStats`, {
          hours: (24*7),
          libraryid: props.LibraryId,
        });
        setWeekStats(weekData.data);

        const monthData = await axios.post(`/stats/getGlobalLibraryStats`, {
          hours: (24*30),
          libraryid: props.LibraryId,
        });
        setMonthStats(monthData.data);

        const allData = await axios.post(`/stats/getGlobalLibraryStats`, {
          hours: (24*999),
          libraryid: props.LibraryId,
        });
        setAllStats(allData.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [props.LibraryId]);

  return (
    <div>
      <h1>Library Stats</h1>
      <div  className="global-stats-container">
        <WatchTimeStats data={dayStats} heading={"Last 24 Hours"} />
        <WatchTimeStats data={weekStats} heading={"Last 7 Days"} />
        <WatchTimeStats data={monthStats} heading={"Last 30 Days"} />
        <WatchTimeStats data={allStats} heading={"All Time"} />
      </div>
    </div>
  );
}

export default LibraryGlobalStats;
