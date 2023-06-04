import React, { useState, useEffect } from "react";
import axios from 'axios';

import {Button } from 'react-bootstrap';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';


import { saveAs } from 'file-saver';






function Datadebugger() {
  const [data, setData] = useState();
  const token = localStorage.getItem('token');


  useEffect(() => {

    const fetchData = async () => {
      try {

        const libraryData = await axios.post(`/api/getLibraries`, {
          itemid: undefined,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setData(libraryData.data);
        console.log(libraryData.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [token]);

  const handleDownload = (jsonData,filename) => {
    // const jsonData = { /* Your JSON object */ };
  
    const jsonString = JSON.stringify(jsonData);
    const blob = new Blob([jsonString], { type: 'application/json' });
  
    saveAs(blob, filename+'.json');
  };


  return (
    <div style={{color:'white '}}>
      <h1>Data Debugger</h1>
      <br/>
      {/* <p>{data? JSON.stringify(data):''}</p> */}

      <TableContainer className='rounded-2'>
                    <Table aria-label="collapsible table" >
                      <TableHead>
                        <TableRow>
                          <TableCell>Data Type</TableCell>
                          <TableCell>Database Count</TableCell>
                          <TableCell>API Count</TableCell>
                          <TableCell>Difference</TableCell>
                          <TableCell>Export Missing Data</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>

                          <TableRow>
                            <TableCell>Libraries</TableCell>
                            <TableCell>{data ? data.existing_library_count:''}</TableCell>
                            <TableCell>{data ? data.api_library_count:''}</TableCell>
                            <TableCell>{data ? data.api_library_count-data.existing_library_count:''}</TableCell>
                            <TableCell>{data  &&  data.api_library_count!==data.existing_library_count ?       
                              <Button onClick={()=>handleDownload(data.missing_api_library_data,'MissingLibraryData')}>
                               Download
                              </Button>:
                              ''}
                            </TableCell>
                          </TableRow>

                          <TableRow>
                            <TableCell>Library Items</TableCell>
                            <TableCell>{data ? data.existing_item_count:''}</TableCell>
                            <TableCell>{data ? data.api_item_count:''}</TableCell>
                            <TableCell>{data ? data.api_item_count-data.existing_item_count:''}</TableCell>
                            <TableCell>{data  &&  data.api_item_count!==data.existing_item_count ?       
                              <Button onClick={()=>handleDownload(data.missing_api_item_data,'MissingItemData')}>
                               Download
                              </Button>:
                              ''}
                            </TableCell>
                          </TableRow>

                          <TableRow>
                            <TableCell>Seasons</TableCell>
                            <TableCell>{data ? data.existing_season_count:''}</TableCell>
                            <TableCell>{data ? data.api_season_count:''}</TableCell>
                            <TableCell>{data ? data.api_season_count-data.existing_season_count:''}</TableCell>
                            <TableCell>{data  &&  data.api_season_count!==data.existing_season_count ?       
                              <Button onClick={()=>handleDownload(data.missing_api_season_data,'MissingSeasonData')}>
                               Download
                              </Button>:
                              ''}
                            </TableCell>
                          </TableRow>

                          <TableRow>
                            <TableCell>Episodes</TableCell>
                            <TableCell>{data ? data.existing_episode_count:''}</TableCell>
                            <TableCell>{data ? data.api_episode_count:''}</TableCell>
                            <TableCell>{data ? data.api_episode_count-data.existing_episode_count:''}</TableCell>
                            <TableCell>{data  &&  data.api_episode_count!==data.existing_episode_count ?       
                              <Button onClick={()=>handleDownload(data.missing_api_episode_data,'MissingEpisodeData')}>
                               Download
                              </Button>:
                              ''}
                            </TableCell>
                          </TableRow>

                      </TableBody>
                    </Table>
            </TableContainer>

    </div>

  );
}

export default Datadebugger;
