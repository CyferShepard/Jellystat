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
    console.log = (...args) => {
      const formattedArgs = args.map((arg) => {
        if (typeof arg === "object" && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return "[Circular]";
          }
        }
        return arg;
      });
      parentPort.postMessage({ type: "log", message: formattedArgs.join(" ") });
    };
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

parentPort.on("message", async (message) => {
  if (message.command === "start") {
    await runBackupTask(message.triggertype);
    process.exit(0); // Exit the worker after the task is done
  }
});
