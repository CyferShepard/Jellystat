import { useState } from "react";

import "./css/stats.css";

import DailyPlayStats from "./components/statistics/daily-play-count";
import PlayStatsByDay from "./components/statistics/play-stats-by-day";
import PlayStatsByHour from "./components/statistics/play-stats-by-hour";
import { Trans } from "react-i18next";

function Statistics() {
  const [days, setDays] = useState(20);
  const [input, setInput] = useState(20); 

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      if (input < 1) {
        setInput(1);
        setDays(0);
      } else {
        setDays(parseInt(input));
      }

      console.log(days);
    }
  };

  return (
    <div className="watch-stats">
      <div className="Heading">
        <h1><Trans i18nKey={"STAT_PAGE.STATISTICS"}/></h1>
        <div className="date-range">
          <div className="header"><Trans i18nKey={"LAST"}/></div>
          <div className="days">
            <input
              type="number"
              min={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="trailer"><Trans i18nKey={`UNITS.DAY${days>1 ? 'S':''}`}/></div>
        </div>
      </div>
      <div>
        <DailyPlayStats days={days} />

        <div className="statistics-graphs">
          <PlayStatsByDay days={days} />
          <PlayStatsByHour days={days} />
        </div>
      </div>
    </div>
  );
}

export default Statistics;
