import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";

import "../../css/stats.css";
import { Trans } from "react-i18next";
import PlayMethodChart from "./play-method-chart";

function PlayMethodStats(props) {
  const [stats, setStats] = useState();
  const [types, setTypes] = useState();
  const [hours, setHours] = useState(999);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchLibraries = () => {
      const url = `/stats/getLibraryItemsPlayMethodStats`;

      axios
        .post(
          url,
          {
            hours: 999,
            libraryid: props.libraryid ?? "a656b907eb3a73532e40e44b968d0225",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
        .then((data) => {
          setStats(data.data.stats);
          setTypes(data.data.types);
        })
        .catch((error) => {
          console.log(error);
        });
    };

    if (!stats) {
      fetchLibraries();
    }
    if (hours !== props.hours) {
      setHours(props.hours);
      fetchLibraries();
    }

    const intervalId = setInterval(fetchLibraries, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [hours, props.hours, token]);

  if (!stats) {
    return <></>;
  }

  if (stats.length === 0) {
    return (
      <div className="main-widget">
        <h1>
          <Trans i18nKey={"STAT_PAGE.DAILY_PLAY_PER_LIBRARY"} /> - {hours} <Trans i18nKey={`UNITS.HOUR${hours > 1 ? "S" : ""}`} />
        </h1>

        <h5>
          <Trans i18nKey={"ERROR_MESSAGES.NO_STATS"} />
        </h5>
      </div>
    );
  }
  return (
    <div className="main-widget">
      <h2 className="text-start my-2">
        <Trans i18nKey={"STAT_PAGE.DAILY_PLAY_PER_LIBRARY"} /> - <Trans i18nKey={"LAST"} /> {hours}{" "}
        <Trans i18nKey={`UNITS.HOUR${hours > 1 ? "S" : ""}`} />
      </h2>

      <div className="graph">
        <PlayMethodChart types={types} stats={stats} />
      </div>
    </div>
  );
}

export default PlayMethodStats;
