import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../../../lib/config";


import ComponentLoading from "../ComponentLoading";

import AccountCircleFillIcon from "remixicon-react/AccountCircleFillIcon";

function MostActiveUsers() {
  const [data, setData] = useState([]);
  const [imgError, setImgError] = useState(false);

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
        const url = `/stats/getMostActiveUsers`;

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



  const handleImageError = () => {
    setImgError(true);
  };

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
    {imgError ?

      <AccountCircleFillIcon size={'80%'}/>
      :

    <img
          className="popular-user-image"
          src={
            config.hostUrl +
              "/Users/" +
              (data[0].UserId) +
              "/Images/Primary?quality=50"
          }
          onError={handleImageError}
          alt=""
        ></img>
        }
    </div>
    <div className="stats">
    <div className="stats-header">
      
      <div>MOST ACTIVE USERS</div>
      <div className="stats-header-plays">Plays</div>
    </div>

    <div className = "stats-list">

        {data &&
          data
            .map((item,index) => (

                <div className='stat-item' key={item.UserId}>
                    <p className="stat-item-index">{(index+1)}</p>
                    <p className="stat-item-name">{item.UserName}</p>
                    <p className="stat-item-count"> {item.Plays}</p>
                </div>

            ))}

      </div>
    </div>
    

    </div>
  );
}

export default MostActiveUsers;
