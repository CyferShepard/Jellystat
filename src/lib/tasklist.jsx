import { Trans } from "react-i18next";

export const taskList = [
  {
    id: 0,
    name: "PartialJellyfinSync",
    description: <Trans i18nKey={"TASK_DESCRIPTION.PartialJellyfinSync"} />,
    type: <Trans i18nKey={"TASK_TYPE.JOB"} />,
    link: "/sync/beginPartialSync",
  },
  {
    id: 1,
    name: "JellyfinSync",
    description: <Trans i18nKey={"TASK_DESCRIPTION.JellyfinSync"} />,
    type: <Trans i18nKey={"TASK_TYPE.JOB"} />,
    link: "/sync/beginSync",
  },
  {
    id: 2,
    name: "Jellyfin Playback Reporting Plugin Sync",
    description: <Trans i18nKey={"TASK_DESCRIPTION.Jellyfin_Playback_Reporting_Plugin_Sync"} />,
    type: <Trans i18nKey={"TASK_TYPE.IMPORT"} />,
    link: "/sync/syncPlaybackPluginData",
  },
  {
    id: 3,
    name: "Backup",
    description: <Trans i18nKey={"TASK_DESCRIPTION.Backup"} />,
    type: <Trans i18nKey={"TASK_TYPE.JOB"} />,
    link: "/backup/beginBackup",
  },
];
