import React, { useState, useEffect } from "react";
import axios from "axios";
import { FormControl, FormSelect, Button } from "react-bootstrap";
import SortAscIcon from "remixicon-react/SortAscIcon";
import SortDescIcon from "remixicon-react/SortDescIcon";

import MoreItemCards from "../item-info/more-items/more-items-card";

import Config from "../../../lib/config";
import "../../css/library/media-items.css";
import "../../css/width_breakpoint_css.css";
import "../../css/radius_breakpoint_css.css";

function LibraryItems(props) {
  const [data, setData] = useState();
  const [config, setConfig] = useState();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("Title");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config();
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
          },
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
      setSortAsc(false);
    } else {
      setSortAsc(true);
    }
    setSortOrder(_sortOrder);
  }

  let filteredData = data;

  if (searchQuery) {
    filteredData = data.filter((item) =>
      item.Name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }

  if (!data || !config) {
    return <></>;
  }

  return (
    <div className="library-items">
      <div className="d-md-flex justify-content-between">
        <h1 className="my-3">Media</h1>

        <div className="d-flex flex-column flex-md-row">
          <div className="d-flex flex-row w-100">
            <FormSelect
              onChange={(e) => sortOrderLogic(e.target.value)}
              className="my-md-3 w-100 rounded-0 rounded-start"
            >
              <option value="Title">Title</option>
              <option value="Views">Views</option>
              <option value="WatchTime">Watch Time</option>
            </FormSelect>

            <Button
              className="my-md-3 rounded-0 rounded-end"
              onClick={() => setSortAsc(!sortAsc)}
            >
              {sortAsc ? <SortAscIcon /> : <SortDescIcon />}
            </Button>
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
            } else if (sortOrder === "Views") {
              if (sortAsc) {
                return a.times_played - b.times_played;
              }
              return b.times_played - a.times_played;
            } else {
              if (sortAsc) {
                return a.total_play_time - b.total_play_time;
              }
              return b.total_play_time - a.total_play_time;
            }
          })
          .map((item) => (
            <MoreItemCards
              data={item}
              base_url={config.hostUrl}
              key={item.Id + item.SeasonNumber + item.EpisodeNumber}
            />
          ))}
      </div>
    </div>
  );
}

export default LibraryItems;
