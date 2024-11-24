import { useState } from "react";

import MVLibraries from "./statCards/mv_libraries";
import MVMovies from "./statCards/mv_movies";
import MVSeries from "./statCards/mv_series";
import MostUsedClient from "./statCards/most_used_client";
import MostActiveUsers from "./statCards/most_active_users";
import MPSeries from "./statCards/mp_series";
import MPMovies from "./statCards/mp_movies";
import MVMusic from "./statCards/mv_music";
import MPMusic from "./statCards/mp_music";

import "../css/statCard.css";
import { Trans } from "react-i18next";
import PlaybackMethodStats from "./statCards/playback_method_stats";

function HomeStatisticCards() {
  const [days, setDays] = useState(localStorage.getItem("PREF_HOME_STAT_DAYS") ?? 30);
  const [input, setInput] = useState(localStorage.getItem("PREF_HOME_STAT_DAYS") ?? 30);

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      if (input < 1) {
        setInput(1);
        setDays(0);
      } else {
        setDays(parseInt(input));
        localStorage.setItem("PREF_HOME_STAT_DAYS", input);
      }

      console.log(days);
    }
  };
  return (
    <div className="watch-stats">
      <div className="Heading my-3">
        <h1>
          <Trans i18nKey="HOME_PAGE.WATCH_STATISTIC" />
        </h1>
        <div className="date-range">
          <div className="header">
            <Trans i18nKey="LAST" />
          </div>
          <div className="days">
            <input
              type="number"
              min={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="trailer">
            <Trans i18nKey="UNITS.DAYS" />
          </div>
        </div>
      </div>
      <div className="grid-stat-cards">
        <MVMovies days={days} />
        <MPMovies days={days} />
        <MVSeries days={days} />
        <MPSeries days={days} />
        <MVMusic days={days} />
        <MPMusic days={days} />
        <MVLibraries days={days} />
        <MostUsedClient days={days} />
        <MostActiveUsers days={days} />
        <PlaybackMethodStats days={days} />
      </div>
    </div>
  );
}

export default HomeStatisticCards;
