import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";

import ActivityTable from "../activity/activity-table";
import { Trans } from "react-i18next";
import { FormControl, FormSelect } from "react-bootstrap";
import i18next from "i18next";
import Config from "../../../lib/config.jsx";

function LibraryActivity(props) {
  const [data, setData] = useState();
  const token = localStorage.getItem("token");
  const [itemCount, setItemCount] = useState(parseInt(localStorage.getItem("PREF_LIBRARY_ACTIVITY_ItemCount") ?? "10"));
  const [searchQuery, setSearchQuery] = useState("");
  const [streamTypeFilter, setStreamTypeFilter] = useState(
    localStorage.getItem("PREF_LIBRARY_ACTIVITY_StreamTypeFilter") ?? "All"
  );
  const [config, setConfig] = useState();
  const [currentPage, setCurrentPage] = useState(1);
  const [isBusy, setIsBusy] = useState(false);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  function setItemLimit(limit) {
    setItemCount(limit);
    localStorage.setItem("PREF_LIBRARY_ACTIVITY_ItemCount", limit);
  }

  function setTypeFilter(filter) {
    setStreamTypeFilter(filter);
    localStorage.setItem("PREF_LIBRARY_ACTIVITY_StreamTypeFilter", filter);
  }

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.getConfig();
        setConfig(newConfig);
      } catch (error) {
        console.log(error);
      }
    };

    if (!config) {
      fetchConfig();
    }
    const fetchData = async () => {
      try {
        setIsBusy(true);
        const libraryData = await axios.post(
          `/api/getLibraryHistory?size=${itemCount}&page=${currentPage}`,
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
        setData(libraryData.data);
        setIsBusy(false);
      } catch (error) {
        console.log(error);
      }
    };

    if (!data || data.current_page !== currentPage) {
      fetchData();
    }

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data, props.LibraryId, token, itemCount, currentPage]);

  if (!data || !data.results) {
    return <></>;
  }

  let filteredData = data.results;

  if (searchQuery) {
    filteredData = data.results.filter((item) =>
      (!item.SeriesName ? item.NowPlayingItemName : item.SeriesName + " - " + item.NowPlayingItemName)
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }

  filteredData = filteredData.filter((item) =>
    streamTypeFilter == "All"
      ? true
      : item.PlayMethod === (config?.IS_JELLYFIN ? streamTypeFilter : streamTypeFilter.replace("Play", "Stream"))
  );

  return (
    <div className="Activity">
      <div className="d-md-flex justify-content-between">
        <h1 className="my-3">
          <Trans i18nKey="LIBRARY_INFO.LIBRARY_ACTIVITY" />
        </h1>

        <div className="d-flex flex-column flex-md-row">
          <div className="d-flex flex-row w-100 ms-md-3 w-sm-100 w-md-75 mb-3 my-md-3" style={{ whiteSpace: "nowrap" }}>
            <div className="d-flex flex-col rounded-0 rounded-start  align-items-center px-2 bg-primary-1">
              <Trans i18nKey="TYPE" />
            </div>
            <FormSelect
              onChange={(event) => {
                setTypeFilter(event.target.value);
              }}
              value={streamTypeFilter}
              className="w-md-75 rounded-0 rounded-end"
            >
              <option value="All">
                <Trans i18nKey="ALL" />
              </option>
              <option value="Transcode">
                <Trans i18nKey="TRANSCODE" />
              </option>
              <option value="DirectPlay">
                <Trans i18nKey="DIRECT" />
              </option>
            </FormSelect>
          </div>

          <div className="d-flex flex-row w-100 ms-md-3 w-sm-100 w-md-75  ms-md-3" style={{ whiteSpace: "nowrap" }}>
            <div className="d-flex flex-col rounded-0 rounded-start  align-items-center px-2 bg-primary-1 my-md-3">
              <Trans i18nKey="UNITS.ITEMS" />
            </div>
            <FormSelect
              onChange={(event) => {
                setItemLimit(event.target.value);
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
            placeholder={i18next.t("SEARCH")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ms-md-3 my-3 w-sm-100 w-md-75"
          />
        </div>
      </div>

      <div className="Activity">
        <ActivityTable
          data={filteredData}
          itemCount={itemCount}
          onPageChange={handlePageChange}
          pageCount={data.pages}
          isBusy={isBusy}
        />
      </div>
    </div>
  );
}

export default LibraryActivity;
