import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from "recharts";

function PlayMethodChart({ stats, types }) {
  console.log(stats);
  console.log(types);
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

  const CustomTooltip = ({ payload, label, active }) => {
    if (active) {
      return (
        <div style={{ backgroundColor: "rgba(0,0,0,0.8)", color: "white" }} className="p-2 rounded-2 border-0">
          <p className="text-center fs-5">{label}</p>
          {types.map((type, index) => (
            <p key={type.Id} style={{ color: `${colors[index]}` }}>{`${type.Name} : ${payload[index].value} Views`}</p>
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
      <AreaChart data={stats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          {types.map((type, index) => (
            <linearGradient key={type.Id} id={type.Name} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[index]} stopOpacity={0.8} />
              <stop offset="95%" stopColor={colors[index]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <XAxis dataKey="Key" interval={0} angle={-60} textAnchor="end" height={100} />
        <YAxis domain={[0, max]} />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="bottom" />
        {types.map((type, index) => (
          <Area
            key={type.Id}
            type="monotone"
            dataKey={type.Name}
            stroke={colors[index]}
            fillOpacity={1}
            fill={"url(#" + type.Name + ")"}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default PlayMethodChart;
