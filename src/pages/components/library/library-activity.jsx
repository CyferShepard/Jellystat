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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [streamTypeFilter, setStreamTypeFilter] = useState(
    localStorage.getItem("PREF_LIBRARY_ACTIVITY_StreamTypeFilter") ?? "All"
  );
  const [config, setConfig] = useState();
  const [currentPage, setCurrentPage] = useState(1);
  const [sorting, setSorting] = useState({ column: "ActivityDateInserted", desc: true });
  const [filterParams, setFilterParams] = useState([]);
  const [isBusy, setIsBusy] = useState(false);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const onSortChange = (sort) => {
    setSorting({ column: sort.column, desc: sort.desc });
  };

  const onFilterChange = (filter) => {
    setFilterParams(filter);
  };

  function setItemLimit(limit) {
    setItemCount(parseInt(limit));
    localStorage.setItem("PREF_LIBRARY_ACTIVITY_ItemCount", limit);
  }

  function setTypeFilterParam(filter) {
    const type = config?.IS_JELLYFIN ? filter : filter.replace("Play", "Stream");
    const params = [...filterParams];
    const playMethodFilterIndex = params.findIndex((filter) => filter.field === "PlayMethod");
    if (playMethodFilterIndex !== -1) {
      params[playMethodFilterIndex].value = type;
    } else {
      params.push({ field: "PlayMethod", value: type });
    }
    if (filter == "All") {
      const playMethodFilterIndex = params.findIndex((filter) => filter.field === "PlayMethod");
      if (playMethodFilterIndex !== -1) {
        params.splice(playMethodFilterIndex, 1);
      }
    }
    setFilterParams(params);
  }

  function setTypeFilter(filter) {
    setStreamTypeFilter(filter);
    localStorage.setItem("PREF_LIBRARY_ACTIVITY_StreamTypeFilter", filter);
    setTypeFilterParam(filter);
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // Adjust the delay as needed

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

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
        if (streamTypeFilter != "All") {
          const streamTypeFilterIndex = filterParams.findIndex((filter) => filter.field === "PlayMethod");
          if (streamTypeFilterIndex !== -1) {
            filterParams[streamTypeFilterIndex].value = streamTypeFilter;
          } else {
            filterParams.push({ field: "PlayMethod", value: streamTypeFilter });
          }
        }
        const libraryData = await axios.post(
          `/api/getLibraryHistory`,
          {
            libraryid: props.LibraryId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            params: {
              size: itemCount,
              page: currentPage,
              search: debouncedSearchQuery,
              sort: sorting.column,
              desc: sorting.desc,
              filters: filterParams != undefined ? JSON.stringify(filterParams) : null,
            },
          }
        );
        setData(libraryData.data);
        setIsBusy(false);
      } catch (error) {
        console.log(error);
      }
    };

    if (
      !data ||
      (data.current_page && data.current_page !== currentPage) ||
      (data.size && data.size !== itemCount) ||
      (data?.search ?? "") !== debouncedSearchQuery.trim() ||
      (data?.sort ?? "") !== sorting.column ||
      (data?.desc ?? true) !== sorting.desc ||
      JSON.stringify(data?.filters ?? []) !== JSON.stringify(filterParams ?? [])
    ) {
      fetchData();
    }

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data, props.LibraryId, token, itemCount, currentPage, debouncedSearchQuery, sorting, filterParams]);

  if (!data || !data.results) {
    return <></>;
  }

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
              <option value="DirectStream">
                <Trans i18nKey="DIRECT_STREAM" />
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
          data={data.results}
          itemCount={itemCount}
          onPageChange={handlePageChange}
          onSortChange={onSortChange}
          onFilterChange={onFilterChange}
          pageCount={data.pages}
          isBusy={isBusy}
        />
      </div>
    </div>
  );
}

export default LibraryActivity;
