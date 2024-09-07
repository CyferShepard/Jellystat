import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";

import RecentlyAddedCard from "./RecentlyAdded/recently-added-card";

import "../../css/users/user-details.css";
import ErrorBoundary from "../general/ErrorBoundary";
import { Trans } from "react-i18next";

function RecentlyAdded(props) {
  const [data, setData] = useState();
  const token = localStorage.getItem("token");
  const groupRecentlyAdded = localStorage.getItem("groupRecentlyAdded") ?? true;

  useEffect(() => {
    const fetchData = async () => {
      try {
        let url = `/api/getRecentlyAdded?GroupResults=${groupRecentlyAdded}`;
        if (props.LibraryId) {
          url += `&libraryid=${props.LibraryId}`;
        }

        const itemData = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (itemData && typeof itemData.data === "object" && Array.isArray(itemData.data)) {
          setData(itemData.data.filter((item) => ["Series", "Movie", "Audio", "Episode"].includes(item.Type)));
        }
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
    <div className="last-played">
      <h1 className="my-3">
        <Trans i18nKey="HOME_PAGE.RECENTLY_ADDED" />
      </h1>
      <div className="last-played-container">
        {data &&
          data.map((item) => (
            <ErrorBoundary key={item.Id}>
              <RecentlyAddedCard data={item} />
            </ErrorBoundary>
          ))}
      </div>
    </div>
  );
}

export default RecentlyAdded;
