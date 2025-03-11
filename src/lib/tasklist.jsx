import { Trans } from "react-i18next";

export const taskList = [
  {
    id: 0,
    name: "PartialJellyfinSync",
    description: <Trans i18nKey={"TASK_DESCRIPTION.PartialJellyfinSync"} />,
    type: "JOB",
    link: "/sync/beginPartialSync",
  },
  {
    id: 1,
    name: "JellyfinSync",
    description: <Trans i18nKey={"TASK_DESCRIPTION.JellyfinSync"} />,
    type: "JOB",
    link: "/sync/beginSync",
  },
  {
    id: 2,
    name: "JellyfinPlaybackReportingPluginSync",
    description: <Trans i18nKey={"TASK_DESCRIPTION.Jellyfin_Playback_Reporting_Plugin_Sync"} />,
    type: "IMPORT",
    link: "/sync/syncPlaybackPluginData",
  },
  {
    id: 3,
    name: "Backup",
    description: <Trans i18nKey={"TASK_DESCRIPTION.Backup"} />,
    type: "JOB",
    link: "/backup/beginBackup",
  },
];
