import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import "../../css/globalstats.css";

import WatchTimeStats from "./globalstats/watchtimestats";
import { Trans } from "react-i18next";

function GlobalStats(props) {
  const [dayStats, setDayStats] = useState({});
  const [weekStats, setWeekStats] = useState({});
  const [monthStats, setMonthStats] = useState({});
  const [d180Stats, setd180Stats] = useState({});
  const [d365Stats, setd365Stats] = useState({});
  const [allStats, setAllStats] = useState({});
  const token = localStorage.getItem("token");

  function fetchStats(hours = 24, setMethod = setDayStats) {
    axios
      .post(
        `/stats/getGlobalUserStats`,
        {
          hours: hours,
          userid: props.UserId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      .then((dayData) => {
        setMethod(dayData.data);
      });
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        fetchStats(24, setDayStats);
        fetchStats(24 * 7, setWeekStats);
        fetchStats(24 * 30, setMonthStats);
        fetchStats(24 * 180, setd180Stats);
        fetchStats(24 * 365, setd365Stats);
        fetchStats(24 * 999, setAllStats);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [props.UserId, token]);

  return (
    <div>
      <h1 className="py-3">
        <Trans i18nKey="USERS_PAGE.USER_STATS" />
      </h1>
      <div className="global-stats-container">
        <WatchTimeStats data={dayStats} heading={<Trans i18nKey="GLOBAL_STATS.LAST_24_HRS" />} />
        <WatchTimeStats data={weekStats} heading={<Trans i18nKey="GLOBAL_STATS.LAST_7_DAYS" />} />
        <WatchTimeStats data={monthStats} heading={<Trans i18nKey="GLOBAL_STATS.LAST_30_DAYS" />} />
        <WatchTimeStats data={d180Stats} heading={<Trans i18nKey="GLOBAL_STATS.LAST_180_DAYS" />} />
        <WatchTimeStats data={d365Stats} heading={<Trans i18nKey="GLOBAL_STATS.LAST_365_DAYS" />} />
        <WatchTimeStats data={allStats} heading={<Trans i18nKey="GLOBAL_STATS.ALL_TIME" />} />
      </div>
    </div>
  );
}

export default GlobalStats;
