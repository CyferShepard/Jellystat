import { useState, useEffect } from "react";
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

function LibraryItems(props) {
  const [data, setData] = useState();
  const [config, setConfig] = useState();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState(localStorage.getItem("PREF_sortOrder") ?? "Title");
  const [sortAsc, setSortAsc] = useState(
    localStorage.getItem("PREF_sortAsc") != undefined ? localStorage.getItem("PREF_sortAsc") == "true" : true
  );

  console.log(sortOrder);

  const archive = {
    all: "all",
    archived: "true",
    not_archived: "false",
  };
  const [showArchived, setShowArchived] = useState(localStorage.getItem("PREF_archiveFilterValue") ?? archive.all);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.getConfig();
        setConfig(newConfig);
      } catch (error) {
        console.log(error);
      }
    };

    const fetchData = async () => {
      try {
        const itemData = await axios.post(
          `/stats/getLibraryItemsWithStats`,
          {
            libraryid: props.LibraryId,
          },
          {
            headers: {
              Authorization: `Bearer ${config.token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setData(itemData.data);
      } catch (error) {
        console.log(error);
      }
    };

    if (!config) {
      fetchConfig();
    } else {
      fetchData();
    }

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [config, props.LibraryId]);

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

  let filteredData = data;
  if (data) {
    filteredData = data.filter((item) => {
      let match = false;
      if (showArchived == archive.all || item.archived == (showArchived == "true")) {
        match = true;
      }
      if (searchQuery) {
        match =
          item.Name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          (showArchived == archive.all || item.archived == (showArchived == "true"));
      }
      return match;
    });
  }

  if (!data || !config) {
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
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ms-md-3 mt-2 mb-2 my-md-3 w-sm-100 w-md-75"
          />
        </div>
      </div>

      <div className="media-items-container">
        {filteredData
          .sort((a, b) => {
            const titleA = a.Name.replace(/^(A |An |The )/i, "");
            const titleB = b.Name.replace(/^(A |An |The )/i, "");

            if (sortOrder === "Title") {
              if (sortAsc) {
                return titleA.localeCompare(titleB);
              }
              return titleB.localeCompare(titleA);
            } else if (sortOrder === "Date") {
              if (sortAsc) {
                return new Date(a.DateCreated || 0) - new Date(b.DateCreated || 0);
              }
              return new Date(b.DateCreated || 0) - new Date(a.DateCreated || 0);
            } else if (sortOrder === "Views") {
              if (sortAsc) {
                return a.times_played - b.times_played;
              }
              return b.times_played - a.times_played;
            } else if (sortOrder === "Size") {
              if (sortAsc) {
                return a.Size - b.Size;
              }
              return b.Size - a.Size;
            } else {
              if (sortAsc) {
                return a.total_play_time - b.total_play_time;
              }
              return b.total_play_time - a.total_play_time;
            }
          })
          .map((item) => (
            <MoreItemCards data={item} base_url={config.hostUrl} key={item.Id + item.SeasonNumber + item.EpisodeNumber} />
          ))}
      </div>
    </div>
  );
}

export default LibraryItems;
