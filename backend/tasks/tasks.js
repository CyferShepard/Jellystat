const { BackupTask } = require("./BackupTask");
const { RecentlyAddedItemsSyncTask } = require("./RecentlyAddedItemsSyncTask");
const { FullSyncTask } = require("./FullSyncTask");

const tasks = {
    FullSyncTask:FullSyncTask,
    RecentlyAddedItemsSyncTask:RecentlyAddedItemsSyncTask,
    BackupTask:BackupTask,
  };
module.exports = tasks;