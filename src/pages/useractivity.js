import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../lib/config";

import AccountCircleFillIcon from "remixicon-react/AccountCircleFillIcon";

import "./css/usersactivity.css";

import Loading from "./components/loading";

function UserActivity() {
  const [data, setData] = useState([]);
  const [config, setConfig] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  function handleSort(key) {
    const direction =
      sortConfig.key === key && sortConfig.direction === "ascending"
        ? "descending"
        : "ascending";
    setSortConfig({ key, direction });
  }

  function sortData(data, { key, direction }) {
    if (!key) return data;

    const sortedData = [...data];

    sortedData.sort((a, b) => {
      if (a[key] < b[key]) return direction === "ascending" ? -1 : 1;
      if (a[key] > b[key]) return direction === "ascending" ? 1 : -1;
      return 0;
    });

    return sortedData;
  }

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

    const fetchData = () => {
      if (config) {
        const url = `${config.hostUrl}/user_usage_stats/user_activity?days=9999`;
        const apiKey = config.apiKey;

        axios
          .get(url, {
            headers: {
              "X-MediaBrowser-Token": apiKey,
            },
          })
          .then((data) => {
            console.log("data");
            setData(data.data);
            console.log(data);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    };

    if (!config) {
      fetchConfig();
    }

    if (data.length === 0) {
      fetchData();
    }

    const intervalId = setInterval(fetchData, 60000);
    return () => clearInterval(intervalId);
  }, [data, config]);

  if (!data || data.length === 0) {
    return <Loading />;
  }
  const sortedData = sortData(data, sortConfig);
  return (
    <div className="Users">
      <h1>Users</h1>
      <table className="user-activity-table">
        <thead>
          <tr>
            <th></th>
            <th onClick={() => handleSort("user_name")}>User</th>
            <th onClick={() => handleSort("item_name")}>Last Watched</th>
            <th onClick={() => handleSort("client_name")}>Last Client</th>
            <th onClick={() => handleSort("total_count")}>Total Plays</th>
            <th onClick={() => handleSort("total_play_time")}>
              Total Watch Time
            </th>
            <th onClick={() => handleSort("last_seen")}>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => (
            <tr key={item.user_id}>
              <td>
                {item.has_image ? (
                  <img
                    className="card-user-image"
                    src={
                      config.hostUrl +
                      "/Users/" +
                      item.user_id +
                      "/Images/Primary?quality=10"
                    }
                    alt=""
                  />
                ) : (
                  <AccountCircleFillIcon color="#fff" size={30} />
                )}
              </td>
              <td>{item.user_name}</td>
              <td>{item.item_name}</td>
              <td>{item.client_name}</td>
              <td>{item.total_count}</td>
              <td>{item.total_play_time}</td>
              <td>{item.last_seen} ago</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserActivity;
