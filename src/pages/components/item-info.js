import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from 'react-router-dom';

import GlobalStats from './item-info/globalStats';
import ItemDetails from './item-info/item-details';
import MoreItems from "./item-info/more-items";

import Config from "../../lib/config";
import Loading from "./general/loading";



function ItemInfo() {
  const { Id } = useParams();
  const [data, setData] = useState();
  const [config, setConfig] = useState();
  const [refresh, setRefresh] = useState(true);
  
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
    if(config){
      setRefresh(true);
    try {
      const itemData = await axios.post(`/api/getItemDetails`, {
        Id: Id
      }, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
      });


      setData(itemData.data[0]);
      setRefresh(false);
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
}, [config, Id]);




if(!data)
{
  return <></>;
}


if(refresh)
{
  return <Loading/>;
}
  
   
  return (
    <div>
       <ItemDetails data={data} hostUrl={config.hostUrl}/>
       <GlobalStats ItemId={Id}/>
       {["Series","Season"].includes(data && data.Type)?
       <MoreItems data={data}/>
       :
       <></>
      }


    </div>
  );
}
export default ItemInfo;
