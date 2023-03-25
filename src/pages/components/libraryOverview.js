import "../css/libraryOverview.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Loading from "./general/loading";

import LibraryStatComponent from "./libraryStatCard/library-stat-component";


import TvLineIcon from "remixicon-react/TvLineIcon";
import FilmLineIcon from "remixicon-react/FilmLineIcon";

export default function LibraryOverView() {
  const SeriesIcon=<TvLineIcon size={"80%"} /> ;
  const MovieIcon=<FilmLineIcon size={"80%"} /> ;
  const [data, setData] = useState([]);


  useEffect(() => {
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
  }, [data]);

  if (data.length === 0) {
    return <Loading />;
  }

  return (
    <div>
      <h1>Library Statistics</h1>
      <div className="overview-container">

        <LibraryStatComponent data={data.filter((stat) => stat.CollectionType === "movies")} heading={"MOVIE LIBRARIES"} units={"MOVIES"} icon={MovieIcon}/>
        <LibraryStatComponent data={data.filter((stat) => stat.CollectionType === "tvshows")} heading={"SHOW LIBRARIES"} units={"SERIES / SEASONS / EPISODES"} icon={SeriesIcon}/>
        <LibraryStatComponent data={data.filter((stat) => stat.CollectionType === "music")} heading={"MUSIC LIBRARIES"} units={"SONGS"} icon={SeriesIcon}/>

    </div>
    </div>
  );
}
