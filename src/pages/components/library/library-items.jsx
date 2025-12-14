import { useState, useEffect, useRef } from "react";
import axios from "../../../lib/axios_instance";
import { FormControl, FormSelect, Button } from "react-bootstrap";
import SortAscIcon from "remixicon-react/SortAscIcon";
import SortDescIcon from "remixicon-react/SortDescIcon";

import MoreItemCards from "../item-info/more-items/more-items-card";

import Config from "../../../lib/config";
import "../../css/library/media-items.css";
import "../../css/width_breakpoint_css.css";
import "../../css/radius_breakpoint_css.css";
import { Trans } from "react-i18next";
import Loading from "../general/loading";
import i18next from "i18next";

function LibraryItems(props) {
  const [data, setData] = useState();
  const [config, setConfig] = useState();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [sortOrder, setSortOrder] = useState(localStorage.getItem("PREF_sortOrder") ?? "Title");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(
    localStorage.getItem("PREF_sortAsc") != undefined ? localStorage.getItem("PREF_sortAsc") == "true" : true
  );

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const isLoadingMoreRef = useRef(isLoadingMore);

  const archive = {
    all: "all",
    archived: "true",
    not_archived: "false",
  };
  const [showArchived, setShowArchived] = useState(localStorage.getItem("PREF_archiveFilterValue") ?? archive.all);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // Adjust the delay as needed

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fetch config and first page
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.getConfig();
        setConfig(newConfig);
      } catch (error) {
        console.log(error);
      }
    };
    if (!config) fetchConfig();
  }, [config]);

  useEffect(() => {
    if (!config) return;
    setCurrentPage(1);
    setHasMore(true);
    // setData(undefined);
    fetchData(1, true);
    // eslint-disable-next-line
  }, [config, props.LibraryId, sortOrder, sortAsc, debouncedSearchQuery]);

  // Fetch data function
  const fetchData = async (page, reset = false) => {
    try {
      const itemData = await axios.post(
        `/stats/getLibraryItemsWithStats`,
        {
          libraryid: props.LibraryId,
        },
        {
          params: {
            size: 50,
            page: page,
            search: debouncedSearchQuery,
            sort: sortOrder,
            desc: !sortAsc,
          },
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (reset) {
        setData(itemData.data);
      } else {
        setData((prev) => ({
          ...itemData.data,
          results: [...(prev?.results || []), ...(itemData.data?.results || [])],
        }));
      }
      setHasMore(page < (itemData.data?.pages || 0));
      setIsLoadingMore(false);
    } catch (error) {
      setIsLoadingMore(false);
      setHasMore(false);
      console.log(error);
    }
  };

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  // Infinite scroll handler
  useEffect(() => {
    let timeoutId = null;
    const handleScroll = () => {
      // Debounce: only run after scroll settles for 100ms
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && !isLoadingMoreRef.current && hasMore) {
          setIsLoadingMore(true);
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          fetchData(nextPage);
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line
  }, [hasMore, currentPage, config]);

  function sortOrderLogic(_sortOrder) {
    if (_sortOrder !== "Title") {
      setSortDirection(false);
    } else {
      setSortDirection(true);
    }
    setSortingOrder(_sortOrder);
  }

  function setSortDirection(asc) {
    setSortAsc(asc);
    localStorage.setItem("PREF_sortAsc", asc);
  }

  function setSortingOrder(order) {
    setSortOrder(order);
    localStorage.setItem("PREF_sortOrder", order);
  }

  function setArchivedFilter(value) {
    setShowArchived(value);
    localStorage.setItem("PREF_archiveFilterValue", value);
  }

  let filteredData = data?.results;
  if (filteredData) {
    filteredData = filteredData.filter((item) => {
      let match = false;
      if (showArchived == archive.all || item.archived == (showArchived == "true")) {
        match = true;
      }
      return match;
    });
  }

  if (!filteredData || !config) {
    return <Loading />;
  }

  return (
    <div className="library-items">
      <div className="d-md-flex justify-content-between">
        <h1 className="my-3">
          <Trans i18nKey="MEDIA" />
        </h1>

        <div className="d-flex flex-column flex-md-row">
          <div className="d-flex flex-row w-md-75">
            <FormSelect
              value={showArchived}
              onChange={(e) => setArchivedFilter(e.target.value)}
              className="my-md-3 w-100 rounded"
            >
              <option value="all">
                <Trans i18nKey="ALL" />
              </option>
              <option value="true">
                <Trans i18nKey="ARCHIVED" />
              </option>
              <option value="false">
                <Trans i18nKey="NOT_ARCHIVED" />
              </option>
            </FormSelect>
          </div>
          <div className="d-flex flex-row w-100  mt-2 mt-md-0">
            <FormSelect
              onChange={(e) => sortOrderLogic(e.target.value)}
              className="ms-md-3 my-md-3 w-100 rounded-0 rounded-start"
              value={sortOrder}
            >
              <option value="Title">
                <Trans i18nKey="TITLE" />
              </option>
              <option value="Date">
                <Trans i18nKey="SETTINGS_PAGE.DATE_ADDED" />
              </option>
              <option value="Views">
                <Trans i18nKey="VIEWS" />
              </option>
              <option value="WatchTime">
                <Trans i18nKey="WATCH_TIME" />
              </option>
              <option value="Size">
                <Trans i18nKey="SETTINGS_PAGE.SIZE" />
              </option>
            </FormSelect>

            <Button className="my-md-3 rounded-0 rounded-end" onClick={() => setSortDirection(!sortAsc)}>
              {sortAsc ? <SortAscIcon /> : <SortDescIcon />}
            </Button>
          </div>
          <FormControl
            type="text"
            placeholder={i18next.t("SEARCH")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ms-md-3 mt-2 mb-2 my-md-3 w-sm-100 w-md-75"
          />
        </div>
      </div>

      <div className="media-items-container">
        {filteredData.map((item) => (
          <MoreItemCards
            data={item}
            base_url={config.settings?.EXTERNAL_URL ?? config.hostUrl}
            key={item.Id + item.SeasonNumber + item.EpisodeNumber}
          />
        ))}
      </div>
    </div>
  );
}

export default LibraryItems;
