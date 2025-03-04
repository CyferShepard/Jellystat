const TaskName = require("../logging/taskName");

const Tasks = {
  Backup: { path: "./tasks/BackupTask.js", name: TaskName.backup },
  Restore: { path: "./tasks/BackupTask.js", name: TaskName.restore },
  JellyfinSync: { path: "./tasks/FullSyncTask.js", name: TaskName.fullsync },
  PartialJellyfinSync: { path: "./tasks/RecentlyAddedItemsSyncTask.js", name: TaskName.partialsync },
  JellyfinPlaybackReportingPluginSync: { path: "./tasks/PlaybackReportingPluginSyncTask.js", name: TaskName.import },
  // Add more tasks as needed
};

module.exports = Tasks;
