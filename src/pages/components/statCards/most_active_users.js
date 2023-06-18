import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../../../lib/config";
import ItemStatComponent from "./ItemStatComponent";


import AccountCircleFillIcon from "remixicon-react/AccountCircleFillIcon";

function MostActiveUsers(props) {
  const [data, setData] = useState();
  const [days, setDays] = useState(30); 
  const [config, setConfig] = useState(null);
  const [loaded, setLoaded]= useState(true);


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
        .post(url, {days:props.days}, {
          headers: {
            Authorization: `Bearer ${config.token}`,
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

    if (!data) {
      fetchLibraries();
    }

    if (days !== props.days) {
      setDays(props.days);
      fetchLibraries();
    }


    const intervalId = setInterval(fetchLibraries, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data, config, days,props.days]);


  if (!data || data.length === 0) {
    return  <></>;
  }

  const UserImage = () => {
    return (
      <img src={`Proxy/Users/Images/Primary?id=${data[0].UserId}&fillWidth=100&quality=50`} 
      width="100%" 
      style={{borderRadius:'50%'}}
      alt=""
      onError={()=>setLoaded(false)}
      />
    );
  };

  return (
    <ItemStatComponent icon={loaded ? <UserImage/> : <AccountCircleFillIcon size="100%" />}  data={data} heading={"MOST ACTIVE USERS"} units={"Plays"}/>
  );
}

export default MostActiveUsers;
