const { parentPort } = require("worker_threads");
const triggertype = require("../logging/triggertype");
const sync = require("../routes/sync");

async function runFullSyncTask(triggerType = triggertype.Automatic) {
  try {
    await sync.fullSync(triggerType);

    parentPort.postMessage({ status: "complete" });
  } catch (error) {
    parentPort.postMessage({ status: "error", message: error.message });

    console.log(error);
    return [];
  }
}

parentPort.on("message", (message) => {
  if (message.command === "start") {
    runFullSyncTask(message.triggertype);
  }
});
