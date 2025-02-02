/* eslint-disable react/prop-types */
import { useState } from "react";

import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import Typography from "@mui/material/Typography";
import Card from "react-bootstrap/Card";
import baseUrl from "../../../lib/baseurl";

import "../../css/timeline/activity-timeline.css";

import moment from "moment";
import TvLineIcon from "remixicon-react/TvLineIcon.js";
import FilmLineIcon from "remixicon-react/FilmLineIcon.js";
import { MEDIA_TYPES } from "./helpers";
import { Link } from "react-router-dom";
import { Trans } from "react-i18next";

function formatEntryDates(entry) {
  const { FirstActivityDate, LastActivityDate, MediaType } = entry;
  const startDate = moment(FirstActivityDate);
  const endDate = moment(LastActivityDate);

  if (startDate.isSame(endDate, "day") || MediaType === MEDIA_TYPES.Movies) {
    return startDate.format("L");
  } else {
    return `${startDate.format("L")} - ${endDate.format("L")}`;
  }
}
const DefaultImage = (props) => {
  const { MediaType } = props;
  return (
    <div className="default_library_image default_library_image_hover d-flex justify-content-center align-items-center">
      {MediaType === MEDIA_TYPES.Shows ? SeriesIcon : MovieIcon}
    </div>
  );
};
const SeriesIcon = <TvLineIcon size={"50%"} color="white" />;
const MovieIcon = <FilmLineIcon size={"50%"} color="white" />;

export default function ActivityTimelineItem(entry) {
  const { Title, SeasonName, NowPlayingItemId, EpisodeCount, MediaType } =
    entry;
  const [useDefaultImage, setUseDefaultImage] = useState(false);
  return (
    <TimelineItem>
      <TimelineSeparator>
        <TimelineConnector />
        <div className="activity-card">
          <Link to={`/libraries/item/${NowPlayingItemId}`}>
            {!useDefaultImage ? (
              <Card.Img
                variant="top"
                className="activity-card-img"
                src={
                  baseUrl +
                  "/proxy/Items/Images/Primary?id=" +
                  NowPlayingItemId +
                  "&fillWidth=800&quality=50"
                }
                onError={() => setUseDefaultImage(true)}
              />
            ) : (
              <DefaultImage {...entry} />
            )}
          </Link>
        </div>
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent>
        <Typography variant="h6" component="span">
          {Title}
        </Typography>
        {SeasonName && <Typography>{SeasonName}</Typography>}
        <Typography>{formatEntryDates(entry)}</Typography>
        {MediaType === MEDIA_TYPES.Shows && EpisodeCount && (
          <Typography>
            {EpisodeCount} <Trans i18nKey="TIMELINE_PAGE.EPISODES" />
          </Typography>
        )}
      </TimelineContent>
    </TimelineItem>
  );
}
