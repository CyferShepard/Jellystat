import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import Config from "../../../lib/config";
import ItemStatComponent from "./ItemStatComponent";


import AccountCircleFillIcon from "remixicon-react/AccountCircleFillIcon";
import { Trans } from "react-i18next";

function MostActiveUsers(props) {
  const [data, setData] = useState();
  const [days, setDays] = useState(30); 
  const [config, setConfig] = useState(null);
  const [loaded, setLoaded]= useState(true);


  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.getConfig();
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
      <img src={`proxy/Users/Images/Primary?id=${data[0].UserId}&fillWidth=100&quality=50`} 
      width="100%" 
      style={{borderRadius:'50%'}}
      alt=""
      onError={()=>setLoaded(false)}
      />
    );
  };

  return (
    <ItemStatComponent icon={loaded ? <UserImage/> : <AccountCircleFillIcon size="100%" />}  data={data} heading={<Trans i18nKey="STAT_CARDS.MOST_ACTIVE_USERS" />} units={<Trans i18nKey="UNITS.PLAYS" />}/>
  );
}

export default MostActiveUsers;
