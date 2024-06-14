import { useState } from "react";
import axios from "axios";
import Button from "react-bootstrap/Button";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Dropdown from "react-bootstrap/Dropdown";

import { taskList } from "../../../lib/tasklist";

import "../../css/settings/settings.css";
import { Trans } from "react-i18next";
import i18next from "i18next";

export default function Tasks() {
  const [processing, setProcessing] = useState(false);
  const [taskIntervals, setTaskIntervals] = useState([]);
  const token = localStorage.getItem("token");

  async function executeTask(url) {
    setProcessing(true);

    await axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      .catch((error) => {
        console.log(error);
      });
    setProcessing(false);
  }

  async function updateTaskSettings(taskName, Interval) {
    taskName = taskName.replace(/ /g, "");

    await axios
      .post(
        "/api/setTaskSettings",
        {
          taskname: taskName,
          Interval: Interval,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        setTaskIntervals(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  async function getTaskSettings() {
    await axios
      .get("/api/getTaskSettings", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        setTaskIntervals(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }
  if (taskIntervals && taskIntervals.length === 0) {
    getTaskSettings();
  }

  const intervals = [
    { value: 15, display: i18next.t("SETTINGS_PAGE.INTERVALS.15_MIN") },
    { value: 30, display: i18next.t("SETTINGS_PAGE.INTERVALS.30_MIN") },
    { value: 60, display: i18next.t("SETTINGS_PAGE.INTERVALS.1_HOUR") },
    { value: 720, display: i18next.t("SETTINGS_PAGE.INTERVALS.12_HOURS") },
    { value: 1440, display: i18next.t("SETTINGS_PAGE.INTERVALS.1_DAY") },
    { value: 10080, display: i18next.t("SETTINGS_PAGE.INTERVALS.1_WEEK") },
  ];

  return (
    <div className="tasks">
      <h1 className="py-3">
        <Trans i18nKey={"SETTINGS_PAGE.TASKS"} />
      </h1>

      <TableContainer className="rounded-2">
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell>
                <Trans i18nKey={"SETTINGS_PAGE.TASK"} />
              </TableCell>
              <TableCell>
                <Trans i18nKey={"TYPE"} />
              </TableCell>
              <TableCell>
                <Trans i18nKey={"SETTINGS_PAGE.INTERVAL"} />
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {taskList &&
              taskList.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.description}</TableCell>
                  <TableCell>
                    <Trans i18nKey={task.type} />
                  </TableCell>

                  <TableCell>
                    {task.type.props.i18nKey === "TASK_TYPE.JOB" ? (
                      <Dropdown className="w-100" key={task.id}>
                        <Dropdown.Toggle variant="outline-primary" id="dropdown-basic" className="w-100">
                          {taskIntervals &&
                            intervals.find((interval) => interval.value === (taskIntervals[task.name]?.Interval || 15)).display}
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-100">
                          {taskIntervals &&
                            intervals.map((interval) => (
                              <Dropdown.Item
                                onClick={() => updateTaskSettings(task.name, interval.value)}
                                value={interval.value}
                                key={interval.value}
                              >
                                {interval.display}
                              </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    ) : (
                      <></>
                    )}
                  </TableCell>
                  <TableCell className="d-flex justify-content-center">
                    {" "}
                    <Button
                      variant={!processing ? "outline-primary" : "outline-light"}
                      disabled={processing}
                      onClick={() => executeTask(task.link)}
                    >
                      <Trans i18nKey={"START"} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
