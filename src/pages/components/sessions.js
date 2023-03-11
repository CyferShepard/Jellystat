import React, { useState, useEffect } from 'react';
// import axios from 'axios';
import Config from '../../lib/config';
import API from '../../classes/jellyfin-api';

import "../css/sessions.css"
// import "../../App.css"


import SessionCard from './session-card';


import Loading from './loading';





function Sessions() {
  const [data, setData] = useState([]);
  const [base_url, setURL] = useState('');
  // const [errorHandler, seterrorHandler] = useState({ error_count: 0, error_message: '' })


  useEffect(() => {
    const _api = new API();
    const fetchData = () => {
      _api.getSessions().then((SessionData) => {
        setData(SessionData);
      });
    };

    if(base_url==='')
    {
      Config().then(config => {
        setURL(config.hostUrl);
      }).catch(error => {
        console.log(error);
      }
      );
    }


    const intervalId = setInterval(fetchData, 1000);
    return () => clearInterval(intervalId);
  }, []);



  if (!data || data.length === 0) {
    return <Loading />;
  }


  return (

    <div className='sessions'>
      {data &&
        data.sort((a, b) => a.Id.padStart(12, '0').localeCompare(b.Id.padStart(12, '0'))).map(session => (

          <SessionCard data={{ session: session, base_url: base_url }} />

        ))}
    </div>

  );
}

export default Sessions;

