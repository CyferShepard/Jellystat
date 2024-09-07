import  { useState, useEffect } from "react";
import axios from "../../lib/axios_instance";

import "../css/users/users.css";

import Loading from "./loading";

function PlaybackActivity() {
  const [data, setData] = useState([]);
//   const [config, setConfig] = useState(null);
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


    const fetchData = () => {
      
        axios
          .get('/stats/getPlaybackActivity')
          .then((data) => {
            console.log("data");
            setData(data.data);
            console.log(data);
          })
          .catch((error) => {
            console.log(error);
          });
    };


    if (data.length === 0) {
      fetchData();
    }

    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, [data]);

  function convertSecondsToHMS(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }
  const options = {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  };

  if (!data || data.length === 0) {
    return <Loading />;
  }
  const sortedData = sortData(data, sortConfig);
  return (
    <div className="Users">
      <h1>Playback Activity</h1>
      <table className="user-activity-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("UserName")}>User</th>
            <th onClick={() => handleSort("NowPlayingItemName")}>Watched</th>
            <th onClick={() => handleSort("NowPlayingItemName")}>Episode</th>
            <th onClick={() => handleSort("PlaybackDuration")}>Playback Duration</th>
            <th onClick={() => handleSort("ActivityDateInserted")}>Playback Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => (
            <tr key={item.user_id}>
              <td>{item.UserName}</td>
              <td>{item.SeriesName || item.NowPlayingItemName}</td>
              <td>{item.SeriesName ? item.NowPlayingItemName: '' }</td>
              <td>{convertSecondsToHMS(item.PlaybackDuration)}</td>
              <td>{new Date(item.ActivityDateInserted).toLocaleString("en-GB", options)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PlaybackActivity;
