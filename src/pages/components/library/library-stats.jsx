import { useState, useEffect } from "react";
import axios from "axios";
import "../../css/globalstats.css";

import WatchTimeStats from "./globalstats/watchtimestats";
import { Trans } from "react-i18next";

function LibraryGlobalStats(props) {
  const [dayStats, setDayStats] = useState({});
  const [weekStats, setWeekStats] = useState({});
  const [monthStats, setMonthStats] = useState({});
  const [allStats, setAllStats] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dayData = await axios.post(`/stats/getGlobalLibraryStats`, {
          hours: (24*1),
          libraryid: props.LibraryId,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setDayStats(dayData.data);

        const weekData = await axios.post(`/stats/getGlobalLibraryStats`, {
          hours: (24*7),
          libraryid: props.LibraryId,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setWeekStats(weekData.data);

        const monthData = await axios.post(`/stats/getGlobalLibraryStats`, {
          hours: (24*30),
          libraryid: props.LibraryId,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setMonthStats(monthData.data);

        const allData = await axios.post(`/stats/getGlobalLibraryStats`, {
          hours: (24*999),
          libraryid: props.LibraryId,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setAllStats(allData.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [props.LibraryId,token]);

  return (
    <div>
      <h1 className="my-3"><Trans i18nKey="LIBRARY_INFO.LIBRARY_STATS"/></h1>
      <div  className="global-stats-container">
      <WatchTimeStats data={dayStats} heading={<Trans i18nKey="GLOBAL_STATS.LAST_24_HRS"/>} />
        <WatchTimeStats data={weekStats} heading={<Trans i18nKey="GLOBAL_STATS.LAST_7_DAYS"/>} />
        <WatchTimeStats data={monthStats} heading={<Trans i18nKey="GLOBAL_STATS.LAST_30_DAYS"/>} />
        <WatchTimeStats data={allStats} heading={<Trans i18nKey="GLOBAL_STATS.ALL_TIME"/>} />
      </div>
    </div>
  );
}

export default LibraryGlobalStats;
