import "../css/libraryOverview.css";
import Config from "../../lib/config";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Loading from "./loading";


import TvLineIcon from "remixicon-react/TvLineIcon";
import FilmLineIcon from "remixicon-react/FilmLineIcon";

export default function LibraryOverView() {
  const [data, setData] = useState([]);
  const [base_url, setURL] = useState("");

  useEffect(() => {
    if (base_url === "") {
      Config()
        .then((config) => {
          setURL(config.hostUrl);
        })
        .catch((error) => {
          console.log(error);
        });
    }
    const fetchData = () => {
      const url = `/stats/getLibraryOverview`;
      axios
        .get(url)
        .then((response) => setData(response.data))
        .catch((error) => console.log(error));
    };

    if (!data || data.length === 0) {
      fetchData();
    }
  }, [data, base_url]);

  if (data.length === 0) {
    return <Loading />;
  }

  return (
    <div>
      <h1>Library Statistics</h1>
      <div className="overview-container">
        <div className="library-card">

          <div className="library-image">
            <div className="library-icons">
              <TvLineIcon size={"80%"} />
            </div>
          </div>

          <div className="library">
            <div className="library-header">
              <div>MOVIE LIBRARIES</div>
              <div className="library-header-count">MOVIES</div>
            </div>

            <div className="stats-list">
              {data &&
                data.filter((stat) => stat.CollectionType === "movies")
                  .map((item, index) => (
                    <div className="library-item" key={item.Id}>
                      <p className="library-item-index">{index + 1}</p>
                      <p className="library-item-name">{item.Name}</p>
                      <p className="library-item-count">{item.Library_Count}</p>
                    </div>
                  ))}
            </div>
          </div>

        </div>

        <div className="library-card">

          <div className="library-image">
            <div className="library-icons">
              <FilmLineIcon size={"80%"} />
            </div>
          </div>

          <div className="library">
            <div className="library-header">
              <div>SHOW LIBRARIES</div>
              <div className="library-header-count">
                SERIES / SEASONS / EPISODES
              </div>
            </div>

            <div className="stats-list">
              {data &&
                data.filter((stat) => stat.CollectionType === "tvshows")
                  .map((item, index) => (
                    <div className="library-item" key={item.Id}>
                      <p className="library-item-index">{index + 1}</p>
                      <p className="library-item-name">{item.Name}</p>
                      <p className="library-item-count">{item.Library_Count} / {item.Season_Count} / {item.Episode_Count}</p>
                    </div>
                  ))}
            </div>
          </div>
        </div>
        
      </div>

    </div>
  );
}
