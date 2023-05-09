import React from 'react';
import { Link } from "react-router-dom";
import { Button, ButtonGroup } from "react-bootstrap";


import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';

import AddCircleFillIcon from 'remixicon-react/AddCircleFillIcon';
import IndeterminateCircleFillIcon from 'remixicon-react/IndeterminateCircleFillIcon';

import '../../css/activity/activity-table.css';
// localStorage.setItem('hour12',true);
let hour_format = Boolean(localStorage.getItem('hour12'));

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

  if(!hours && !minutes)
  {
    // const seconds = Math.floor(((seconds % 3600) / 60) / 60); // 1 minute = 60 seconds
    formattedTime+=` ${seconds} seconds`;
  }

  return formattedTime ;
}

function Row(data) {
  const { row } = data;
  const [open, setOpen] = React.useState(false);
  // const classes = useRowStyles();

  const options = {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: hour_format,
  };



  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => {if(row.results.length>1){setOpen(!open);}}}
            >
              {!open ? <AddCircleFillIcon opacity={row.results.length>1 ?1 : 0} cursor={row.results.length>1 ? "pointer":"default"}/> : <IndeterminateCircleFillIcon />}
          </IconButton>
        </TableCell>
        <TableCell><Link to={`/users/${row.UserId}`} className='text-decoration-none'>{row.UserName}</Link></TableCell>
        <TableCell><Link to={`/libraries/item/${row.EpisodeId || row.NowPlayingItemId}`} className='text-decoration-none'>{!row.SeriesName ? row.NowPlayingItemName : row.SeriesName+' - '+ row.NowPlayingItemName}</Link></TableCell>
        <TableCell>{row.Client}</TableCell>
        <TableCell>{Intl.DateTimeFormat('en-UK', options).format(new Date(row.ActivityDateInserted))}</TableCell>
        <TableCell>{formatTotalWatchTime(row.PlaybackDuration) || '0 minutes'}</TableCell>
        <TableCell>{row.results.length !==0 ? row.results.length : 1}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>

              <Table aria-label="sub-activity" className='rounded-2'>
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Playback Duration</TableCell>
                    <TableCell>Plays</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.results.map((resultRow) => (
                    <TableRow key={resultRow.Id}>
 
                        <TableCell><Link to={`/users/${resultRow.UserId}`} className='text-decoration-none'>{resultRow.UserName}</Link></TableCell>
                        <TableCell><Link to={`/libraries/item/${resultRow.EpisodeId || resultRow.NowPlayingItemId}`} className='text-decoration-none'>{!resultRow.SeriesName ? resultRow.NowPlayingItemName : resultRow.SeriesName+' - '+ resultRow.NowPlayingItemName}</Link></TableCell>
                        <TableCell>{resultRow.Client}</TableCell>
                        <TableCell>{Intl.DateTimeFormat('en-UK', options).format(new Date(resultRow.ActivityDateInserted))}</TableCell>
                        <TableCell>{formatTotalWatchTime(resultRow.PlaybackDuration) || '0 minutes'}</TableCell>
                        <TableCell>1</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default function ActivityTable(props) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);


  if(rowsPerPage!==props.itemCount)
  {
    setRowsPerPage(props.itemCount);
    setPage(0);
  }


  const handleNextPageClick = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handlePreviousPageClick = () => {
    setPage((prevPage) => prevPage - 1);
  };

  return (
    <>
      <TableContainer className='rounded-2'>
        <Table aria-label="collapsible table" >
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Username</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Playback Duration</TableCell>
              <TableCell>Plays</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <Row key={row.Id+row.NowPlayingItemId+row.EpisodeId} row={row} />
              ))}
              {props.data.length===0 ? <tr><td colSpan="7" style={{ textAlign: "center", fontStyle: "italic" ,color:"grey"}} className='py-2'>No Activity Found</td></tr> :''}
            
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

                    <div className="page-number d-flex align-items-center justify-content-center">{`${page *rowsPerPage + 1}-${Math.min((page * rowsPerPage+ 1 ) +  (rowsPerPage - 1),props.data.length)} of ${props.data.length}`}</div>

                    <Button className="page-btn" onClick={handleNextPageClick}  disabled={page >= Math.ceil(props.data.length / rowsPerPage) - 1}>
                      Next
                    </Button>

                    <Button className="page-btn" onClick={()=>setPage(Math.ceil(props.data.length / rowsPerPage) - 1)} disabled={page >= Math.ceil(props.data.length / rowsPerPage) - 1}>
                      Last
                    </Button>
                </ButtonGroup>
            </div>
    
    </>
  );
}