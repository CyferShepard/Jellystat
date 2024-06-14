import { useState, useEffect } from "react";
import axios from "axios";

import ActivityTable from "../activity/activity-table";
import { Trans } from "react-i18next";
import { FormControl, FormSelect } from "react-bootstrap";
import i18next from "i18next";

function LibraryActivity(props) {
  const [data, setData] = useState();
  const token = localStorage.getItem("token");
  const [itemCount, setItemCount] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

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
          }
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

  let filteredData = data;

  if (searchQuery) {
    filteredData = data.filter((item) =>
      (!item.SeriesName ? item.NowPlayingItemName : item.SeriesName + " - " + item.NowPlayingItemName)
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }

  return (
    <div className="Activity">
      <div className="d-md-flex justify-content-between">
        <h1 className="my-3">
          <Trans i18nKey="LIBRARY_INFO.LIBRARY_ACTIVITY" />
        </h1>

        <div className="d-flex flex-column flex-md-row">
          <div className="d-flex flex-row w-100">
            <div className="d-flex flex-col my-md-3 rounded-0 rounded-start  align-items-center px-2 bg-primary-1">
              <Trans i18nKey="UNITS.ITEMS" />
            </div>
            <FormSelect
              onChange={(event) => {
                setItemCount(event.target.value);
              }}
              value={itemCount}
              className="my-md-3 w-md-75 rounded-0 rounded-end"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </FormSelect>
          </div>
          <FormControl
            type="text"
            placeholder= {i18next.t("SEARCH")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ms-md-3 my-3 w-sm-100 w-md-75"
          />
        </div>
      </div>

      <div className="Activity">
        <ActivityTable data={filteredData} itemCount={itemCount} />
      </div>
    </div>
  );
}

export default LibraryActivity;
