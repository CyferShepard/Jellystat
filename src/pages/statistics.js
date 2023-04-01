import React,{useState} from 'react';

// import './css/library/libraries.css';
import DailyPlayStats from './components/statistics/daily-play-count';

function Statistics(props) {

  const [days, setDays] = useState(60);


      return (
       <DailyPlayStats days={days}/>
      );
      
}

export default Statistics;


