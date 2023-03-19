import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../../../lib/config";


import ComponentLoading from "../ComponentLoading";

import ComputerLineIcon from "remixicon-react/ComputerLineIcon";

function MostUsedClient() {
  const [data, setData] = useState([]);
//   const [base_url, setURL] = useState("");

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
        const url = `/stats/getMostUsedClient`;

        axios
          .get(url)
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

    const intervalId = setInterval(fetchLibraries, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data, config]);

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
        <ComputerLineIcon size={'80%'}/>
        </div>
    </div>
    <div className="stats">
    <div className="stats-header">
      
      <div>MOST USED CLIENTS</div>
      <div className="stats-header-plays">Plays</div>
    </div>

    <div className = "stats-list">

        {data &&
          data
            .map((item,index) => (

                <div className='stat-item' key={item.Client}>
                    <p className="stat-item-index">{(index+1)}</p>
                    <p className="stat-item-name">{item.Client}</p>
                    <p className="stat-item-count"> {item.Plays}</p>
                </div>

            ))}

      </div>
    </div>
    

    </div>
  );
}

export default MostUsedClient;
