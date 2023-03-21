import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../lib/config";
import { Link } from 'react-router-dom';
import AccountCircleFillIcon from "remixicon-react/AccountCircleFillIcon";

import "./css/users.css";

import Loading from "./components/loading";

function Users() {
  const [data, setData] = useState([]);
  const [config, setConfig] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemCount,setItemCount] = useState(10);

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

  function formatTime(time) {
    const units = {
      days: ['Day', 'Days'],
      hours: ['Hour', 'Hours'],
      minutes: ['Minute', 'Minutes'],
      seconds: ['Second', 'Seconds']
    };
  
    let formattedTime = '';
  
    for (const unit in units) {
      if (time[unit]) {
        const unitName = units[unit][time[unit] > 1 ? 1 : 0];
        formattedTime += `${time[unit]} ${unitName} `;
      }
    }
  
    return `${formattedTime}ago`;
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
        const url = `/stats/getAllUserActivity`;

        axios
          .get(url)
          .then((data) => {
            console.log(data);
            setData(data.data);
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
 
  const indexOfLastUser = currentPage * itemCount;
  const indexOfFirstUser = indexOfLastUser - itemCount;
  const currentUsers = sortedData.slice(indexOfFirstUser, indexOfLastUser);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(sortedData.length / itemCount); i++) {
    pageNumbers.push(i);
  }


  return (
    <div className="Users">
      <div className="Heading">
      <h1>All Users</h1>
      <div className="pagination-range">
          <div className="header">Items</div>
          <select value={itemCount} onChange={(event) => {setItemCount(event.target.value); setCurrentPage(1);}}>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
        </div>
      </div>

      <table className="user-activity-table">
        <thead>
          <tr>
            <th></th>
            <th onClick={() => handleSort("UserName")}>User</th>
            <th onClick={() => handleSort("LastWatched")}>Last Watched</th>
            <th onClick={() => handleSort("LastClient")}>Last Client</th>
            <th onClick={() => handleSort("TotalPlays")}>Total Plays</th>
            <th onClick={() => handleSort("TotalWatchTime")}>Total Watch Time</th>
            <th onClick={() => handleSort("LastSeen")}>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {currentUsers.map((item) => (
            <tr key={item.UserId}>
              <td>
                {item.PrimaryImageTag ? (
                  <img
                    className="card-user-image"
                    src={
                      config.hostUrl +
                      "/Users/" +
                      item.UserId +
                      "/Images/Primary?quality=10"
                    }
                    alt=""
                  />
                ) : (
                  <AccountCircleFillIcon color="#fff" size={30} />
                )}
              </td>
             <td> <Link to={`/user-info/${item.UserId}`}>{item.UserName}</Link></td>
              <td>{item.LastWatched || 'never'}</td>
              <td>{item.LastClient || 'n/a'}</td>
              <td>{item.TotalPlays}</td>
              <td>{item.TotalWatchTime || 0}</td>
              <td>{item.LastSeen ? formatTime(item.LastSeen) : 'never'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
      <button className="page-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
        First
      </button>
      <button className="page-btn" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
        Previous
      </button>
      <div className="page-number">{`Page ${currentPage} of ${pageNumbers.length}`}</div>
      <button className="page-btn" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === pageNumbers.length}>
        Next
      </button>
      <button className="page-btn" onClick={() => setCurrentPage(pageNumbers.length)} disabled={currentPage === pageNumbers.length}>
        Last
      </button>
    </div>
    </div>
  );
}
export default Users;
