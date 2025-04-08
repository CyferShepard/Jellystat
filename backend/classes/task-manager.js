const { Worker } = require("worker_threads");
const TaskList = require("../global/task-list");
const { sendUpdate } = require("../ws");
const taskstate = require("../logging/taskstate");
const db = require("../db");

class TaskManager {
  constructor() {
    this.tasks = {};
    this.taskList = TaskList;
    this.emitTaskList();
  }

  addTask({ task, onComplete, onError, onExit }) {
    if (this.tasks[task.name]) {
      console.log(`Task ${task.name} already exists.`);
      return false;
    }

    const worker = new Worker(task.path);

    worker.on("message", (message) => {
      if (message.type === "log") {
        // Handle console.log messages
        console.log(`[Worker Log]: ${message.message}`);
      }
      if (message.status === "complete" && onComplete) {
        onComplete();
      }
      if (message.status === "error" && onError) {
        onError(new Error(message.message));
      }
      delete this.tasks[task.name];
    });

    worker.on("error", (error) => {
      if (onError) {
        onError(error);
      }
      console.error(`Error from ${task.name}:`, error);
      delete this.tasks[task.name];
    });

    worker.on("exit", async (code) => {
      if (code !== 0) {
        console.error(`Worker ${task.name} stopped with exit code ${code}`);
      }
      if (onExit) {
        onExit();
      }
      delete this.tasks[task.name];
      try {
        await db.query(
          `UPDATE jf_logging SET "Result"='${taskstate.FAILED}' WHERE "Result"='${taskstate.RUNNING}' AND "Name"='${task.name}'`
        );
      } catch (error) {
        console.log("Clear Running Tasks Error: " + error);
      }
    });

    this.tasks[task.name] = { worker };
    return true;
  }

  startTask(task, triggerType) {
    const taskExists = this.tasks[task.name];
    if (!taskExists) {
      console.log(`Task ${task.name} does not exist.`);
      return;
    }
    taskExists.worker.postMessage({ command: "start", triggertype: triggerType });
  }

  stopTask(task) {
    const taskExists = this.tasks[task.name];
    if (!taskExists) {
      console.log(`Task ${task.name} does not exist.`);
      return;
    }

    taskExists.worker.terminate();
    delete this.tasks[task.name];
  }

  isTaskRunning(taskName) {
    return !!this.tasks[taskName];
  }

  emitTaskList() {
    let emitTasks = setInterval(async () => {
      const taskList = Object.keys(this.taskList).map((key) => {
        return { task: key, name: this.taskList[key].name, running: this.isTaskRunning(this.taskList[key].name) };
      });
      sendUpdate("task-list", taskList);
    }, 1000);
  }
}

module.exports = TaskManager;
