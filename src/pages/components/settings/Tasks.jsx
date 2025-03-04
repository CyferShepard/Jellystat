import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { taskList } from "../../../lib/tasklist.jsx";
import Task from "./Task";
import socket from "../../../socket";

import "../../css/settings/settings.css";
import { Trans } from "react-i18next";

export default function Tasks() {
  const [processing, setProcessing] = useState(false);
  const [taskIntervals, setTaskIntervals] = useState([]);
  const token = localStorage.getItem("token");
  const [taskStateList, setTaskStateList] = useState();

  useEffect(() => {
    socket.on("task-list", (data) => {
      if (typeof data === "object" && Array.isArray(data)) {
        setTaskStateList(data);
      }
    });
    return () => {
      socket.off("task-list");
    };
  }, [taskStateList]);

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

  async function stopTask(task) {
    await axios
      .get(`/api/stopTask?task=${task}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      .catch((error) => {
        console.log(error);
      });
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
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {taskList.map((task) => (
              <Task
                key={task.id}
                task={task}
                taskState={taskStateList}
                processing={processing}
                taskIntervals={taskIntervals}
                updateTask={updateTaskSettings}
                onClick={executeTask}
                stopTask={stopTask}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
