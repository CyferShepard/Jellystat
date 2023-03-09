import React, { useState, useEffect } from 'react';
import API from '../classes/jellyfin-api';

import '../App.css'

import Loading from './components/loading';



function Activity() {
  const [data, setData] = useState([]);

  useEffect(() => {
    let _api= new API()

    const fetchData = () => {
      _api.getActivityData(30).then((ActivityData) => {
        if (data && data.length > 0) 
        {
          const newDataOnly = ActivityData.Items.filter(item => {
            return !data.some(existingItem => existingItem.Id === item.Id);
          });
          setData([...newDataOnly, ...data.slice(0, data.length - newDataOnly.length)]);
        } else 
        {
          setData(ActivityData.Items);
        }
      });
    };


    const intervalId = setInterval(fetchData, 1000);
    return () => clearInterval(intervalId);
  }, [data]);





  const options = {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  };

  if (!data || data.length === 0) {
    return <Loading />;
  }

  return (
    <div className='Activity'>
      <h1>Activity Log</h1>
      <ul>
        {data &&
          data.map(item => (
            <li key={item.Id} className={data.findIndex(items => items.Id === item.Id) <= 30 ? 'new' : 'old'}>

              <div className='ActivityDetail'> {item.Name}</div>
              <div className='ActivityTime'>{new Date(item.Date).toLocaleString('en-GB', options).replace(',', '')}</div>

            </li>
          ))}
      </ul>
    </div>
  );
}

export default Activity;

