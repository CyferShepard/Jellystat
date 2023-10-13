import React, { useState, useEffect } from "react";
import axios from "axios";
import Chart from "./chart";
import "../../css/stats.css";

function PlayStatsByHour(props) {
  const [stats, setStats] = useState();
  const [libraries, setLibraries] = useState();
  const [days, setDays] = useState(20);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchLibraries = () => {
      const url = `/stats/getViewsByHour`;

      axios
        .post(
          url,
          { days: props.days },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
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
  }, [stats, libraries, days, props.days, token]);

  if (!stats) {
    return <></>;
  }

  if (stats.length === 0) {
    return (
      <div className="statistics-widget small">
        <h1>Play Count By Hour - Last {days} Days</h1>

        <h1>No Stats to display</h1>
      </div>
    );
  }

  return (
    <div className="statistics-widget">
      <h2 className="text-start my-2">Play Count By Hour - Last {days} Days</h2>
      <div className="graph small">
        <Chart libraries={libraries} stats={stats} />
      </div>
    </div>
  );
}

export default PlayStatsByHour;
