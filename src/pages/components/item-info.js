import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from 'react-router-dom';
import { Link } from "react-router-dom";
import { Blurhash } from 'react-blurhash';
import {Row, Col, Tabs, Tab, Button, ButtonGroup } from 'react-bootstrap';

import ExternalLinkFillIcon from "remixicon-react/ExternalLinkFillIcon";

import GlobalStats from './item-info/globalStats';
import "../css/items/item-details.css";

import MoreItems from "./item-info/more-items";
import ItemActivity from "./item-info/item-activity";
import ErrorPage from "./general/error";


import Config from "../../lib/config";
import Loading from "./general/loading";



function ItemInfo() {
  const { Id } = useParams();
  const [data, setData] = useState();
  const [config, setConfig] = useState();
  const [refresh, setRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('tabOverview');
  
  const [loaded, setLoaded] = useState(false);


  function formatFileSize(sizeInBytes) {
    const sizeInMB = sizeInBytes / 1048576; // 1 MB = 1048576 bytes
    if (sizeInMB < 1000) {
      return `${sizeInMB.toFixed(2)} MB`;
    } else {
      const sizeInGB = sizeInMB / 1024; // 1 GB = 1024 MB
      return `${sizeInGB.toFixed(2)} GB`;
    }
  }

  function ticksToTimeString(ticks) {
    const seconds = Math.floor(ticks / 10000000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const timeString = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  
    return timeString;
  }

  
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

    } catch (error) {
      setData({notfound:true, message:error.response.data});
      console.log(error);
    }
    setRefresh(false);
  }

  };


  fetchData();

  if (!config) {
      fetchConfig();
  }

  const intervalId = setInterval(fetchData, 60000 * 5);
  return () => clearInterval(intervalId);
}, [config, Id]);







if(!data || refresh)
{
  return <Loading/>;
}

if(data && data.notfound)
{
  return <ErrorPage message={data.message}/>;
}

const cardStyle = {
  backgroundImage: `url(/Proxy/Items/Images/Backdrop?id=${(["Episode","Season"].includes(data.Type)? data.SeriesId : data.Id)}&fillWidth=800&quality=90)`,
  height:'100%',
  backgroundSize: 'cover',
};

const cardBgStyle = {
  backgroundColor: 'rgb(0, 0, 0, 0.8)',
 
};


  return (
    <div>
       
       <div className="item-detail-container rounded-3" style={cardStyle}>
      <Row className="justify-content-center justify-content-md-start rounded-3 g-0 p-4" style={cardBgStyle}>
        <Col className="col-auto my-4 my-md-0 item-banner-image" >
        {data.PrimaryImageHash && !loaded ? <Blurhash hash={data.PrimaryImageHash} width={'200px'}   height={'300px'} className="rounded-3 overflow-hidden" style={{display:'block'}}/> : null}
        <img
            className="item-image"
            src={
              "/Proxy/Items/Images/Primary?id=" +
             (["Episode","Season"].includes(data.Type)? data.SeriesId : data.Id) +
              "&fillWidth=200&quality=90"
            }
            alt=""
            style={{
              display: loaded ? "block" :"none"
            }}
            onLoad={() => setLoaded(true)}
         />
        </Col>

        <Col >
        <div className="item-details">
          <div className="d-flex">
          <h1 className="">
            {data.SeriesId?
               <Link to={`/libraries/item/${data.SeriesId}`}>{data.SeriesName || data.Name}</Link>
            :
              data.SeriesName || data.Name
            }

          </h1>
          <Link className="px-2" to={ config.hostUrl+"/web/index.html#!/details?id="+ (data.EpisodeId ||data.Id)}  title="Open in Jellyfin" target="_blank"><ExternalLinkFillIcon/></Link>
        </div>

        <div className="my-3">
            {data.Type==="Episode"? <p><Link to={`/libraries/item/${data.SeasonId}`} className="fw-bold">{data.SeasonName}</Link> Episode {data.IndexNumber} - {data.Name}</p> : <></> }
            {data.Type==="Season"? <p>{data.Name}</p> : <></> }
            {data.FileName ?  <p style={{color:"lightgrey"}} className="fst-italic fs-6">File Name: {data.FileName}</p> :<></>}      
            {data.Path ? <p style={{color:"lightgrey"}} className="fst-italic fs-6">File Path: {data.Path}</p> :<></>}
            {data.RunTimeTicks ?  <p style={{color:"lightgrey"}} className="fst-italic fs-6">{data.Type==="Series"?"Average Runtime" : "Runtime"}: {ticksToTimeString(data.RunTimeTicks)}</p> :<></>}
            {data.Size ? <p style={{color:"lightgrey"}} className="fst-italic fs-6">File Size: {formatFileSize(data.Size)}</p> :<></>}

        </div>
        <ButtonGroup>
              <Button onClick={() => setActiveTab('tabOverview')} active={activeTab==='tabOverview'} variant='outline-primary' type='button'>Overview</Button>
              <Button onClick={() => setActiveTab('tabActivity')} active={activeTab==='tabActivity'} variant='outline-primary' type='button'>Activity</Button>
          </ButtonGroup>


      </div>
      
        </Col>
      </Row>


    </div>

      
        <Tabs defaultActiveKey="tabOverview" activeKey={activeTab} variant='pills'>
          <Tab eventKey="tabOverview" className='bg-transparent'>
            <GlobalStats ItemId={Id}/>
             {["Series","Season"].includes(data && data.Type)?
             <MoreItems data={data}/>
             :
             <></>
            }
          </Tab>
          <Tab eventKey="tabActivity" className='bg-transparent'>
            <ItemActivity itemid={Id}/>
          </Tab>
        </Tabs>
    </div>
  );
}
export default ItemInfo;
