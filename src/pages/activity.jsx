import React, { useState, useEffect } from "react";

import axios from "axios";

import "./css/activity.css";
import Config from "../lib/config";

import ActivityTable from "./components/activity/activity-table";
import Loading from "./components/general/loading";
import { Trans } from "react-i18next";
import { FormControl, FormSelect } from "react-bootstrap";

function Activity() {
  const [data, setData] = useState();
  const [config, setConfig] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
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
          <h1>
            <Trans i18nKey="MENU_TABS.ACTIVITY" />
          </h1>
        </div>
        <div className="Activity">
          <h1>
            <Trans i18nKey="ERROR_MESSAGES.NO_ACTIVITY" />
          </h1>
        </div>
      </div>
    );
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
          <Trans i18nKey="MENU_TABS.ACTIVITY" />
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
            placeholder="Search"
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

export default Activity;
