import React, { useState, useEffect } from "react";

import axios from "axios";

import "./css/activity.css";
import Config from "../lib/config";

import ActivityTable from "./components/activity/activity-table";
import Loading from "./components/general/loading";

function Activity() {
  const [data, setData] = useState();
  const [config, setConfig] = useState(null);

  const [itemCount, setItemCount] = useState(10);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config();
        setConfig(newConfig);
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
          console.log(error);
        }
      }
    };

    const fetchLibraries = () => {
      const url = `/api/getHistory`;
      axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
        })
        .then((data) => {
          setData(data.data);
        })
        .catch((error) => {
          console.log(error);
        });
    };

    if (!data && config) {
      fetchLibraries();
    }

    if (!config) {
      fetchConfig();
    }

    const intervalId = setInterval(fetchLibraries, 60000 * 60);
    return () => clearInterval(intervalId);
  }, [data, config]);

  if (!data) {
    return <Loading />;
  }

  if (data.length === 0) {
    return (
      <div>
        <div className="Heading">
          <h1>Activity</h1>
        </div>
        <div className="Activity">
          <h1>No Activity to display</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="Activity">
      <div className="Heading">
        <h1>Activity</h1>
        <div className="pagination-range">
          <div className="header">Items</div>
          <select
            value={itemCount}
            onChange={(event) => {
              setItemCount(event.target.value);
            }}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
      <div className="Activity">
        <ActivityTable data={data} itemCount={itemCount} />
      </div>
    </div>
  );
}

export default Activity;
