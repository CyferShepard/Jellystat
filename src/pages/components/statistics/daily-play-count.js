import React,{useState,useEffect} from 'react';
import axios from 'axios';
import { ResponsiveLine } from '@nivo/line';

import '../../css/stats.css';

function DailyPlayStats(props) {
    const [data, setData] = useState();
  const [days, setDays] = useState(60);

 


  useEffect(() => {


    const fetchLibraries = () => {

        const url = `/stats/getViewsOverTime`;

        axios
        .post(url, {days:days}, {
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((data) => {
            setData(data.data);
          })
          .catch((error) => {
            console.log(error);
          });
      
    };



    if (!data) {
      fetchLibraries();
    }
    if (days !== props.days) {
      setDays(props.days);
      fetchLibraries();
    }


    const intervalId = setInterval(fetchLibraries, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data, days,props.days]);

  if (!data) {
    return  <></>;
  }

  
  if (data.length === 0) {
    return (<div  className="statistics-widget">

      <h1>Daily Play Count Per Library - {days} Days</h1>


      <h1>No Stats to display</h1>

    </div>
    );
  }



      return (
        <div className="statistics-widget" >
            <h1>Daily Play Count Per Library - {days} Days</h1>
        <ResponsiveLine
        data={data}
        margin={{ top: 50, right: 100, bottom: 150, left: 50 }}
        xScale={{ type: 'point' }}
        yScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto',
            stacked: false,
            reverse: false
        }}
        enableGridX={false}
        enableSlices={"x"}
        yFormat=" >-.0f"
        curve="natural"

        axisBottom={{
            orient: 'bottom',
            tickSize: 5,
            tickPadding: 10,
            tickRotation: 0,
            legend: 'Days',
            legendOffset: 36,
            legendPosition: 'middle',
            itemTextColor: '#fff'
        }}
        axisLeft={{
            orient: 'left',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Views',
            legendOffset: -40,
            legendPosition: 'middle',
            itemTextColor: '#fff',
            
        }}
        
        colors={{ scheme: 'category10' }}
        pointSize={10}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabelYOffset={-12}
        useMesh={true}
        legends={[
            {

                itemTextColor: '#fff',
                anchor: 'bottom',
                direction: 'row',
                justify: false,
                translateX: 0,
                translateY: 80,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: 'circle',
                symbolBorderColor: 'rgba(0, 0, 0, .5)',
                effects: [
                    {
                        on: 'hover',
                        style: {
                            itemBackground: 'rgba(0, 0, 0, .03)',
                            itemOpacity: 1
                        }
                    }
                ]
            }
        ]}
    />
        </div>
      );
      
}

export default DailyPlayStats;


