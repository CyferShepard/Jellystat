import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../lib/config";
import { Link } from 'react-router-dom';
import AccountCircleFillIcon from "remixicon-react/AccountCircleFillIcon";
import {ButtonGroup, Button } from 'react-bootstrap';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import "./css/users/users.css";

import Loading from "./components/general/loading";

const token = localStorage.getItem('token');

function Row(row) {
  const { data } = row;

  function formatTotalWatchTime(seconds) {
    const hours = Math.floor(seconds / 3600); // 1 hour = 3600 seconds
    const minutes = Math.floor((seconds % 3600) / 60); // 1 minute = 60 seconds
    let formattedTime='';
    if(hours)
    {
      formattedTime+=`${hours} hours`;
    }
    if(minutes)
    {
      formattedTime+=` ${minutes} minutes`;
    }
  
    return formattedTime ;
  }

  function formatLastSeenTime(time) {
    const units = {
      days: ['Day', 'Days'],
      hours: ['Hour', 'Hours'],
      minutes: ['Minute', 'Minutes'],
      seconds: ['Second', 'Seconds']
    };
  
    let formattedTime = '';
  
    for (const unit in units) {
      if (time[unit]) {
        const unitName = units[unit][time[unit] > 1 ? 1 : 0];
        formattedTime += `${time[unit]} ${unitName} `;
      }
    }
  
    return `${formattedTime}ago`;
  }


  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
        {data.PrimaryImageTag ? (
                  <img
                    className="card-user-image"
                    src={
                      row.hostUrl +
                      "/Users/" +
                      data.UserId +
                      "/Images/Primary?quality=10"
                    }
                    alt=""
                  />
                ) : (
                  <AccountCircleFillIcon color="#fff" size={30} />
                )}
        </TableCell>
        <TableCell><Link to={`/users/${data.UserId}`} className="text-decoration-none">{data.UserName}</Link></TableCell>
        <TableCell>{data.LastWatched || 'never'}</TableCell>
        <TableCell>{data.LastClient || 'n/a'}</TableCell>
        <TableCell>{data.TotalPlays}</TableCell>
        <TableCell>{formatTotalWatchTime(data.TotalWatchTime) || 0}</TableCell>
        <TableCell>{data.LastSeen ? formatLastSeenTime(data.LastSeen) : 'never'}</TableCell>

      </TableRow>
    </React.Fragment>
  );
}

function Users() {
  const [data, setData] = useState();
  const [config, setConfig] = useState(null);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [page, setPage] = React.useState(0);
  const [itemCount,setItemCount] = useState(10);




  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config();
        setConfig(newConfig);
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
          console.log(error);
        }
      }
    };

    const fetchData = () => {
      if (config) {
        const url = `/stats/getAllUserActivity`;

        axios
          .get(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })
          .then((data) => {
            setData(data.data);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    };



    fetchData();

    if (!config) {
      fetchConfig();
    }

    const intervalId = setInterval(fetchData, 60000);
    return () => clearInterval(intervalId);
  }, [config]);

  if (!data || data.length === 0) {
    return <Loading />;
  }

  const handleNextPageClick = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handlePreviousPageClick = () => {
    setPage((prevPage) => prevPage - 1);
  };




  return (
    <div className="Users">
      <div className="Heading py-2">
      <h1 >All Users</h1>
      <div className="pagination-range">
          <div className="header">Items</div>
          <select value={itemCount} onChange={(event) => {setRowsPerPage(event.target.value); setPage(0); setItemCount(event.target.value);}}>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
        </div>
      </div>

      <TableContainer className='rounded-2'>
                    <Table aria-label="collapsible table" >
                      <TableHead>
                        <TableRow>
                          <TableCell></TableCell>
                          <TableCell>User</TableCell>
                          <TableCell>Last Watched</TableCell>
                          <TableCell>Last Client</TableCell>
                          <TableCell>Plays</TableCell>
                          <TableCell>Watch Time</TableCell>
                          <TableCell>Last Seen</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data && data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((row) => (
                            <Row key={row.id} data={row} hostUrl={config.hostUrl}/>
                          ))}
                          {data.length===0 ? <tr><td colSpan="5" style={{ textAlign: "center", fontStyle: "italic" ,color:"grey"}}>No Backups Found</td></tr> :''}
            
                      </TableBody>
                    </Table>
            </TableContainer>

            <div className='d-flex justify-content-end my-2'>
                <ButtonGroup className="pagination-buttons">
                    <Button className="page-btn" onClick={()=>setPage(0)} disabled={page === 0}>
                      First
                    </Button>

                    <Button className="page-btn" onClick={handlePreviousPageClick}  disabled={page === 0}>
                      Previous
                    </Button>

                    <div className="page-number d-flex align-items-center justify-content-center">{`${page *rowsPerPage + 1}-${Math.min((page * rowsPerPage+ 1 ) +  (rowsPerPage - 1),data.length)} of ${data.length}`}</div>

                    <Button className="page-btn" onClick={handleNextPageClick}  disabled={page >= Math.ceil(data.length / rowsPerPage) - 1}>
                      Next
                    </Button>

                    <Button className="page-btn" onClick={()=>setPage(Math.ceil(data.length / rowsPerPage) - 1)} disabled={page >= Math.ceil(data.length / rowsPerPage) - 1}>
                      Last
                    </Button>
                </ButtonGroup>
            </div>



    </div>
  );
}
export default Users;
