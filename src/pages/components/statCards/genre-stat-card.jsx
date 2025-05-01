import { useState, useEffect } from "react";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

import ErrorBoundary from "../general/ErrorBoundary.jsx";

import "../../css/genres.css";
import { Trans } from "react-i18next";
import i18next from "i18next";

function GenreStatCard(props) {
  const [maxRange, setMaxRange] = useState(100);
  const [data, setData] = useState(props.data);

  useEffect(() => {
    const maxDuration = props.data.reduce((max, item) => {
      return Math.max(max, parseFloat((props.dataKey == "duration" ? item.duration : item.plays) || 0));
    }, 0);
    setMaxRange(maxDuration);

    let sorted = [...props.data]
      .sort((a, b) => {
        const valueA = parseFloat(props.dataKey === "duration" ? a.duration : a.plays) || 0;
        const valueB = parseFloat(props.dataKey === "duration" ? b.duration : b.plays) || 0;
        return valueB - valueA; // Descending order
      })
      .slice(0, 15); // Take only the top 10

    // Sort top 10 genres alphabetically
    sorted = sorted.sort((a, b) => a.genre.localeCompare(b.genre));

    setData(sorted);
  }, [props.data, props.dataKey]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="radial-tooltip">
          <p className="tooltip-header">{payload[0].payload.genre}</p>
          <p>
            {props.dataKey == "duration"
              ? formatTotalWatchTime(payload[0].value)
              : `${payload[0].value} ${i18next.t("UNITS.PLAYS")}`}
          </p>
        </div>
      );
    }
    return null;
  };

  function formatTotalWatchTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let timeString = "";

    if (hours > 0) {
      timeString += `${hours} ${hours === 1 ? i18next.t("UNITS.HOUR").toLowerCase() : i18next.t("UNITS.HOURS").toLowerCase()} `;
    }

    if (minutes > 0) {
      timeString += `${minutes} ${
        minutes === 1 ? i18next.t("UNITS.MINUTE").toLowerCase() : i18next.t("UNITS.MINUTES").toLowerCase()
      } `;
    }

    if (remainingSeconds > 0) {
      timeString += `${remainingSeconds} ${
        remainingSeconds === 1 ? i18next.t("UNITS.SECOND").toLowerCase() : i18next.t("UNITS.SECONDS").toLowerCase()
      }`;
    }

    return timeString.trim();
  }

  return (
    <div className="genre-stats">
      <h1 className="my-3 text-center">
        <Trans i18nKey={props.dataKey == "duration" ? "SETTINGS_PAGE.DURATION" : "TOTAL_PLAYS"} />
      </h1>
      <ErrorBoundary>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid gridType="circle" />
            <PolarAngleAxis dataKey="genre" />
            <PolarRadiusAxis domain={[0, maxRange]} tick={false} axisLine={false} />
            <Radar
              name="Duration"
              dataKey={props.dataKey}
              stroke={`var(--tertiary-background-color)`}
              fill={`var(--secondary-color)`}
              fillOpacity={0.6}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </ErrorBoundary>
    </div>
  );
}

export default GenreStatCard;
