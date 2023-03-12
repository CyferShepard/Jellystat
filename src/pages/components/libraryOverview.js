import "../css/libraryOverview.css";
import Config from "../../lib/config";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Loading from "./loading";

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
      const url = `http://localhost:3003/stats/getLibraryOverview`;
      axios
        .get(url)
        .then((response) => setData(response.data))
        .catch((error) => console.log(error));
    };

    if (!data || data.length === 0) {
      fetchData();
    }
  
  }, [data,base_url]);

  if (data.length === 0) {
    return <Loading />;
  }

  return (
    <div className="overview">
      {data &&
        data.map((stats) => (
          <div className="card" style={{
            backgroundImage: `url(${
             base_url +
              "/Items/" +
              (stats.Isd) +
              "/Images/Primary?quality=50"
            })`,
          }}
          key={stats.Id}
          >
            <div className="item-count">
              <div>
              <p>Items in Library</p><p>{stats.Library_Count}</p>
              </div>
              {stats.CollectionType === "tvshows" ? (
                <div>
                   <p>Seasons</p><p>{stats.Season_Count}</p>
                </div>
              ) : (
                <></>
              )}
              {stats.CollectionType === "tvshows" ? (
                <div>
                  <p>Episodes</p><p>{stats.Episode_Count}</p>
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
