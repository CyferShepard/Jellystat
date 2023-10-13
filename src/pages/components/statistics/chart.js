import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

function Chart({ stats, libraries }) {
  const wordToColor = (word) => {
    let number = 0;
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i);
      const letterValue = charCode - 65;
      number += letterValue;
    }

    let hash = number;
    const str = number.toString();
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i);
    }
    // Map the hash to an RGB color, with each channel restricted to a certain range
    const red = (hash % 256) * 4;
    const green = ((hash >> 8) % 256) * 2;
    const blue = (hash >> 16) % 256;
    // Return an RGB color string
    return `rgb(${red}, ${green}, ${blue})`;
  };

  const CustomTooltip = ({ payload, label, active }) => {
    if (active) {
      return (
        <div
          style={{ backgroundColor: "rgba(0,0,0,0.8)", color: "white" }}
          className="p-2 rounded-2 border-0"
        >
          <p className="text-center fs-5">{label}</p>
          {libraries.map((library, index) => (
            <p
              key={library.Id}
              style={{ color: `${wordToColor(library.Name)}` }}
            >{`${library.Name} : ${payload[index].value} Views`}</p>
          ))}
        </div>
      );
    }

    return null;
  };

  const getMaxValue = () => {
    let max = 0;
    if (stats) {
      stats.forEach((datum) => {
        Object.keys(datum).forEach((key) => {
          if (key !== "Key") {
            max = Math.max(max, parseInt(datum[key]));
          }
        });
      });
    }

    return max;
  };

  const max = getMaxValue() + 10;

  return (
    <ResponsiveContainer width="100%">
      <AreaChart
        data={stats}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          {libraries.map((library) => (
            <linearGradient
              key={library.Id}
              id={library.Id}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={wordToColor(library.Name)}
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor={wordToColor(library.Name)}
                stopOpacity={0}
              />
            </linearGradient>
          ))}
        </defs>
        <XAxis
          dataKey="Key"
          interval={0}
          angle={-60}
          textAnchor="end"
          height={100}
        />
        <YAxis domain={[0, max]} />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="bottom" />
        {libraries.map((library) => (
          <Area
            key={library.Id}
            type="monotone"
            dataKey={library.Name}
            stroke={wordToColor(library.Name)}
            fillOpacity={1}
            fill={"url(#" + library.Id + ")"}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default Chart;
