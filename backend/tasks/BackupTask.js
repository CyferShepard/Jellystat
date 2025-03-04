const { parentPort } = require("worker_threads");
const Logging = require("../classes/logging");
const backup = require("../classes/backup");
const { randomUUID } = require("crypto");
const taskstate = require("../logging/taskstate");
const taskName = require("../logging/taskName");
const triggertype = require("../logging/triggertype");
const { sendUpdate } = require("../ws");

async function runBackupTask(triggerType = triggertype.Automatic) {
  try {
    const uuid = randomUUID();
    const refLog = { logData: [], uuid: uuid };

    console.log("Running Scheduled Backup");

    Logging.insertLog(uuid, triggerType, taskName.backup);

    await backup(refLog);
    Logging.updateLog(uuid, refLog.logData, taskstate.SUCCESS);
    sendUpdate("BackupTask", { type: "Success", message: `${triggerType} Backup Completed` });
    console.log("Scheduled Backup Complete");
    parentPort.postMessage({ status: "complete" });
  } catch (error) {
    parentPort.postMessage({ status: "error", message: error.message });

    console.log(error);
    return [];
  }
}

parentPort.on("message", (message) => {
  if (message.command === "start") {
    runBackupTask(message.triggertype);
  }
});
