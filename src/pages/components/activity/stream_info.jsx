import React from "react";
import "../../css/activity/stream-info.css";
// import { Button } from "react-bootstrap";
import Loading from "../general/loading";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Trans } from "react-i18next";
import i18next from "i18next";



function Row(logs) {
    const { data } = logs;

  function convertBitrate(bitrate) {
    if(!bitrate)
    {
      return '-';
    }
    const kbps = (bitrate / 1000).toFixed(1);
    const mbps = (bitrate / 1000000).toFixed(1);
  
    if (kbps >= 1000) {
      return  mbps+' Mbps';
    } else {
      return  kbps+' Kbps';
    }
  }

  if(!data || !data.MediaStreams)
  {
    return null;
  }

  const UNKNOWN_VALUE = '-';
  const videoStream = data?.MediaStreams.find(stream => stream.Type === 'Video');
  const audioStream = data?.MediaStreams.find(stream => stream.Type === 'Audio');

  let overallOriginalBitrateRaw = 0;
  if (videoStream && videoStream.BitRate) {
    overallOriginalBitrateRaw = videoStream.BitRate;
  }
  if (audioStream && audioStream.BitRate) {
    overallOriginalBitrateRaw += audioStream.BitRate;
  }
  const overallOriginalBitrate = convertBitrate(overallOriginalBitrateRaw);

  let overallTranscodeBitrateRaw = 0;
  if (data.TranscodingInfo) {
    if ((data.TranscodingInfo.IsVideoDirect === false && data.TranscodingInfo.VideoBitrate) || (data.TranscodingInfo.IsAudioDirect === false && data.TranscodingInfo.AudioBitrate)) {
      overallTranscodeBitrateRaw += data.TranscodingInfo.IsVideoDirect === false ? data.TranscodingInfo.VideoBitrate : videoStream ? videoStream?.BitRate : 0;
      overallTranscodeBitrateRaw += data.TranscodingInfo.IsAudioDirect === false ? data.TranscodingInfo.AudioBitrate : audioStream ? audioStream?.BitRate : 0;
    } else {
      overallTranscodeBitrateRaw = data.TranscodingInfo?.Bitrate;
    }
  } else {
    overallTranscodeBitrateRaw = overallOriginalBitrateRaw;
  }
  const overallTranscodeBitrate = convertBitrate(overallTranscodeBitrateRaw);

  let videoTranscodeBitrate = UNKNOWN_VALUE;
  if (data.TranscodingInfo && data.TranscodingInfo?.IsVideoDirect === false) {
    videoTranscodeBitrate = convertBitrate(data.TranscodingInfo.VideoBitrate ? data.TranscodingInfo.VideoBitrate : data.TranscodingInfo.Bitrate);
  } else if (videoStream) {
    videoTranscodeBitrate = convertBitrate(videoStream?.BitRate);
  }

    return (
      <React.Fragment>

        <TableRow>
          <TableCell colSpan="3"><strong><Trans i18nKey={"MEDIA"}/></strong></TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-1" ><Trans i18nKey={"BITRATE"}/></TableCell>
          <TableCell className="py-0 pb-1" >{overallTranscodeBitrate}</TableCell>
          <TableCell className="py-0 pb-1" >{overallOriginalBitrate}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-1" ><Trans i18nKey={"CONTAINER"}/></TableCell>
          <TableCell className="py-0 pb-1" >{data.TranscodingInfo ? data.TranscodingInfo.Container.toUpperCase() : data.OriginalContainer.toUpperCase()}</TableCell>
          <TableCell className="py-0 pb-1" >{data.OriginalContainer.toUpperCase()}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell ><strong><Trans i18nKey={"VIDEO"}/></strong></TableCell>
          <TableCell colSpan="2" style={{textTransform:"uppercase"}}><strong>
            {data.PlayMethod === "DirectStream" ? 
              i18next.t("DIRECT_STREAM") : 
              (data.TranscodingInfo ? 
                (data.TranscodingInfo?.IsVideoDirect ? i18next.t("DIRECT") : i18next.t("TRANSCODE")) : 
                i18next.t("DIRECT"))}
          </strong></TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-1" ><Trans i18nKey={"CODEC"}/></TableCell>
          <TableCell className="py-0 pb-1" >{data.TranscodingInfo ? data.TranscodingInfo.VideoCodec?.toUpperCase() : videoStream ? videoStream.Codec?.toUpperCase() : UNKNOWN_VALUE}</TableCell>
          <TableCell className="py-0 pb-1" >{videoStream ? videoStream?.Codec?.toUpperCase() : UNKNOWN_VALUE}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-3" ><Trans i18nKey={"BITRATE"}/></TableCell>
          <TableCell className="py-0 pb-3" >{videoTranscodeBitrate}</TableCell>
          <TableCell className="py-0 pb-3" >{convertBitrate(videoStream ? videoStream?.BitRate : null)}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-1" ><Trans i18nKey={"WIDTH"}/></TableCell>
          <TableCell className="py-0 pb-1" >{data.TranscodingInfo ? data.TranscodingInfo.Width : videoStream ? videoStream?.Width : UNKNOWN_VALUE}</TableCell>
          <TableCell className="py-0 pb-1" >{videoStream ? videoStream?.Width : UNKNOWN_VALUE}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-3" ><Trans i18nKey={"HEIGHT"}/></TableCell>
          <TableCell className="py-0 pb-3" >{data.TranscodingInfo ? data.TranscodingInfo?.Height : videoStream ? videoStream?.Height : UNKNOWN_VALUE}</TableCell>
          <TableCell className="py-0 pb-3" >{videoStream ? videoStream?.Height : UNKNOWN_VALUE}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-1" ><Trans i18nKey={"FRAMERATE"}/></TableCell>
          <TableCell className="py-0 pb-1" >{videoStream ? parseFloat(videoStream.RealFrameRate.toFixed(2)) : UNKNOWN_VALUE}</TableCell>
          <TableCell className="py-0 pb-1" >{videoStream ? parseFloat(videoStream.RealFrameRate.toFixed(2)) : UNKNOWN_VALUE}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-1" ><Trans i18nKey={"DYNAMIC_RANGE"}/></TableCell>
          <TableCell className="py-0 pb-1" >{videoStream ? videoStream?.VideoRange : UNKNOWN_VALUE}</TableCell>
          <TableCell className="py-0 pb-1" >{videoStream ? videoStream?.VideoRange : UNKNOWN_VALUE}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-1" ><Trans i18nKey={"ASPECT_RATIO"}/></TableCell>
          <TableCell className="py-0 pb-1" >{videoStream ? videoStream?.AspectRatio : UNKNOWN_VALUE}</TableCell>
          <TableCell className="py-0 pb-1" >{videoStream ? videoStream?.AspectRatio : UNKNOWN_VALUE}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell ><strong><Trans i18nKey={"AUDIO"}/></strong></TableCell>
          <TableCell colSpan="2" style={{textTransform:"uppercase"}}><strong>
            {data.PlayMethod === "DirectStream" ? 
              i18next.t("DIRECT_STREAM") : 
              (data.TranscodingInfo ? 
                (data.TranscodingInfo?.IsAudioDirect ? i18next.t("DIRECT") : i18next.t("TRANSCODE")) : 
                i18next.t("DIRECT"))}
          </strong></TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-1" ><Trans i18nKey={"CODEC"}/></TableCell>
          <TableCell className="py-0 pb-1" >{data.TranscodingInfo ? data.TranscodingInfo.AudioCodec?.toUpperCase() : audioStream ? audioStream?.Codec?.toUpperCase() : UNKNOWN_VALUE}</TableCell>
          <TableCell className="py-0 pb-1" >{audioStream ? audioStream?.Codec?.toUpperCase() : UNKNOWN_VALUE}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-1" ><Trans i18nKey={"BITRATE"}/></TableCell>
          <TableCell className="py-0 pb-1" >{convertBitrate(data.TranscodingInfo ? data.TranscodingInfo.AudioBitrate ? data.TranscodingInfo.AudioBitrate : UNKNOWN_VALUE : audioStream ? audioStream?.BitRate : null)}</TableCell>
          <TableCell className="py-0 pb-1" >{convertBitrate(audioStream ? audioStream?.BitRate : null)}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell  className="py-0 pb-1"><Trans i18nKey={"CHANNELS"}/></TableCell>
          <TableCell  className="py-0 pb-1">{data.TranscodingInfo && data.TranscodingInfo?.IsAudioDirect === false ? data.TranscodingInfo?.AudioChannels : audioStream ? audioStream?.Channels : UNKNOWN_VALUE}</TableCell>
          <TableCell  className="py-0 pb-1">{audioStream ? audioStream?.Channels : null}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-3" ><Trans i18nKey={"LANGUAGE"}/></TableCell>
          <TableCell className="py-0 pb-3" >{audioStream ? audioStream?.Language?.toUpperCase() : UNKNOWN_VALUE}</TableCell>
          <TableCell className="py-0 pb-3" >{audioStream ? audioStream?.Language?.toUpperCase() : UNKNOWN_VALUE}</TableCell>
        </TableRow>

        {data.TranscodingInfo && data.TranscodingInfo?.TranscodeReasons && data.TranscodingInfo.TranscodeReasons.length > 0 && (
          <>
            <TableRow>
              <TableCell colSpan="3"><strong><Trans i18nKey={"TRANSCODE_REASONS"}/></strong></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="py-0 pb-3" colSpan="3">{data.TranscodingInfo.TranscodeReasons.join(", ")}</TableCell>
            </TableRow>
          </>
        )}

      </React.Fragment>
    );
  }
  

function StreamInfo(props) {


  if(!props && !props.data)
  {
    return <Loading/>;
  }

  

  return (
    <div className="StreamInfo">
 
      <TableContainer className="overflow-hidden">
                    <Table aria-label="collapsible table" >
                      <TableHead>
                        <TableRow>
                          <TableCell/>
                          <TableCell><Trans i18nKey={"STREAM_DETAILS"}/></TableCell>
                          <TableCell><Trans i18nKey={"SOURCE_DETAILS"}/></TableCell>
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