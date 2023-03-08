import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Config from '../lib/config';


import './css/libraries.css'

import Loading from './components/loading';



function Libraries() {
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
                const url = `${config.hostUrl}/Library/MediaFolders`;
                const apiKey = config.apiKey;

                axios.get(url, {
                    headers: {
                        'X-MediaBrowser-Token': apiKey,
                    },
                })
                    .then(data => {
                        console.log('data');
                        setData(data.data.Items);
                        console.log(data);
                    })
                    .catch(error => {
                        console.log(error);
                    });
            }
        };

        if (!config) {
            fetchConfig();
        }

        if (data.length === 0) {
            fetchData();
        }


        const intervalId = setInterval(fetchData, (60000*60));
        return () => clearInterval(intervalId);
    }, [data, config]);





    if (!data || data.length === 0) {
        return <Loading />;
    }

    return (
        <div className='Activity'>
            <h1>Libraries</h1>
            <ul>
                {data &&
                    data.filter(collection => ['tvshows', 'movies'].includes(collection.CollectionType)).map(item => (
                        <li key={item.Id}>

                            {/* <div className='ActivityDetail'> {item.Name}</div> */}
                            <div className='library-banner'>
                                <img className='library-banner-image' src={config.hostUrl + '/Items/' + item.Id + '/Images/Primary?quality=50'} alt=''></img>
                            </div>


                        </li>
                    ))}
            </ul>
        </div>
    );
}

export default Libraries;

