import React, { useState, useEffect } from "react";
import axios from "axios";

import { Button, ButtonGroup } from "react-bootstrap";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import { saveAs } from "file-saver";

import Loading from "./components/general/loading";

function Datadebugger() {
  const [data, setData] = useState();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const libraryData = await axios.get(`/api/dataValidator`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setData(libraryData.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [token]);

  const handleDownload = (jsonData, filename) => {
    // const jsonData = { /* Your JSON object */ };

    const jsonString = JSON.stringify(jsonData);
    const blob = new Blob([jsonString], { type: "application/json" });

    saveAs(blob, filename + ".json");
  };

  if (!data) {
    return <Loading />;
  }

  return (
    <div style={{ color: "white " }}>
      <h1>Data Debugger</h1>
      <br />
      {/* <p>{data? JSON.stringify(data):''}</p> */}

      <TableContainer className="rounded-2">
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell>Data Type</TableCell>
              <TableCell>Database Count</TableCell>
              <TableCell>API Count</TableCell>
              <TableCell>Difference</TableCell>
              <TableCell>Counts from Jellyfin*</TableCell>
              <TableCell>Difference</TableCell>
              <TableCell>Export Missing Data</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Libraries</TableCell>
              <TableCell>{data ? data.existing_library_count : ""}</TableCell>
              <TableCell>{data ? data.api_library_count : ""}</TableCell>
              <TableCell>
                {data
                  ? data.api_library_count - data.existing_library_count
                  : ""}
              </TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell>
                {data &&
                data.api_library_count > data.existing_library_count ? (
                  <Button
                    onClick={() =>
                      handleDownload(
                        data.missing_api_library_data,
                        "MissingLibraryData",
                      )
                    }
                  >
                    Download
                  </Button>
                ) : (
                  ""
                )}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Movies</TableCell>
              <TableCell>{data ? data.existing_movie_count : ""}</TableCell>
              <TableCell>{data ? data.api_movie_count : ""}</TableCell>
              <TableCell>
                {data ? data.api_movie_count - data.existing_movie_count : ""}
              </TableCell>
              <TableCell>
                {data ? data.count_from_api.MovieCount : ""}
              </TableCell>
              <TableCell>
                {data
                  ? data.count_from_api.MovieCount - data.existing_movie_count
                  : ""}
              </TableCell>
              <TableCell>
                {data && data.api_movie_count > data.existing_movie_count ? (
                  <Button
                    onClick={() =>
                      handleDownload(
                        data.missing_api_movies_data,
                        "MissingMovieData",
                      )
                    }
                  >
                    Download
                  </Button>
                ) : (
                  ""
                )}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Shows</TableCell>
              <TableCell>{data ? data.existing_show_count : ""}</TableCell>
              <TableCell>{data ? data.api_show_count : ""}</TableCell>
              <TableCell>
                {data ? data.api_show_count - data.existing_show_count : ""}
              </TableCell>
              <TableCell>
                {data ? data.count_from_api.SeriesCount : ""}
              </TableCell>
              <TableCell>
                {data
                  ? data.count_from_api.SeriesCount - data.existing_show_count
                  : ""}
              </TableCell>
              <TableCell>
                {data && data.api_show_count > data.existing_show_count ? (
                  <Button
                    onClick={() =>
                      handleDownload(
                        data.missing_api_shows_data,
                        "MissingShowData",
                      )
                    }
                  >
                    Download
                  </Button>
                ) : (
                  ""
                )}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Music</TableCell>
              <TableCell>{data ? data.existing_music_count : ""}</TableCell>
              <TableCell>{data ? data.api_music_count : ""}</TableCell>
              <TableCell>
                {data ? data.api_music_count - data.existing_music_count : ""}
              </TableCell>
              <TableCell>{data ? data.count_from_api.SongCount : ""}</TableCell>
              <TableCell>
                {data
                  ? data.count_from_api.SongCount - data.existing_music_count
                  : ""}
              </TableCell>
              <TableCell>
                {data && data.api_music_count > data.existing_music_count ? (
                  <Button
                    onClick={() =>
                      handleDownload(
                        data.missing_api_music_data,
                        "MissingMusicData",
                      )
                    }
                  >
                    Download
                  </Button>
                ) : (
                  ""
                )}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Seasons</TableCell>
              <TableCell>{data ? data.existing_season_count : ""}</TableCell>
              <TableCell>{data ? data.api_season_count : ""}</TableCell>
              <TableCell>
                {data ? data.api_season_count - data.existing_season_count : ""}
              </TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell>
                {data && data.api_season_count > data.existing_season_count ? (
                  <Button
                    onClick={() =>
                      handleDownload(
                        data.missing_api_season_data,
                        "MissingSeasonData",
                      )
                    }
                  >
                    Download
                  </Button>
                ) : (
                  ""
                )}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Episodes</TableCell>
              <TableCell>{data ? data.existing_episode_count : ""}</TableCell>
              <TableCell>{data ? data.api_episode_count : ""}</TableCell>
              <TableCell>
                {data
                  ? data.api_episode_count - data.existing_episode_count
                  : ""}
              </TableCell>
              <TableCell>
                {data ? data.count_from_api.EpisodeCount : ""}
              </TableCell>
              <TableCell>
                {data
                  ? data.count_from_api.EpisodeCount -
                    data.existing_episode_count
                  : ""}
              </TableCell>
              <TableCell>
                {data &&
                data.api_episode_count > data.existing_episode_count ? (
                  <Button
                    onClick={() =>
                      handleDownload(
                        data.missing_api_episode_data,
                        "MissingEpisodeData",
                      )
                    }
                  >
                    Download
                  </Button>
                ) : (
                  ""
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <ButtonGroup className="pt-3 w-100">
        <Button
          onClick={() => handleDownload(data.raw_library_data, "RawLibData")}
        >
          Download Raw Library Data
        </Button>

        <Button
          onClick={() => handleDownload(data.raw_item_data, "RawItemData")}
        >
          Download Raw Item Data
        </Button>

        <Button
          onClick={() => handleDownload(data.raw_season_data, "RawSeasonData")}
        >
          Download Raw Season Data
        </Button>

        <Button
          onClick={() =>
            handleDownload(data.raw_episode_data, "RawEpisodeData")
          }
        >
          Download Raw Episode Data
        </Button>
      </ButtonGroup>
    </div>
  );
}

export default Datadebugger;
