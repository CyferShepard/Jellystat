import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Config from '../lib/config';

import '../App.css'

import Loading from './components/loading';



function Activity() {
  const [data, setData] = useState([]);
  const [config, setConfig] = useState(null);

  useEffect(() => {


    const fetchConfig = async () => {
      try {
        const newConfig = await Config();
        setConfig(newConfig);
      } catch (error) {
        if (error.code === 'ERR_NETWORK') {
          console.log(error);
        }
      }
    };

    const fetchData = () => {
      if (config) {
        const url = `${config.hostUrl}/System/ActivityLog/Entries?limit=30`;
        const apiKey = config.apiKey;

        axios.get(url, {
          headers: {
            'X-MediaBrowser-Token': apiKey,
          },
        })
          .then(newData => {
            if (data && data.length > 0) {
              const newDataOnly = newData.data.Items.filter(item => {
                return !data.some(existingItem => existingItem.Id === item.Id);
              });
              setData([...newDataOnly, ...data.slice(0, data.length - newDataOnly.length)]);
            } else {
              setData(newData.data.Items);
            }
          })
          .catch(error => {
            console.log(error);
          });
      }
    };

    if (!config) {
      fetchConfig();
    }

    const intervalId = setInterval(fetchData, 2000);
    return () => clearInterval(intervalId);
  }, [data,config]);




  const options = {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
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

