import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../../../lib/config";


import ComponentLoading from "../ComponentLoading";

import TvLineIcon from "remixicon-react/TvLineIcon";
import FilmLineIcon from "remixicon-react/FilmLineIcon";

function MVLibraries(props) {
  const [data, setData] = useState([]);
  const [days, setDays] = useState(30); 
  const [config, setConfig] = useState(null);


  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config();
        setConfig(newConfig);
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
          console.log(error);
        }
      }
    };

    const fetchLibraries = () => {
      if (config) {
        const url = `/stats/getMostViewedLibraries`;

        axios
        .post(url, {days:props.days}, {
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((data) => {
            setData(data.data);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    };
 

    if (!config) {
      fetchConfig();
    }

    if (!data || data.length===0) {
      fetchLibraries();
    }
    if (days !== props.days) {
      setDays(props.days);
      fetchLibraries();
    }

    const intervalId = setInterval(fetchLibraries, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data, config, days,props.days]);

  if (!data) {
    return(
      <div className="stats-card">
      <ComponentLoading />
      </div>
    );
  }
  if (data.length === 0) {
    return  <></>;
  }


  return (
    <div className="stats-card"
    >
    
    <div className="popular-image">
        <div  className="library-icons">
          {data[0].CollectionType==="tvshows" ?
          
          <TvLineIcon size={'80%'}/>
          :
          <FilmLineIcon size={'80%'}/>
        }

        </div>
    </div>
    <div className="stats">
    <div className="stats-header">
      
      <div>MOST VIEWED LIBRARIES</div>
      <div className="stats-header-plays">Plays</div>
    </div>

    <div className = "stats-list">

        {data &&
          data
            .map((item,index) => (

                <div className='stat-item' key={item.Id}>
                    <p className="stat-item-index">{(index+1)}</p>
                    <p className="stat-item-name">{item.Name}</p>
                    <p className="stat-item-count"> {item.Plays}</p>
                </div>

            ))}

      </div>
    </div>
    

    </div>
  );
}

export default MVLibraries;
