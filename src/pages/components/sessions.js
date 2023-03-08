import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Config from '../../lib/config';

import "../css/sessions.css"
// import "../../App.css"


import SessionCard from './session-card';


import Loading from './loading';





function Sessions() {
  const [data, setData] = useState([]);
  const [base_url, setURL] = useState('');
  // const [errorHandler, seterrorHandler] = useState({ error_count: 0, error_message: '' })


  useEffect(() => {
    Config().then(config => {
      console.log('hit api');
      // let error_counter=0;
      setURL(config.hostUrl);
      const url = `${config.hostUrl}/sessions`;
      const fetchData = () => {
        axios.get(url, {
          headers: {
            'X-MediaBrowser-Token': config.apiKey,
          },
        })
          .then(response => setData(response.data))
          .catch(error => { 
            console.log(error);
            // error_counter++;
            // console.log(error_counter);
            // if(error_counter>9)
            // {
            //   console.log('Terminating');
            //   return () => clearInterval(intervalId);
            // }
          }
            );
      };

      //   fetchData();
      const intervalId = setInterval(fetchData, 1000);
      return () => clearInterval(intervalId);
    }).catch(error => {
      // if (error.code === 'ERR_NETWORK') {
      //   console.log(errorHandler.error_count);
      //   let _error_count = 1;
      //   let _error_message = '';
      //   seterrorHandler({ error_count: _error_count, error_message: _error_message });
      // }

      console.log(error);
    }
    );
  }, []);



  if (!data || data.length === 0) {
    return <Loading />;
  }


  return (

    <div className='sessions'>
      {data &&
        data.sort((a, b) => a.Id.padStart(12, '0').localeCompare(b.Id.padStart(12, '0'))).map(session => (

          <SessionCard data={{ session: session, base_url: base_url }}/>
         
        ))}
    </div>

  );
}

export default Sessions;

