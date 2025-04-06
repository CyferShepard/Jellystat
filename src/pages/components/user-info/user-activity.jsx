import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import ActivityTable from "../activity/activity-table";
import { Trans } from "react-i18next";
import { Button, FormControl, FormSelect, Modal } from "react-bootstrap";
import "../../css/width_breakpoint_css.css";
import "../../css/radius_breakpoint_css.css";
import "../../css/users/user-activity.css";
import i18next from "i18next";
import LibraryFilterModal from "../library/library-filter-modal";
import Config from "../../../lib/config.jsx";

function UserActivity(props) {
  const [data, setData] = useState();
  const token = localStorage.getItem("token");
  const [itemCount, setItemCount] = useState(parseInt(localStorage.getItem("PREF_ACTIVITY_ItemCount") ?? "10"));
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [streamTypeFilter, setStreamTypeFilter] = useState("All");
  const [libraryFilters, setLibraryFilters] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [showLibraryFilters, setShowLibraryFilters] = useState(false);
  const [config, setConfig] = useState();
  const [currentPage, setCurrentPage] = useState(1);
  const [sorting, setSorting] = useState({ column: "ActivityDateInserted", desc: true });
  const [filterParams, setFilterParams] = useState([]);
  const [isBusy, setIsBusy] = useState(false);

  function setItemLimit(limit) {
    setItemCount(parseInt(limit));
    localStorage.setItem("PREF_ACTIVITY_ItemCount", limit);
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

    const intervalId = setInterval(config, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [config]);

  const handleLibraryFilter = (selectedOptions) => {
    setLibraryFilters(selectedOptions);
  };

  const toggleSelectAll = () => {
    if (libraryFilters.length > 0) {
      setLibraryFilters([]);
    } else {
      setLibraryFilters(libraries.map((library) => library.Id));
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const onSortChange = (sort) => {
    setSorting({ column: sort.column, desc: sort.desc });
  };

  const onFilterChange = (filter) => {
    setFilterParams(filter);
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsBusy(true);
        const itemData = await axios.post(
          `/api/getUserHistory`,
          {
            userid: props.UserId,
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
        setData(itemData.data);
        setIsBusy(false);
      } catch (error) {
        console.log(error);
      }
    };

    const fetchLibraries = () => {
      const url = `/api/getLibraries`;
      axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        .then((data) => {
          const libraryFilters = data.data.map((library) => {
            return {
              Name: library.Name,
              Id: library.Id,
              Archived: library.archived,
            };
          });
          setLibraries(libraryFilters);
          setLibraryFilters(libraryFilters.map((library) => library.Id));
        })
        .catch((error) => {
          console.log(error);
        });
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
      fetchHistory();
    }

    fetchLibraries();

    const intervalId = setInterval(fetchHistory, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [props.UserId, token, itemCount, currentPage, debouncedSearchQuery, sorting, filterParams]);

  if (!data || !data.results) {
    return <></>;
  }

  let filteredData = data.results;

  // if (searchQuery) {
  //   filteredData = data.results.filter((item) =>
  //     (!item.SeriesName ? item.NowPlayingItemName : item.SeriesName + " - " + item.NowPlayingItemName)
  //       .toLowerCase()
  //       .includes(searchQuery.toLowerCase())
  //   );
  // }

  filteredData = filteredData.filter(
    (item) =>
      (libraryFilters.includes(item.ParentId) || item.ParentId == null) &&
      (streamTypeFilter == "All"
        ? true
        : item.PlayMethod === (config?.IS_JELLYFIN ? streamTypeFilter : streamTypeFilter.replace("Play", "Stream")))
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
          <Trans i18nKey="ITEM_ACTIVITY" />
        </h1>

        <div className="d-flex flex-column flex-md-row" style={{ whiteSpace: "nowrap" }}>
          <Button onClick={() => setShowLibraryFilters(true)} className="ms-md-3 mb-3 my-md-3">
            <Trans i18nKey="MENU_TABS.LIBRARIES" />
          </Button>

          <div className="d-flex flex-row w-100 ms-md-3 w-sm-100 w-md-75 mb-3 my-md-3">
            <div className="d-flex flex-col rounded-0 rounded-start  align-items-center px-2 bg-primary-1">
              <Trans i18nKey="TYPE" />
            </div>
            <FormSelect
              onChange={(event) => {
                setStreamTypeFilter(event.target.value);
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
          data={filteredData}
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

export default UserActivity;
