import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from "recharts";

function Chart({ stats, libraries, viewName }) {
  const colors = [
    "rgb(54, 162, 235)", // blue
    "rgb(255, 99, 132)", // pink
    "rgb(75, 192, 192)", // teal
    "rgb(255, 159, 64)", // orange
    "rgb(153, 102, 255)", // lavender
    "rgb(255, 205, 86)", // yellow
    "rgb(201, 203, 207)", // light grey
    "rgb(101, 119, 134)", // blue-grey
    "rgb(255, 87, 87)", // light red
    "rgb(50, 205, 50)", // lime green
    "rgb(0, 255, 255)", // light cyan
    "rgb(255, 255, 0)", // light yellow
    "rgb(30, 144, 255)", // dodger blue
    "rgb(192, 192, 192)", // silver
    "rgb(255, 20, 147)", // deep pink
    "rgb(105, 105, 105)", // dim grey
    "rgb(240, 248, 255)", // alice blue
    "rgb(255, 182, 193)", // light pink
    "rgb(245, 222, 179)", // wheat
    "rgb(147, 112, 219)", // medium purple
  ];

  const flattenedStats = stats.map(item => {
    const flatItem = { Key: item.Key };
    for (const [libraryName, data] of Object.entries(item)) {
      if (libraryName === "Key") continue;
      flatItem[libraryName] = data[viewName] ?? 0;
    }
    return flatItem;
  });

  const CustomTooltip = ({ payload, label, active }) => {
    if (active) {
      return (
        <div style={{ backgroundColor: "rgba(0,0,0,0.8)", color: "white" }} className="p-2 rounded-2 border-0">
          <p className="text-center fs-5">{label}</p>
          {libraries.map((library, index) => (
            // <p key={library.Id} style={{ color: `${colors[index]}` }}>{`${library.Name} : ${payload[index].value} Views`}</p>
            <p key={library.Id} style={{ color: `${colors[index]}` }}>
              {`${library.Name} : ${payload?.find(p => p.dataKey === library.Name).value} ${viewName === "count" ? "Views" : "Minutes"}`}
            </p>
          ))}
        </div>
      );
    }

    return null;
  };

  const getMaxValue = () => {
    let max = 0;
    flattenedStats.forEach(datum => {
      libraries.forEach(library => {
        const value = parseFloat(datum[library.Name]);
        if (!isNaN(value)) {
          max = Math.max(max, value);
        }
      });
    });
    return max;
  };

  const max = getMaxValue() + 10;

  return (
    <ResponsiveContainer width="100%">
      <AreaChart data={flattenedStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          {libraries.map((library, index) => (
            <linearGradient key={library.Id} id={library.Id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[index]} stopOpacity={0.8} />
              <stop offset="95%" stopColor={colors[index]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <XAxis dataKey="Key" interval={0} angle={-60} textAnchor="end" height={100} />
        <YAxis domain={[0, max]} />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="bottom" />
        {libraries.map((library, index) => (
          <Area
            key={library.Id}
            type="monotone"
            dataKey={library.Name}
            stroke={colors[index]}
            fillOpacity={1}
            fill={"url(#" + library.Id + ")"}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default Chart;
