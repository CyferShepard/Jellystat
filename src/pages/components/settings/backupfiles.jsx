import React, { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import { Form, DropdownButton, Dropdown, ButtonGroup, Button } from "react-bootstrap";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import Alert from "react-bootstrap/Alert";

import "../../css/settings/backups.css";
import { Trans } from "react-i18next";
import i18next from "i18next";

const token = localStorage.getItem("token");

function Row(file) {
  const { data } = file;
  const [disabled, setDisabled] = useState(false);

  async function downloadBackup(filename) {
    const url = `/backup/files/${filename}`;
    axios({
      url: url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "GET",
      responseType: "blob",
    }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    });
  }

  async function restoreBackup(filename) {
    const url = `/backup/restore/${filename}`;
    setDisabled(true);
    axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        const alert = { visible: true, title: "Success", type: "success", message: response.data };
        setDisabled(false);
        file.handleRowActionMessage(alert);
      })
      .catch((error) => {
        const alert = { visible: true, title: "Error", type: "danger", message: error.response.data };
        setDisabled(false);
        file.handleRowActionMessage(alert);
      });
  }

  async function deleteBackup(filename) {
    const url = `/backup/files/${filename}`;
    setDisabled(true);
    axios
      .delete(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        const alert = { visible: true, title: "Success", type: "success", message: response.data };
        setDisabled(false);
        file.handleRowActionMessage(alert);
      })
      .catch((error) => {
        const alert = { visible: true, title: "Error", type: "danger", message: error.response.data };
        setDisabled(false);
        file.handleRowActionMessage(alert);
      });
  }

  function formatFileSize(sizeInBytes) {
    const sizeInKB = sizeInBytes / 1024; // 1 KB = 1024 bytes
    if (sizeInKB < 1024) {
      return `${sizeInKB.toFixed(2)} KB`;
    } else {
      const sizeInMB = sizeInKB / 1024; // 1 MB = 1024 KB
      if (sizeInMB < 1024) {
        return `${sizeInMB.toFixed(2)} MB`;
      } else {
        const sizeInGB = sizeInMB / 1024; // 1 GB = 1024 MB
        if (sizeInGB < 1024) {
          return `${sizeInGB.toFixed(2)} GB`;
        } else {
          const sizeInTB = sizeInGB / 1024; // 1 TB = 1024 GB
          if (sizeInTB < 1024) {
            return `${sizeInTB.toFixed(2)} TB`;
          } else {
            const sizeInPB = sizeInTB / 1024; // 1 PB = 1024 TB
            return `${sizeInPB.toFixed(2)} PB`;
          }
        }
      }
    }
  }

  const twelve_hr = JSON.parse(localStorage.getItem("12hr"));

  const options = {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: twelve_hr,
  };

  return (
    <React.Fragment>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>{data.name}</TableCell>
        <TableCell>{Intl.DateTimeFormat("en-UK", options).format(new Date(data.datecreated))}</TableCell>
        <TableCell>{formatFileSize(data.size)}</TableCell>
        <TableCell className="">
          <div className="d-flex justify-content-center">
            <DropdownButton title={i18next.t("ACTIONS")} variant="outline-primary" disabled={disabled}>
              <Dropdown.Item as="button" variant="primary" onClick={() => downloadBackup(data.name)}>
                <Trans i18nKey={"DOWNLOAD"} />
              </Dropdown.Item>
              <Dropdown.Item as="button" variant="warning" onClick={() => restoreBackup(data.name)}>
                <Trans i18nKey={"RESTORE"} />
              </Dropdown.Item>
              <Dropdown.Divider></Dropdown.Divider>
              <Dropdown.Item as="button" variant="danger" onClick={() => deleteBackup(data.name)}>
                <Trans i18nKey={"DELETE"} />
              </Dropdown.Item>
            </DropdownButton>
          </div>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default function BackupFiles() {
  const [files, setFiles] = useState([]);
  const [showAlert, setshowAlert] = useState({ visible: false, type: "danger", title: "Error", message: "" });
  const [rowsPerPage] = React.useState(10);
  const [page, setPage] = React.useState(0);
  const [progress, setProgress] = useState(0);

  function handleCloseAlert() {
    setshowAlert({ visible: false });
  }

  const uploadFile = (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    return axios.post("/backup/upload", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
  };

  const handleFileSelect = (event) => {
    setProgress(0);
    if (event.target.files[0]) {
      uploadFile(event.target.files[0], (progressEvent) => {
        setProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
      })
        .then(() => {
          setshowAlert({ visible: true, title: "Success", type: "success", message: "Upload complete!" });
          fetchData(); // Refresh the file list after upload
          setProgress(0);
        })
        .catch((error) => {
          setshowAlert({ visible: true, title: "Error", type: "danger", message: error.response.data });
        });
    }
  };

  const fetchData = async () => {
    try {
      const backupFiles = await axios.get(`/backup/files`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setFiles(backupFiles.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, []);

  const handleNextPageClick = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handlePreviousPageClick = () => {
    setPage((prevPage) => prevPage - 1);
  };

  const handleRowActionMessage = (alertState) => {
    fetchData().then(() => {
      setshowAlert({ visible: alertState.visible, title: alertState.title, type: alertState.type, message: alertState.message });
    });
  };

  return (
    <div>
      <h1 className="my-2">
        <Trans i18nKey={"SETTINGS_PAGE.BACKUPS"} />
      </h1>
      {showAlert && showAlert.visible && (
        <Alert variant={showAlert.type} bg="dark" data-bs-theme="dark" onClose={handleCloseAlert} dismissible>
          <Alert.Heading>{showAlert.title}</Alert.Heading>
          <p>{showAlert.message}</p>
        </Alert>
      )}

      <TableContainer className="rounded-2 h-100">
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell>
                <Trans i18nKey={"FILE_NAME"} />
              </TableCell>
              <TableCell>
                <Trans i18nKey={"DATE"} />
              </TableCell>
              <TableCell>
                <Trans i18nKey={"SETTINGS_PAGE.SIZE"} />
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files &&
              files
                .sort((a, b) => new Date(b.datecreated) - new Date(a.datecreated))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((file, index) => <Row key={index} data={file} handleRowActionMessage={handleRowActionMessage} />)}
            {files.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", fontStyle: "italic", color: "grey", height: "200px" }}
                  className="py-2"
                >
                  <Trans i18nKey={"ERROR_MESSAGES.NO_BACKUPS"} />
                </td>
              </tr>
            ) : (
              ""
            )}
            <TableRow>
              <TableCell colSpan="5">
                <Form.Group controlId="formFile" onChange={handleFileSelect} className="mx-2">
                  <Form.Control
                    type="file"
                    accept=".json"
                    className="upload-file"
                    style={{ backgroundColor: "rgb(90 45 165)", borderColor: "rgb(90 45 165)" }}
                  />
                  <progress className="w-100" value={progress} max="100" />
                </Form.Group>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <div className="d-flex justify-content-end my-2">
        <ButtonGroup className="pagination-buttons">
          <Button className="page-btn" onClick={() => setPage(0)} disabled={page === 0}>
            <Trans i18nKey={"TABLE_NAV_BUTTONS.FIRST"} />
          </Button>

          <Button className="page-btn" onClick={handlePreviousPageClick} disabled={page === 0}>
            <Trans i18nKey={"TABLE_NAV_BUTTONS.PREVIOUS"} />
          </Button>

          <div className="page-number d-flex align-items-center justify-content-center">{`${page * rowsPerPage + 1}-${Math.min(
            page * rowsPerPage + 1 + (rowsPerPage - 1),
            files.length
          )} of ${files.length}`}</div>

          <Button className="page-btn" onClick={handleNextPageClick} disabled={page >= Math.ceil(files.length / rowsPerPage) - 1}>
            <Trans i18nKey={"TABLE_NAV_BUTTONS.NEXT"} />
          </Button>

          <Button
            className="page-btn"
            onClick={() => setPage(Math.ceil(files.length / rowsPerPage) - 1)}
            disabled={page >= Math.ceil(files.length / rowsPerPage) - 1}
          >
            <Trans i18nKey={"TABLE_NAV_BUTTONS.LAST"} />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
