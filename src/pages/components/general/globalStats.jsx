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

  const [prefs, setPrefs] = useState(
    localStorage.getItem("PREF_GLOBAL_STATS") != undefined ? JSON.parse(localStorage.getItem("PREF_GLOBAL_STATS")) : []
  );

  function fetchStats(hours = 24, setMethod = setDayStats) {
    axios
      .post(
        `/stats/${props.endpoint ?? "getGlobalUserStats"}`,
        {
          hours: hours,
          [props.param]: props.id,
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
        if (!prefs.includes("1")) fetchStats(24, setDayStats);
        if (!prefs.includes("7")) fetchStats(24 * 7, setWeekStats);
        if (!prefs.includes("30")) fetchStats(24 * 30, setMonthStats);
        if (!prefs.includes("180")) fetchStats(24 * 180, setd180Stats);
        if (!prefs.includes("365")) fetchStats(24 * 365, setd365Stats);
        if (!prefs.includes("ALL")) fetchStats(24 * 999, setAllStats);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [props.id, token]);

  return (
    <div>
      <h1 className="py-3">{props.title}</h1>
      <div className="global-stats-container">
        {!prefs.includes("1") && <WatchTimeStats data={dayStats} heading={<Trans i18nKey="GLOBAL_STATS.LAST_24_HRS" />} />}
        {!prefs.includes("7") && <WatchTimeStats data={weekStats} heading={<Trans i18nKey="GLOBAL_STATS.LAST_7_DAYS" />} />}
        {!prefs.includes("30") && <WatchTimeStats data={monthStats} heading={<Trans i18nKey="GLOBAL_STATS.LAST_30_DAYS" />} />}
        {!prefs.includes("180") && <WatchTimeStats data={d180Stats} heading={<Trans i18nKey="GLOBAL_STATS.LAST_180_DAYS" />} />}
        {!prefs.includes("365") && <WatchTimeStats data={d365Stats} heading={<Trans i18nKey="GLOBAL_STATS.LAST_365_DAYS" />} />}
        {!prefs.includes("ALL") && <WatchTimeStats data={allStats} heading={<Trans i18nKey="GLOBAL_STATS.ALL_TIME" />} />}
      </div>
    </div>
  );
}

export default GlobalStats;
