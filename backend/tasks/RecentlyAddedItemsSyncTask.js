const { parentPort } = require("worker_threads");
const triggertype = require("../logging/triggertype");
const sync = require("../routes/sync");
const WebhookManager = require("../classes/webhook-manager");

async function runPartialSyncTask(triggerType = triggertype.Automatic) {
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
    
    const syncResults = await sync.partialSync(triggerType);
    
    const webhookManager = new WebhookManager();
    
    const newMediaCount = syncResults?.newItems?.length || 0;
    
    if (newMediaCount > 0) {
      await webhookManager.triggerEventWebhooks('media_recently_added', {
        count: newMediaCount,
        items: syncResults.newItems,
        syncDate: new Date().toISOString(),
        triggerType: triggerType
      });
    }

    parentPort.postMessage({ status: "complete" });
  } catch (error) {
    parentPort.postMessage({ status: "error", message: error.message });
    console.log(error);
    return [];
  }
}

parentPort.on("message", async (message) => {
  if (message.command === "start") {
    await runPartialSyncTask(message.triggertype);
    process.exit(0); // Exit the worker after the task is done
  }
});
