import "../css/libraryOverview.css"
import React, { useState, useEffect } from 'react';
import axios from "axios";
import Config from "../../lib/config";
import Loading from "./loading";

export default function LibraryOverView() {
    const [data, setData] = useState([]);


    useEffect(() => {
        Config().then(config => {
          const url = `${config.hostUrl}/Items/counts`;
          const fetchData = () => {
            axios.get(url, {
              headers: {
                'X-MediaBrowser-Token': config.apiKey,
              },
            })
              .then(response => setData(response.data))
              .catch(error => console.log(error));
          };
    
          fetchData();
          const intervalId = setInterval(fetchData, 60000);
          return () => clearInterval(intervalId);
        });
      }, []);



    if (data.length === 0) {
        return <Loading />;
    }

    return (
        <div className="overview">
            <div className="card">
                <div className="item-card-count">
                    {data.MovieCount + data.EpisodeCount} Media Files
                </div>
                <div>
                    <div className="item-count">
                        <p>{data.MovieCount}</p> <p>Movies</p>
                    </div>
                    <div className="item-count">
                        <p>{data.BoxSetCount}</p> <p>Box Sets</p>
                    </div>
                    <div className="item-count">
                        <p>{data.SeriesCount}</p> <p>Shows</p>
                    </div>
                    <div className="item-count">
                        <p>{data.EpisodeCount}</p> <p>Episodes</p>
                    </div>
                </div>

            </div>
        </div>
    )
}