import React, { useState, useEffect } from "react";
import axios from "axios";

import ActivityTable from "../activity/activity-table";

function LibraryActivity(props) {
  const [data, setData] = useState();
  const token = localStorage.getItem("token");
  const [itemCount, setItemCount] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const libraryrData = await axios.post(
          `/api/getLibraryHistory`,
          {
            libraryid: props.LibraryId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        setData(libraryrData.data);
      } catch (error) {
        console.log(error);
      }
    };

    if (!data) {
      fetchData();
    }

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data, props.LibraryId, token]);

  if (!data) {
    return <></>;
  }

  return (
    <div className="Activity">
      <div className="Heading">
        <h1>Library Activity</h1>
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

export default LibraryActivity;
