import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import Config from "../../../lib/config";


import ItemStatComponent from "./ItemStatComponent";
import { Trans } from "react-i18next";


function MVSeries(props) {
  const [data, setData] = useState();
  const [days, setDays] = useState(30); 

  const [config, setConfig] = useState(null);


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
        const url = `/stats/getMostViewedByType`;

        axios
        .post(url, {days:props.days, type:'Series'}, {
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


  return (
    <ItemStatComponent  base_url={config.settings?.EXTERNAL_URL ?? config.hostUrl} data={data} heading={<Trans i18nKey="STAT_CARDS.MOST_VIEWED_SERIES" />} units={<Trans i18nKey="UNITS.PLAYS" />}/>
  );
}

export default MVSeries;
