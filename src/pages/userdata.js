import React, { useState, useEffect } from 'react';
// import sync from '../classes/sync';
import './css/libraries.css';
import Loading from './components/loading';

// import PlaybackActivity from './components/playbackactivity';

// import StatCards from './components/StatsCards';

import LibraryOverView from './components/libraryOverview';

import API from '../classes/jellyfin-api';


function UserData() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const seriesInstance = new API(); // create an instance of the GetSeries class
    seriesInstance.getLibraries().then((seriesData) => {
      setData(seriesData);
    });


    
    
    
  }, [data]); // run this effect only once, when the component mounts

  if (!data || data.length === 0) {
    return <Loading />;
  }

  return (
    <div className='Activity'>
      {/* <h1>Libraries</h1>
      <ul>
        {data.map((series) => (
          <li key={series.Id}>
            <div className='ActivityDetail'>{series.Name}</div>
          </li>
        ))}
      </ul> */}
{/* <PlaybackActivity/> */}
  <LibraryOverView/>

    </div>

  );
}

export default UserData;
