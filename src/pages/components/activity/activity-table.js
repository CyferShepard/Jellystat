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
import TableSortLabel from '@mui/material/TableSortLabel';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import { visuallyHidden } from '@mui/utils';


import AddCircleFillIcon from 'remixicon-react/AddCircleFillIcon';
import IndeterminateCircleFillIcon from 'remixicon-react/IndeterminateCircleFillIcon';

import '../../css/activity/activity-table.css';
// localStorage.setItem('hour12',true);


function formatTotalWatchTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  let timeString = '';

  if (hours > 0) {
    timeString += `${hours} ${hours === 1 ? 'hr' : 'hrs'} `;
  }

  if (minutes > 0) {
    timeString += `${minutes} ${minutes === 1 ? 'min' : 'mins'} `;
  }

  if (remainingSeconds > 0) {
    timeString += `${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`;
  }

  return timeString.trim();
}

function Row(data) {
  const { row } = data;
  const [open, setOpen] = React.useState(false);
  const twelve_hr = JSON.parse(localStorage.getItem('12hr'));

  const options = {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: twelve_hr,
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
        {/* <TableCell>{formatTotalWatchTime(row.results && row.results.length>0 ?  row.results.reduce((acc, items) => acc +parseInt(items.PlaybackDuration),0): row.PlaybackDuration) || '0 minutes'}</TableCell> */}
        <TableCell>{formatTotalWatchTime(row.PlaybackDuration) || '0 seconds'}</TableCell>
        <TableCell>{row.results.length !==0 ? row.results.length : 1}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>

              <Table aria-label="sub-activity" className='rounded-2'>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Playback Duration</TableCell>
                    <TableCell>Plays</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.results.sort((a, b) => new Date(b.ActivityDateInserted) - new Date(a.ActivityDateInserted)).map((resultRow) => (
                    <TableRow key={resultRow.Id}>
 
                        <TableCell><Link to={`/users/${resultRow.UserId}`} className='text-decoration-none'>{resultRow.UserName}</Link></TableCell>
                        <TableCell><Link to={`/libraries/item/${resultRow.EpisodeId || resultRow.NowPlayingItemId}`} className='text-decoration-none'>{!resultRow.SeriesName ? resultRow.NowPlayingItemName : resultRow.SeriesName+' - '+ resultRow.NowPlayingItemName}</Link></TableCell>
                        <TableCell>{resultRow.Client}</TableCell>
                        <TableCell>{Intl.DateTimeFormat('en-UK', options).format(new Date(resultRow.ActivityDateInserted))}</TableCell>
                        <TableCell>{formatTotalWatchTime(resultRow.PlaybackDuration) || '0 seconds'}</TableCell>
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

function EnhancedTableHead(props) {
  const {  order, orderBy, onRequestSort } =
    props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  const headCells = [
    {
      id: 'UserName',
      numeric: false,
      disablePadding: true,
      label: 'Last User',
    },
    {
      id: 'NowPlayingItemName',
      numeric: false,
      disablePadding: false,
      label: 'Title',
    },
    {
      id: 'Client',
      numeric: false,
      disablePadding: false,
      label: 'Last Client',
    },
    {
      id: 'ActivityDateInserted',
      numeric: false,
      disablePadding: false,
      label: 'Date',
    },
    {
      id: 'PlaybackDuration',
      numeric: false,
      disablePadding: false,
      label: 'Total Playback',
    },    
    {
      id: 'TotalPlays',
      numeric: false,
      disablePadding: false,
      label: 'TotalPlays',
    },
  ];


  return (
    <TableHead>
      <TableRow>
        <TableCell/>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

export default function ActivityTable(props) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const [order, setOrder] = React.useState('desc');
  const [orderBy, setOrderBy] = React.useState('ActivityDateInserted');


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


    function descendingComparator(a, b, orderBy) {
      if (b[orderBy] < a[orderBy]) {
        return -1;
      }
      if (b[orderBy] > a[orderBy]) {
        return 1;
      }
      return 0;
    }
   
    // eslint-disable-next-line 
    function getComparator(order, orderBy) {
      return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
    }
    

    function stableSort(array, comparator) {
      const stabilizedThis = array.map((el, index) => [el, index]);

      stabilizedThis.sort((a, b) => {

        const order = comparator(a[0], b[0]);
        if (order !== 0) {
          return order;
        }
        return a[1] - b[1];
        
      });

      return stabilizedThis.map((el) => el[0]);
    }

    const visibleRows = React.useMemo(
      () =>
        stableSort(props.data, getComparator(order, orderBy)).slice(
          page * rowsPerPage,
          page * rowsPerPage + rowsPerPage,
        ),
      [order, orderBy, page, rowsPerPage, getComparator, props.data],
    );

    const handleRequestSort = (event, property) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
    };
  
  
  

  return (
    <>
      <TableContainer className='rounded-2'>
        <Table aria-label="collapsible table" >
        <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rowCount={rowsPerPage}
            />
          <TableBody>
            {visibleRows.map((row) => (
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