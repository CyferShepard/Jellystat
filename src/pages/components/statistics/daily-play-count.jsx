import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import Chart from "./chart";

import "../../css/stats.css";
import { Trans } from "react-i18next";

function DailyPlayStats(props) {

  const [stats, setStats] = useState();
  const [libraries, setLibraries] = useState();
  const [days, setDays] = useState(20);
  const token = localStorage.getItem("token");
  


  
  useEffect(() => {
    const fetchLibraries = () => {
      const url = `/stats/getViewsOverTime`;

      axios
        .post(
          url,
          { days: props.days },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
        .then((data) => {
          setStats(data.data.stats);
          setLibraries(data.data.libraries);
        })
        .catch((error) => {
          console.log(error);
        });
    };

    if (!stats) {
      fetchLibraries();
    }
    if (days !== props.days) {
      setDays(props.days);
      fetchLibraries();
    }

    const intervalId = setInterval(fetchLibraries, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [stats,libraries, days, props.days, token]);

  if (!stats) {
    return <></>;
  }

  if (stats.length === 0) {
    return (
      <div className="main-widget">
        <h1><Trans i18nKey={"STAT_PAGE.DAILY_PLAY_PER_LIBRARY"}/> - {days} <Trans i18nKey={`UNITS.DAY${days>1 ? 'S':''}`}/></h1>

        <h5><Trans i18nKey={"ERROR_MESSAGES.NO_STATS"}/></h5>
      </div>
    );
  }
  return (
    <div className="main-widget">
      <h2 className="text-start my-2"><Trans i18nKey={"STAT_PAGE.DAILY_PLAY_PER_LIBRARY"}/> - <Trans i18nKey={"LAST"}/> {days} <Trans i18nKey={`UNITS.DAY${days>1 ? 'S':''}`}/></h2>

      <div className="graph">
         <Chart libraries={libraries} stats={stats} />
      </div>
    </div>
  );
}

export default DailyPlayStats;
