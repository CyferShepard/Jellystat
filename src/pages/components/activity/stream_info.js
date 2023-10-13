import React from "react";
import "../../css/activity/stream-info.css";
// import { Button } from "react-bootstrap";
import Loading from "../general/loading";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

function Row(logs) {
  const { data } = logs;

  function convertBitrate(bitrate) {
    if (!bitrate) {
      return "-";
    }
    const kbps = (bitrate / 1000).toFixed(1);
    const mbps = (bitrate / 1000000).toFixed(1);

    if (kbps >= 1000) {
      return mbps + " Mbps";
    } else {
      return kbps + " Kbps";
    }
  }

  if (!data || !data.MediaStreams) {
    return null;
  }

  return (
    <React.Fragment>
      <TableRow>
        <TableCell colSpan="3">
          <strong>Media</strong>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell className="py-0 pb-1">Bitrate</TableCell>
        <TableCell className="py-0 pb-1">
          {convertBitrate(
            data.TranscodingInfo
              ? data.TranscodingInfo.Bitrate
              : data.MediaStreams
              ? data.MediaStreams.find((stream) => stream.Type === "Video")
                  ?.BitRate
              : null,
          )}
        </TableCell>
        <TableCell className="py-0 pb-1">
          {convertBitrate(
            data.MediaStreams
              ? data.MediaStreams.find((stream) => stream.Type === "Video")
                  ?.BitRate
              : null,
          )}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell className="py-0 pb-1">Container</TableCell>
        <TableCell className="py-0 pb-1">
          {data.TranscodingInfo
            ? data.TranscodingInfo.Container.toUpperCase()
            : data.OriginalContainer.toUpperCase()}
        </TableCell>
        <TableCell className="py-0 pb-1">
          {data.OriginalContainer.toUpperCase()}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell>
          <strong>Video</strong>
        </TableCell>
        <TableCell colSpan="2">
          <strong>
            {data.TranscodingInfo
              ? data.TranscodingInfo?.IsVideoDirect
                ? "DIRECT"
                : "TRANSCODE"
              : "DIRECT"}
          </strong>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell className="py-0 pb-1">Codec</TableCell>
        <TableCell className="py-0 pb-1">
          {data.TranscodingInfo
            ? data.TranscodingInfo.VideoCodec?.toUpperCase()
            : data.MediaStreams
            ? data.MediaStreams.find(
                (stream) => stream.Type === "Video",
              )?.Codec?.toUpperCase()
            : "-"}
        </TableCell>
        <TableCell className="py-0 pb-1">
          {data.MediaStreams
            ? data.MediaStreams.find(
                (stream) => stream.Type === "Video",
              )?.Codec?.toUpperCase()
            : "-"}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell className="py-0 pb-3">Bitrate</TableCell>
        <TableCell className="py-0 pb-3">
          {convertBitrate(
            data.TranscodingInfo
              ? data.TranscodingInfo.Bitrate
              : data.MediaStreams
              ? data.MediaStreams.find((stream) => stream.Type === "Video")
                  ?.BitRate
              : null,
          )}
        </TableCell>
        <TableCell className="py-0 pb-3">
          {convertBitrate(
            data.MediaStreams
              ? data.MediaStreams.find((stream) => stream.Type === "Video")
                  ?.BitRate
              : null,
          )}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell className="py-0 pb-1">Width</TableCell>
        <TableCell className="py-0 pb-1">
          {data.TranscodingInfo
            ? data.TranscodingInfo.Width
            : data.MediaStreams
            ? data.MediaStreams.find((stream) => stream.Type === "Video")?.Width
            : "-"}
        </TableCell>
        <TableCell className="py-0 pb-1">
          {data.MediaStreams
            ? data.MediaStreams.find((stream) => stream.Type === "Video")?.Width
            : "-"}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell className="py-0 pb-3">Height</TableCell>
        <TableCell className="py-0 pb-3">
          {data.TranscodingInfo
            ? data.TranscodingInfo?.Height
            : data.MediaStreams?.find((stream) => stream.Type === "Video")
                ?.Height}
        </TableCell>
        <TableCell className="py-0 pb-3">
          {data.MediaStreams
            ? data.MediaStreams.find((stream) => stream.Type === "Video")
                ?.Height
            : "-"}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell className="py-0 pb-1">Framerate</TableCell>
        <TableCell className="py-0 pb-1">
          {data.MediaStreams
            ? parseFloat(
                data.MediaStreams.find((stream) => stream.Type === "Video")
                  ?.RealFrameRate,
              ).toFixed(2)
            : "-"}
        </TableCell>
        <TableCell className="py-0 pb-1">
          {data.MediaStreams
            ? parseFloat(
                data.MediaStreams.find((stream) => stream.Type === "Video")
                  ?.RealFrameRate,
              ).toFixed(2)
            : "-"}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell className="py-0 pb-1">Dynamic Range</TableCell>
        <TableCell className="py-0 pb-1">
          {data.MediaStreams
            ? data.MediaStreams.find((stream) => stream.Type === "Video")
                ?.VideoRange
            : "-"}
        </TableCell>
        <TableCell className="py-0 pb-1">
          {data.MediaStreams
            ? data.MediaStreams.find((stream) => stream.Type === "Video")
                ?.VideoRange
            : "-"}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell className="py-0 pb-1">Aspect Ratio</TableCell>
        <TableCell className="py-0 pb-1">
          {data.MediaStreams
            ? data.MediaStreams.find((stream) => stream.Type === "Video")
                ?.AspectRatio
            : "-"}
        </TableCell>
        <TableCell className="py-0 pb-1">
          {data.MediaStreams
            ? data.MediaStreams.find((stream) => stream.Type === "Video")
                ?.AspectRatio
            : "-"}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell>
          <strong>Audio</strong>
        </TableCell>
        <TableCell colSpan="2">
          <strong>
            {data.TranscodingInfo
              ? data.TranscodingInfo?.IsAudioDirect
                ? "DIRECT"
                : "TRANSCODE"
              : "DIRECT"}
          </strong>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell className="py-0 pb-1">Codec</TableCell>
        <TableCell className="py-0 pb-1">
          {data.TranscodingInfo?.IsAudioDirect
            ? data.MediaStreams?.find(
                (stream) =>
                  stream.Type === "Audio" &&
                  stream.Index === data.PlayState?.AudioStreamIndex,
              )?.Codec?.toUpperCase()
            : data.TranscodingInfo?.AudioCodec.toUpperCase() ||
              data.MediaStreams?.find(
                (stream) =>
                  stream.Type === "Audio" &&
                  stream.Index === data.PlayState?.AudioStreamIndex,
              )?.Codec?.toUpperCase()}
        </TableCell>
        <TableCell className="py-0 pb-1">
          {data.MediaStreams
            ? data.MediaStreams.find(
                (stream) =>
                  stream.Type === "Audio" &&
                  stream.Index === data.PlayState?.AudioStreamIndex,
              )?.Codec?.toUpperCase()
            : "-"}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell className="py-0 pb-1">Bitrate</TableCell>
        <TableCell className="py-0 pb-1">
          {convertBitrate(
            data.MediaStreams
              ? data.MediaStreams.find(
                  (stream) =>
                    stream.Type === "Audio" &&
                    stream.Index === data.PlayState?.AudioStreamIndex,
                )?.BitRate
              : null,
          )}
        </TableCell>
        <TableCell className="py-0 pb-1">
          {convertBitrate(
            data.MediaStreams
              ? data.MediaStreams.find(
                  (stream) =>
                    stream.Type === "Audio" &&
                    stream.Index === data.PlayState?.AudioStreamIndex,
                )?.BitRate
              : null,
          )}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell className="py-0 pb-1">Channels</TableCell>
        <TableCell className="py-0 pb-1">
          {data.TranscodingInfo?.IsAudioDirect
            ? data.TranscodingInfo?.AudioChannels
            : data.MediaStreams?.find(
                (stream) =>
                  stream.Type === "Audio" &&
                  stream.Index === data.PlayState?.AudioStreamIndex,
              )?.Channels}
        </TableCell>
        <TableCell className="py-0 pb-1">
          {data.MediaStreams
            ? data.MediaStreams.find(
                (stream) =>
                  stream.Type === "Audio" &&
                  stream.Index === data.PlayState?.AudioStreamIndex,
              )?.Channels
            : null}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell className="py-0 pb-3">Language</TableCell>
        <TableCell className="py-0 pb-3">
          {data.MediaStreams
            ? data.MediaStreams.find(
                (stream) =>
                  stream.Type === "Audio" &&
                  stream.Index === data.PlayState?.AudioStreamIndex,
              )?.Language?.toUpperCase()
            : "-"}
        </TableCell>
        <TableCell className="py-0 pb-3">
          {data.MediaStreams
            ? data.MediaStreams.find(
                (stream) =>
                  stream.Type === "Audio" &&
                  stream.Index === data.PlayState?.AudioStreamIndex,
              )?.Language?.toUpperCase()
            : "-"}
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

function StreamInfo(props) {
  if (!props && !props.data) {
    return <Loading />;
  }

  return (
    <div className="StreamInfo">
      <TableContainer className="overflow-hidden">
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Stream Details</TableCell>
              <TableCell>Source Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <Row data={props.data} />
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default StreamInfo;
