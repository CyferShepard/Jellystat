/* eslint-disable react/prop-types */
import { useState } from "react";

import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import Typography from "@mui/material/Typography";
import Card from "react-bootstrap/Card";
import baseUrl from "../../../lib/baseurl";

import "../../css/timeline/activity-timeline.css";

import { useMediaQuery, useTheme } from "@mui/material";
import dayjs from "dayjs";
import TvLineIcon from "remixicon-react/TvLineIcon.js";
import FilmLineIcon from "remixicon-react/FilmLineIcon.js";
import { MEDIA_TYPES } from "./helpers";
import { Link } from "react-router-dom";
import { Trans } from "react-i18next";

const localization = localStorage.getItem("i18nextLng");

const dateFormatOptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
};

function formatEntryDates(FirstActivityDate, LastActivityDate, MediaType) {
  const startDate = dayjs(FirstActivityDate);
  const endDate = dayjs(LastActivityDate);

  if (startDate.isSame(endDate, "day") || MediaType === MEDIA_TYPES.Movies) {
    return Intl.DateTimeFormat(localization, dateFormatOptions).format(
      startDate.toDate()
    );
  } else {
    return `${Intl.DateTimeFormat(localization, dateFormatOptions).format(
      startDate.toDate()
    )} - ${Intl.DateTimeFormat(localization, dateFormatOptions).format(
      endDate.toDate()
    )}`;
  }
}
const DefaultImage = (props) => {
  const { MediaType } = props;
  const SeriesIcon = <TvLineIcon size={"50%"} color="white" />;
  const MovieIcon = <FilmLineIcon size={"50%"} color="white" />;
  return (
    <div className="default_library_image default_library_image_hover d-flex justify-content-center align-items-center">
      {MediaType === MEDIA_TYPES.Shows ? SeriesIcon : MovieIcon}
    </div>
  );
};

const TimeLineTextContent = (props) => {
  const {
    Title,
    SeasonName,
    MediaType,
    EpisodeCount,
    FirstActivityDate,
    LastActivityDate,
  } = props;

  return (
    <div className="activity-description">
      <Typography variant="h6" component="span">
        {Title}
      </Typography>
      {SeasonName && <Typography>{SeasonName}</Typography>}
      <Typography>
        {formatEntryDates(FirstActivityDate, LastActivityDate, MediaType)}
      </Typography>
      {MediaType === MEDIA_TYPES.Shows && EpisodeCount && (
        <Typography>
          {EpisodeCount}{" "}
          <Trans i18nKey="TIMELINE_PAGE.EPISODES" count={+EpisodeCount} />
        </Typography>
      )}
    </div>
  );
};

export default function ActivityTimelineItem(props) {
  const { NowPlayingItemId } = props;
  const [useDefaultImage, setUseDefaultImage] = useState(false);
  const theme = useTheme();
  const shouldRenderVertically = useMediaQuery(theme.breakpoints.down("sm"));

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
              <DefaultImage {...props} />
            )}
          </Link>
        </div>
        {shouldRenderVertically && <TimeLineTextContent {...props} />}
        <TimelineConnector />
      </TimelineSeparator>
      {!shouldRenderVertically ? (
        <TimelineContent>
          <TimeLineTextContent {...props} />
        </TimelineContent>
      ) : (
        <TimelineOppositeContent></TimelineOppositeContent>
      )}
    </TimelineItem>
  );
}
