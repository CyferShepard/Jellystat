import { useState, useEffect } from "react";

import axios from "../lib/axios_instance";

import "./css/activity.css";
import Config from "../lib/config";

import ActivityTable from "./components/activity/activity-table";
import Loading from "./components/general/loading";
import { Trans } from "react-i18next";
import { Button, FormControl, FormSelect, Modal } from "react-bootstrap";
import i18next from "i18next";
import LibraryFilterModal from "./components/library/library-filter-modal";

function Activity() {
  const [data, setData] = useState();
  const [config, setConfig] = useState(null);
  const [streamTypeFilter, setStreamTypeFilter] = useState(localStorage.getItem("PREF_ACTIVITY_StreamTypeFilter") ?? "All");
  const [searchQuery, setSearchQuery] = useState("");
  const [itemCount, setItemCount] = useState(parseInt(localStorage.getItem("PREF_ACTIVITY_ItemCount") ?? "10"));
  const [libraryFilters, setLibraryFilters] = useState(
    localStorage.getItem("PREF_ACTIVITY_libraryFilters") != undefined
      ? JSON.parse(localStorage.getItem("PREF_ACTIVITY_libraryFilters"))
      : []
  );
  const [libraries, setLibraries] = useState([]);
  const [showLibraryFilters, setShowLibraryFilters] = useState(false);

  function setItemLimit(limit) {
    setItemCount(limit);
    localStorage.setItem("PREF_ACTIVITY_ItemCount", limit);
  }

  function setTypeFilter(filter) {
    setStreamTypeFilter(filter);
    localStorage.setItem("PREF_ACTIVITY_StreamTypeFilter", filter);
  }

  const handleLibraryFilter = (selectedOptions) => {
    setLibraryFilters(selectedOptions);
    localStorage.setItem("PREF_ACTIVITY_libraryFilters", JSON.stringify(selectedOptions));
  };

  const toggleSelectAll = () => {
    if (libraryFilters.length > 0) {
      setLibraryFilters([]);
      localStorage.setItem("PREF_ACTIVITY_libraryFilters", JSON.stringify([]));
    } else {
      setLibraryFilters(libraries.map((library) => library.Id));
      localStorage.setItem("PREF_ACTIVITY_libraryFilters", JSON.stringify(libraries.map((library) => library.Id)));
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.getConfig();
        setConfig(newConfig);
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
          console.log(error);
        }
      }
    };

    const fetchHistory = () => {
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

    const fetchLibraries = () => {
      const url = `/api/getLibraries`;
      axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
        })
        .then((data) => {
          const fetchedLibraryFilters = data.data.map((library) => {
            return {
              Name: library.Name,
              Id: library.Id,
              Archived: library.archived,
            };
          });
          setLibraries(fetchedLibraryFilters);
          if (libraryFilters.length == 0) {
            setLibraryFilters(fetchedLibraryFilters.map((library) => library.Id));
            localStorage.setItem(
              "PREF_ACTIVITY_libraryFilters",
              JSON.stringify(fetchedLibraryFilters.map((library) => library.Id))
            );
          }
        })
        .catch((error) => {
          console.log(error);
        });
    };

    if (!data && config) {
      fetchHistory();
      fetchLibraries();
    }

    if (!config) {
      fetchConfig();
    }

    const intervalId = setInterval(fetchHistory, 60000 * 60);
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
  filteredData = filteredData.filter(
    (item) =>
      (libraryFilters.includes(item.ParentId) || item.ParentId == null) &&
      (streamTypeFilter == "All" ? true : item.PlayMethod === streamTypeFilter)
  );

  return (
    <div className="Activity">
      <Modal show={showLibraryFilters} onHide={() => setShowLibraryFilters(false)}>
        <Modal.Header>
          <Modal.Title>
            <Trans i18nKey="MENU_TABS.LIBRARIES" />
          </Modal.Title>
        </Modal.Header>
        <LibraryFilterModal libraries={libraries} selectedLibraries={libraryFilters} onSelectionChange={handleLibraryFilter} />
        <Modal.Footer>
          <Button variant="outline-primary" onClick={toggleSelectAll}>
            <Trans i18nKey="ACTIVITY_TABLE.TOGGLE_SELECT_ALL" />
          </Button>
          <Button variant="outline-primary" onClick={() => setShowLibraryFilters(false)}>
            <Trans i18nKey="CLOSE" />
          </Button>
        </Modal.Footer>
      </Modal>
      <div className="d-md-flex justify-content-between">
        <h1 className="my-3">
          <Trans i18nKey="MENU_TABS.ACTIVITY" />
        </h1>

        <div className="d-flex flex-column flex-md-row">
          <Button onClick={() => setShowLibraryFilters(true)} className="ms-md-3 mb-3 my-md-3">
            <Trans i18nKey="MENU_TABS.LIBRARIES" />
          </Button>

          <div className="d-flex flex-row w-100 ms-md-3 w-sm-100 w-md-75 mb-3 my-md-3">
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

          <div className="d-flex flex-row w-100 ms-md-3 w-sm-100 w-md-75 mb-3 my-md-3">
            <div className="d-flex flex-col rounded-0 rounded-start  align-items-center px-2 bg-primary-1">
              <Trans i18nKey="UNITS.ITEMS" />
            </div>
            <FormSelect
              onChange={(event) => {
                setItemLimit(event.target.value);
              }}
              value={itemCount}
              className="w-md-75 rounded-0 rounded-end"
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
            className="ms-md-3 mb-3 my-md-3 w-sm-100 w-md-75"
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
