import React ,{useState} from 'react';
import { Link } from "react-router-dom";
// import { useParams } from 'react-router-dom';

import '../../css/activity/activity-table.css';



function ActivityTable(props) {

    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [currentPage, setCurrentPage] = useState(1);

    const [data, setData] = useState(props.data);
  
    function handleSort(key) {
        const direction =
          sortConfig.key === key && sortConfig.direction === "ascending"
            ? "descending"
            : "ascending";
        setSortConfig({ key, direction });
      }  
    
    function sortData(data, { key, direction }) {
      if (!key) return data;

      const sortedData = [...data];

      sortedData.sort((a, b) => {
        if (a[key] < b[key]) return direction === "ascending" ? -1 : 1;
        if (a[key] > b[key]) return direction === "ascending" ? 1 : -1;
        return 0;
      });

      return sortedData;
    }

    const options = {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      };


    const sortedData = sortData(data, sortConfig);
 
    const indexOfLastUser = currentPage * props.itemCount;
    const indexOfFirstUser = indexOfLastUser - props.itemCount;
    const currentData = sortedData.slice(indexOfFirstUser, indexOfLastUser);

    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(sortedData.length / props.itemCount); i++) {
      pageNumbers.push(i);
    }

    const handleCollapse = (itemId) => {
      setData(data.map(item => {
        if ((item.NowPlayingItemId+item.EpisodeId) === itemId) {
          return { ...item, isCollapsed: !item.isCollapsed };
        } else {
          return item;
        }
      }));
    }
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
    
  
   
  return (
    <div>
     
    <div className='activity-table'>
        <div className='table-headers'>
            <div onClick={() => handleSort("UserName")}>User</div>
            <div onClick={() => handleSort("NowPlayingItemName")}>Title </div>
            <div onClick={() => handleSort("ActivityDateInserted")}>Date</div>
            <div onClick={() => handleSort("PlaybackDuration")}>Playback Duration</div>
            <div onClick={() => handleSort("results")}>Total Plays</div>
        </div>

    {currentData.map((item) => (

                <div className='table-rows' key={item.NowPlayingItemId+item.EpisodeId} onClick={() => handleCollapse(item.NowPlayingItemId+item.EpisodeId)}>
                    <div className='table-rows-content'>
                      <div><Link to={`/users/${item.UserId}`}>{item.UserName}</Link></div>
                      <div><Link to={`/item/${item.EpisodeId || item.NowPlayingItemId}`}>{!item.SeriesName ? item.NowPlayingItemName : item.SeriesName+' - '+ item.NowPlayingItemName}</Link></div>
                      <div>{Intl.DateTimeFormat('en-UK', options).format(new Date(item.ActivityDateInserted))}</div>
                      <div>{formatTotalWatchTime(item.PlaybackDuration) || '0 sec'}</div>
                      <div>{item.results.length+1}</div>
                    </div>
                    <div className={`sub-table ${item.isCollapsed ? 'collapsed' : ''}`}>
                    {item.results.map((sub_item,index) => (

                         <div className='table-rows-content  bg-grey sub-row' key={sub_item.EpisodeId+index}>
                            <div><Link to={`/users/${sub_item.UserId}`}>{sub_item.UserName}</Link></div>
                            <div><Link to={`/item/${sub_item.EpisodeId || sub_item.NowPlayingItemId}`}>{!sub_item.SeriesName ? sub_item.NowPlayingItemName : sub_item.SeriesName+' - '+ sub_item.NowPlayingItemName}</Link></div>
                            <div>{Intl.DateTimeFormat('en-UK', options).format(new Date(sub_item.ActivityDateInserted))}</div>
                            <div></div>
                            <div>1</div>
                        </div>
                                  ))}
                    </div>
                </div>
          ))}
    </div>



      
      
      {props.itemCount>0  ?

                <div className="pagination">
                    <button className="page-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                      First
                    </button>

                    <button className="page-btn" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                      Previous
                    </button>

                    <div className="page-number">{`Page ${currentPage} of ${pageNumbers.length}`}</div>

                    <button className="page-btn" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === pageNumbers.length}>
                      Next
                    </button>

                    <button className="page-btn" onClick={() => setCurrentPage(pageNumbers.length)} disabled={currentPage === pageNumbers.length}>
                      Last
                    </button>
                </div>
            :<></>

        }
    </div>
  );
}
export default ActivityTable;
