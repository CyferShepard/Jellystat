import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import Config from "../../../lib/config";

import ItemStatComponent from "./ItemStatComponent";
import { Trans } from "react-i18next";

import BarChartGroupedLineIcon from "remixicon-react/BarChartGroupedLineIcon";

function PlaybackMethodStats(props) {
  const translations = {
    DirectPlay: <Trans i18nKey="DIRECT" />,
    Transcode: <Trans i18nKey="TRANSCODE" />,
    DirectStream: <Trans i18nKey="DIRECT_STREAM" />
  };
  const chartIcon = <BarChartGroupedLineIcon size={"100%"} />;

  const [data, setData] = useState();
  const [days, setDays] = useState(30);

  const [config, setConfig] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.getConfig();
        setConfig(newConfig);
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
          console.log(error);
        }
      }
    };

    const fetchStats = () => {
      if (config) {
        const url = `/stats/getPlaybackMethodStats`;

        axios
          .post(
            url,
            { days: props.days },
            {
              headers: {
                Authorization: `Bearer ${config.token}`,
                "Content-Type": "application/json",
              },
            }
          )
          .then((data) => {
            setData(data.data);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    };

    if (!config) {
      fetchConfig();
    }

    if (!data) {
      fetchStats();
    }
    if (days !== props.days) {
      setDays(props.days);
      fetchStats();
    }

    const intervalId = setInterval(fetchStats, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data, config, days, props.days]);

  if (!data || data.length === 0) {
    return <></>;
  }

  return (
    <ItemStatComponent
      base_url={config.settings?.EXTERNAL_URL ?? config.hostUrl}
      data={data.map((stream) => {
        if (stream.Name === "DirectPlay") {
          return { ...stream, Name: translations.DirectPlay };
        } else if (stream.Name === "DirectStream") {
          return { ...stream, Name: translations.DirectStream };
        } else {
          return { ...stream, Name: translations.Transcode };
        }
      })}
      icon={chartIcon}
      heading={<Trans i18nKey="STAT_CARDS.CONCURRENT_STREAMS" />}
      units={<Trans i18nKey="UNITS.STREAMS" />}
    />
  );
}

export default PlaybackMethodStats;
