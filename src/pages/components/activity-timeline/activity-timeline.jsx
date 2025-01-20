/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import axios from "../../../lib/axios_instance";

import Timeline from "@mui/lab/Timeline";

import "../../css/timeline/activity-timeline.css";

import Config from "../../../lib/config.jsx";
import Loading from "../../../pages/components/general/loading.jsx";

import ActivityTimelineItem from "./activity-timeline-item.jsx";
import { groupAdjacentSeasons } from "./helpers.jsx";

export default function ActivityTimelineComponent(props) {
  const { userId, libraries } = props;

  const [timelineEntries, setTimelineEntries] = useState();
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

    const fetchLibraries = () => {
      if (config) {
        const url = `/api/getActivityTimeLine`;
        axios
          .post(
            url,
            { userId: userId, libraries: libraries },
            {
              headers: {
                Authorization: `Bearer ${config.token}`,
                "Content-Type": "application/json",
              },
            }
          )
          .then((timelineEntries) => {
            const groupedAdjacentSeasons = groupAdjacentSeasons([
              ...timelineEntries.data,
            ]);
            setTimelineEntries(groupedAdjacentSeasons);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    };

    if (!config) {
      fetchConfig();
    }

    fetchLibraries();
  }, [userId, libraries, config]);

  return timelineEntries?.length > 0 ? (
    <div>
      <Timeline position="alternate">
        {timelineEntries.map((entry) => (
          <ActivityTimelineItem
            key={`${entry.Title}-${entry.FirstActivityDate}-${entry.LastActivityDate}`}
            {...entry}
          />
        ))}
      </Timeline>
    </div>
  ) : (
    <Loading />
  );
}
