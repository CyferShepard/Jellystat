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

  
  
  
  
    return (
      <React.Fragment>

        <TableRow>
          <TableCell colSpan="3"><strong><Trans i18nKey={"MEDIA"}/></strong></TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-1" ><Trans i18nKey={"BITRATE"}/></TableCell>
          <TableCell className="py-0 pb-1" >{convertBitrate(data.TranscodingInfo ? data.TranscodingInfo.Bitrate : (data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Video')?.BitRate : null))}</TableCell>
          <TableCell className="py-0 pb-1" >{convertBitrate(data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Video')?.BitRate : null)}</TableCell>
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
          <TableCell className="py-0 pb-1" >{data.TranscodingInfo ? data.TranscodingInfo.VideoCodec?.toUpperCase() : data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Video')?.Codec?.toUpperCase() : '-'}</TableCell>
          <TableCell className="py-0 pb-1" >{data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Video')?.Codec?.toUpperCase() : '-'}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-3" ><Trans i18nKey={"BITRATE"}/></TableCell>
          <TableCell className="py-0 pb-3" >{convertBitrate(data.TranscodingInfo ? data.TranscodingInfo.Bitrate : data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Video')?.BitRate : null)}</TableCell>
          <TableCell className="py-0 pb-3" >{convertBitrate(data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Video')?.BitRate : null)}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-1" ><Trans i18nKey={"WIDTH"}/></TableCell>
          <TableCell className="py-0 pb-1" >{data.TranscodingInfo ? data.TranscodingInfo.Width : data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Video')?.Width : '-'}</TableCell>
          <TableCell className="py-0 pb-1" >{data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Video')?.Width : '-'}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-3" ><Trans i18nKey={"HEIGHT"}/></TableCell>
          <TableCell className="py-0 pb-3" >{data.TranscodingInfo? data.TranscodingInfo?.Height :data.MediaStreams?.find(stream => stream.Type === 'Video')?.Height }</TableCell>
          <TableCell className="py-0 pb-3" >{data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Video')?.Height : '-'}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-1" ><Trans i18nKey={"FRAMERATE"}/></TableCell>
          <TableCell className="py-0 pb-1" >{data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Video') ? parseFloat(data.MediaStreams.find(stream => stream.Type === 'Video').RealFrameRate.toFixed(2)) : '-' : '-'}</TableCell>
          <TableCell className="py-0 pb-1" >{data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Video') ? parseFloat(data.MediaStreams.find(stream => stream.Type === 'Video').RealFrameRate.toFixed(2)) : '-' : '-'}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-1" ><Trans i18nKey={"DYNAMIC_RANGE"}/></TableCell>
          <TableCell className="py-0 pb-1" >{data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Video')?.VideoRange : '-'}</TableCell>
          <TableCell className="py-0 pb-1" >{data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Video')?.VideoRange : '-'}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-1" ><Trans i18nKey={"ASPECT_RATIO"}/></TableCell>
          <TableCell className="py-0 pb-1" >{data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Video')?.AspectRatio : '-'}</TableCell>
          <TableCell className="py-0 pb-1" >{data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Video')?.AspectRatio : '-'}</TableCell>
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
          <TableCell className="py-0 pb-1" >{data.TranscodingInfo?.IsAudioDirect ? data.MediaStreams?.find(stream => stream.Type === 'Audio' &&  stream.Index===data.PlayState?.AudioStreamIndex)?.Codec?.toUpperCase() : data.TranscodingInfo?.AudioCodec.toUpperCase()|| data.MediaStreams?.find(stream => stream.Type === 'Audio' &&  stream.Index===data.PlayState?.AudioStreamIndex)?.Codec?.toUpperCase()}</TableCell>
          <TableCell className="py-0 pb-1" >{data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Audio' &&  stream.Index===data.PlayState?.AudioStreamIndex)?.Codec?.toUpperCase() : '-'}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-1" ><Trans i18nKey={"BITRATE"}/></TableCell>
          <TableCell className="py-0 pb-1" >{convertBitrate(data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Audio' &&  stream.Index===data.PlayState?.AudioStreamIndex)?.BitRate : null)}</TableCell>
          <TableCell className="py-0 pb-1" >{convertBitrate(data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Audio' &&  stream.Index===data.PlayState?.AudioStreamIndex)?.BitRate : null)}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell  className="py-0 pb-1"><Trans i18nKey={"CHANNELS"}/></TableCell>
          <TableCell  className="py-0 pb-1">{data.TranscodingInfo?.IsAudioDirect ? data.TranscodingInfo?.AudioChannels: data.MediaStreams?.find(stream => stream.Type === 'Audio' &&  stream.Index===data.PlayState?.AudioStreamIndex)?.Channels}</TableCell>
          <TableCell  className="py-0 pb-1">{data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Audio' &&  stream.Index===data.PlayState?.AudioStreamIndex)?.Channels : null}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell className="py-0 pb-3" ><Trans i18nKey={"LANGUAGE"}/></TableCell>
          <TableCell className="py-0 pb-3" >{data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Audio' &&  stream.Index===data.PlayState?.AudioStreamIndex)?.Language?.toUpperCase() : '-'}</TableCell>
          <TableCell className="py-0 pb-3" >{data.MediaStreams ? data.MediaStreams.find(stream => stream.Type === 'Audio' &&  stream.Index===data.PlayState?.AudioStreamIndex)?.Language?.toUpperCase() : '-'}</TableCell>
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