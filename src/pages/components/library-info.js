import { useParams } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import axios from "axios";
import TvLineIcon from "remixicon-react/TvLineIcon";
import FilmLineIcon from "remixicon-react/FilmLineIcon";


// import LibraryDetails from './library/library-details';
import Loading from './general/loading';
import LibraryGlobalStats from './library/library-stats';
import LibraryLastWatched from './library/last-watched';
import RecentlyAdded from './library/recently-added';
import LibraryActivity from './library/library-activity';
import LibraryItems from './library/library-items';
import ErrorBoundary from './general/ErrorBoundary';

import { Tabs, Tab, Button, ButtonGroup } from 'react-bootstrap';





function LibraryInfo() {
  const { LibraryId } = useParams();
  const [activeTab, setActiveTab] = useState('tabOverview');
  const [data, setData] = useState();
  const token = localStorage.getItem('token');

  useEffect(() => {

    const fetchData = async () => {
      try {
        console.log('getdata');
        const libraryrData = await axios.post(`/stats/getLibraryDetails`, {
          libraryid: LibraryId,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setData(libraryrData.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [LibraryId,token]);

  if(!data)
  {
    return <Loading/>;
  }

   
  return (
    <div>


<div className="user-detail-container">
      <div className="user-image-container">
      {data.CollectionType==="tvshows" ?
          
          <TvLineIcon size={'100%'}/>
          :
          <FilmLineIcon size={'100%'}/>
        }
      </div>
      <div>
      <p className="user-name">{data.Name}</p>
          <ButtonGroup>
              <Button onClick={() => setActiveTab('tabOverview')} active={activeTab==='tabOverview'} variant='outline-primary' type='button'>Overview</Button>
              <Button onClick={() => setActiveTab('tabItems')} active={activeTab==='tabItems'} variant='outline-primary' type='button'>Media</Button>
              <Button onClick={() => setActiveTab('tabActivity')} active={activeTab==='tabActivity'} variant='outline-primary' type='button'>Activity</Button>
          </ButtonGroup>
      </div>

  

  </div>
          <Tabs defaultActiveKey="tabOverview" activeKey={activeTab} variant='pills'>
          <Tab eventKey="tabOverview" className='bg-transparent'>
            <LibraryGlobalStats LibraryId={LibraryId}/>
            <ErrorBoundary>
              <RecentlyAdded LibraryId={LibraryId}/>
            </ErrorBoundary>
           
            <LibraryLastWatched LibraryId={LibraryId}/>
          </Tab>
          <Tab eventKey="tabActivity" className='bg-transparent'>
            <LibraryActivity LibraryId={LibraryId}/>
          </Tab>
          <Tab eventKey="tabItems" className='bg-transparent'>
            <LibraryItems LibraryId={LibraryId}/>
          </Tab>
        </Tabs>
    </div>
  );
}
export default LibraryInfo;
