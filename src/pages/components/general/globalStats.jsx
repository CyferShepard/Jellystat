import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import "../../css/globalstats.css";

import WatchTimeStats from "./globalstats/watchtimestats";
import { Trans } from "react-i18next";
import { Checkbox, FormControlLabel, IconButton, Menu } from "@mui/material";
import { GridMoreVertIcon } from "@mui/x-data-grid";

function GlobalStats(props) {
  const [dayStats, setDayStats] = useState({});
  const [weekStats, setWeekStats] = useState({});
  const [monthStats, setMonthStats] = useState({});
  const [d180Stats, setd180Stats] = useState({});
  const [d365Stats, setd365Stats] = useState({});
  const [allStats, setAllStats] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [prefs, setPrefs] = useState(
    localStorage.getItem("PREF_GLOBAL_STATS") != undefined ? JSON.parse(localStorage.getItem("PREF_GLOBAL_STATS")) : [180, 365]
  );

  const token = localStorage.getItem("token");

  const stats = [
    {
      key: 1,
      heading: <Trans i18nKey="GLOBAL_STATS.LAST_24_HRS" />,
      data: dayStats,
      setMethod: setDayStats,
    },
    {
      key: 7,
      heading: <Trans i18nKey="GLOBAL_STATS.LAST_7_DAYS" />,
      data: weekStats,
      setMethod: setWeekStats,
    },
    {
      key: 30,
      heading: <Trans i18nKey="GLOBAL_STATS.LAST_30_DAYS" />,
      data: monthStats,
      setMethod: setMonthStats,
    },
    {
      key: 180,
      heading: <Trans i18nKey="GLOBAL_STATS.LAST_180_DAYS" />,
      data: d180Stats,
      setMethod: setd180Stats,
    },
    {
      key: 365,
      heading: <Trans i18nKey="GLOBAL_STATS.LAST_365_DAYS" />,
      data: d365Stats,
      setMethod: setd365Stats,
    },
    {
      key: 9999,
      heading: <Trans i18nKey="GLOBAL_STATS.ALL_TIME" />,
      data: allStats,
      setMethod: setAllStats,
    },
  ];

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

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
        for (let i = 0; i < stats.length; i++) {
          if (!prefs.includes(stats[i].key)) fetchStats(24 * stats[i].key, stats[i].setMethod);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [props.id, token]);

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  function toggleStat(stat) {
    let newPrefs = prefs;
    if (newPrefs.includes(stat.key)) {
      newPrefs = newPrefs.filter((item) => item !== stat.key);
      fetchStats(24 * stat.key, stat.setMethod);
    } else {
      newPrefs = [...newPrefs, stat.key];
    }
    setPrefs(newPrefs);
    localStorage.setItem("PREF_GLOBAL_STATS", JSON.stringify(newPrefs));
  }

  return (
    <div>
      <div className="d-flex flex-row justify-content-between">
        <h1 className="py-3">{props.title}</h1>
        <IconButton aria-label="more" aria-controls="long-menu" aria-haspopup="true" onClick={handleMenuOpen}>
          <GridMoreVertIcon />
        </IconButton>

        <Menu
          id="long-menu"
          anchorEl={anchorEl}
          keepMounted
          open={open}
          onClose={handleMenuClose}
          sx={{
            "& .MuiPaper-root": {
              backgroundColor: `var(--background-color)`,
              color: "#fff",
              minWidth: "200px",
            },
            "& .MuiMenuItem-root": {
              "&:hover": {
                backgroundColor: "#555",
              },
            },
          }}
        >
          {stats.map((stat) => {
            return (
              <div key={stat.key} style={{ padding: "10px" }}>
                <FormControlLabel
                  control={<Checkbox checked={!prefs.includes(stat.key)} onChange={() => toggleStat(stat)} />}
                  label={stat.heading}
                />
              </div>
            );
          })}
        </Menu>
      </div>
      <div className="global-stats-container">
        {stats.map((stat) => {
          if (!prefs.includes(stat.key)) return <WatchTimeStats key={stat.key} data={stat.data} heading={stat.heading} />;
        })}
      </div>
    </div>
  );
}

export default GlobalStats;
