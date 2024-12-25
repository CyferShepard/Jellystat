import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";

import MoreItemCards from "./more-items/more-items-card";

import Config from "../../../lib/config";
import "../../css/users/user-details.css";
import i18next from "i18next";

function MoreItems(props) {
  const [data, setData] = useState();
  const [config, setConfig] = useState();


  useEffect(() => {

    const fetchConfig = async () => {
        try {
          const newConfig = await Config.getConfig();
          setConfig(newConfig);
        } catch (error) {
            console.log(error);
        }
      };
      

    const fetchData = async () => {
      if(config)
      {
        try {
          let url=`/api/getSeasons`;
          if(props.data.Type==='Season')
          {
            url=`/api/getEpisodes`;
          }
  
          const itemData = await axios.post(url, {
            Id: props.data.EpisodeId||props.data.Id
          },{
            headers: {
              Authorization: `Bearer ${config.token}`,
              "Content-Type": "application/json",
            },
          });
          setData(itemData.data);
        } catch (error) {
          console.log(error);
        }
      }

    };

    fetchData();

    if (!config) {
        fetchConfig();
    }

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [config, props]);


  if (!data || data.lenght===0) {
    return <></>;
  }

  return (
    <div className="last-played">
        <h1 className="my-3">{props.data.Type==="Season" ? i18next.t("EPISODES") : i18next.t("SEASONS")}</h1>
        <div className="last-played-container">
        
         {data.sort((a,b) => a.IndexNumber-b.IndexNumber).map((item) => (
                     <MoreItemCards data={item} base_url={config.settings?.EXTERNAL_URL ?? config.hostUrl} key={item.Id}/>
          ))}

        </div>

    </div>
  );
}

export default MoreItems;
