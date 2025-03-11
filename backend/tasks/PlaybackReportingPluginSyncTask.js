const { parentPort } = require("worker_threads");
const sync = require("../routes/sync");

async function runPlaybackReportingPluginSyncTask() {
  try {
    await sync.syncPlaybackPluginData();

    parentPort.postMessage({ status: "complete" });
  } catch (error) {
    parentPort.postMessage({ status: "error", message: error.message });

    console.log(error);
    return [];
  }
}

parentPort.on("message", (message) => {
  if (message.command === "start") {
    runPlaybackReportingPluginSyncTask();
  }
});
