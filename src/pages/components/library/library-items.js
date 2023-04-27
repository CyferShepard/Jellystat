import React, { useState, useEffect } from "react";
import axios from "axios";


import MoreItemCards from "../item-info/more-items/more-items-card";


import Config from "../../../lib/config";
import "../../css/library/media-items.css";

function LibraryItems(props) {
  const [data, setData] = useState();
  const [config, setConfig] = useState();


  useEffect(() => {

    const fetchConfig = async () => {
        try {
          const newConfig = await Config();
          setConfig(newConfig);
        } catch (error) {
            console.log(error);
        }
      };

    const fetchData = async () => {
      try {
        const itemData = await axios.post(`/api/getLibraryItems`, {
          libraryid: props.LibraryId,
        }, {
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
        });
        setData(itemData.data);
        console.log(itemData.data);
      } catch (error) {
        console.log(error);
      }
    };


    if (!config) {
        fetchConfig();
    }else{
        fetchData();
    }
    
   
    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [config, props.LibraryId]);


  if (!data || !config) {
    return <></>;
  }

  return (
    <div className="last-played">
        <h1 className="my-3">Media</h1>
        <div className="media-items-container">
        {data.map((item) => (
                    <MoreItemCards data={item} base_url={config.hostUrl} key={item.Id+item.SeasonNumber+item.EpisodeNumber}/>
          ))}

        </div>

    </div>
  );
}

export default LibraryItems;
