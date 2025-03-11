import Button from "react-bootstrap/Button";

import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Dropdown from "react-bootstrap/Dropdown";

import i18next from "i18next";
import { Trans } from "react-i18next";
import "../../css/settings/settings.css";

function Task({ task, taskState, processing, taskIntervals, updateTask, onClick, stopTask }) {
  const intervals = [
    { value: 15, display: i18next.t("SETTINGS_PAGE.INTERVALS.15_MIN") },
    { value: 30, display: i18next.t("SETTINGS_PAGE.INTERVALS.30_MIN") },
    { value: 60, display: i18next.t("SETTINGS_PAGE.INTERVALS.1_HOUR") },
    { value: 720, display: i18next.t("SETTINGS_PAGE.INTERVALS.12_HOURS") },
    { value: 1440, display: i18next.t("SETTINGS_PAGE.INTERVALS.1_DAY") },
    { value: 10080, display: i18next.t("SETTINGS_PAGE.INTERVALS.1_WEEK") },
  ];
  const state = taskState ? taskState.filter((state) => state.task === task.name)[0] : null;

  return (
    <TableRow key={task.id}>
      <TableCell>{task.description}</TableCell>
      <TableCell>
        <Trans i18nKey={`TASK_TYPE.${task.type}`} />
      </TableCell>

      <TableCell>
        {task.type === "JOB" ? (
          <Dropdown className="w-100" key={task.id}>
            <Dropdown.Toggle variant="outline-primary" className="w-100 dropdown-basic">
              {taskIntervals &&
                intervals.find((interval) => interval.value === (taskIntervals[task.name]?.Interval || 15))?.display}
            </Dropdown.Toggle>
            <Dropdown.Menu className="w-100">
              {taskIntervals &&
                intervals.map((interval) => (
                  <Dropdown.Item
                    onClick={() => updateTask(task.name, interval.value)}
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
        {state ? (
          state.running == true ? (
            <Button variant={"danger"} onClick={() => stopTask(task.name)}>
              <Trans i18nKey={"STOP"} />
            </Button>
          ) : (
            <Button variant={"outline-primary"} onClick={() => onClick(task.link)}>
              <Trans i18nKey={"START"} />
            </Button>
          )
        ) : (
          <></>
        )}
      </TableCell>
    </TableRow>
  );
}

export default Task;
