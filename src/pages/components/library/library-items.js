import React, { useState, useEffect } from "react";
import axios from "axios";
import {FormControl } from 'react-bootstrap';



import MoreItemCards from "../item-info/more-items/more-items-card";


import Config from "../../../lib/config";
import "../../css/library/media-items.css";
import "../../css/width_breakpoint_css.css";

function LibraryItems(props) {
  const [data, setData] = useState();
  const [config, setConfig] = useState();
  const [searchQuery, setSearchQuery] = useState('');


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

  let filteredData = data;
  if(searchQuery)
  {
    filteredData = data.filter((item) =>
    item.Name.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }



  if (!data || !config) {
    return <></>;
  }

  return (
    <div className="library-items">
      <div className="d-md-flex justify-content-between">
        <h1 className="my-3">Media</h1>
        <FormControl type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="my-3 w-sm-100 w-md-75 w-lg-25" />
      </div>
        
        <div className="media-items-container">
        {filteredData.map((item) => (
                    <MoreItemCards data={item} base_url={config.hostUrl} key={item.Id+item.SeasonNumber+item.EpisodeNumber}/>
          ))}

        </div>

    </div>
  );
}

export default LibraryItems;
