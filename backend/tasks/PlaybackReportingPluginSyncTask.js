const { parentPort } = require("worker_threads");
const sync = require("../routes/sync");

async function runPlaybackReportingPluginSyncTask() {
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
    await sync.syncPlaybackPluginData();

    parentPort.postMessage({ status: "complete" });
  } catch (error) {
    parentPort.postMessage({ status: "error", message: error.message });

    console.log(error);
    return [];
  }
}

parentPort.on("message", async (message) => {
  if (message.command === "start") {
    await runPlaybackReportingPluginSyncTask();
    process.exit(0); // Exit the worker after the task is done
  }
});
