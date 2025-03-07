const TaskManager = require("./task-manager-singleton");
const db = require("../db");
const TaskList = require("../global/task-list");
const { sendUpdate } = require("../ws");
const triggertype = require("../logging/triggertype");
const taskstate = require("../logging/taskstate");

class TaskScheduler {
  constructor() {
    this.taskManager = new TaskManager().getInstance();
    this.scheduledTasks = {};
    this.taskHistory = [];

    // Predefined tasks and default intervals (in minutes)
    this.defaultIntervals = {
      PartialJellyfinSync: {
        Interval: 60,
        ...TaskList.PartialJellyfinSync,
      },
      JellyfinSync: {
        Interval: 1440,
        ...TaskList.JellyfinSync,
      },
      Backup: {
        Interval: 1440,
        ...TaskList.Backup,
      },
      // Add more tasks as needed
    };

    // Initialize tasks with default intervals
    this.initializeTasks();
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async initializeTasks() {
    await this.updateIntervalsFromDB();
    await this.getTaskHistory();
    await this.clearRunningTasks();
    this.mainSchedulerUpdateLoop();
  }

  async clearRunningTasks() {
    try {
      await db.query(`UPDATE jf_logging SET "Result"='${taskstate.FAILED}' WHERE "Result"='${taskstate.RUNNING}'`);
    } catch (error) {
      console.log("Clear Running Tasks Error: " + error);
    }
  }

  async getTaskHistory() {
    try {
      const historyjson = await db
        .query(
          `
        with latest_tasks as
          (SELECT DISTINCT ON ("Name")
            "Id",
            "Name",
            "Type",
            "ExecutionType",
            "Duration",
            "TimeRun",
            "Log",
            "Result"
          FROM public.jf_logging
          ORDER BY  "Name", "TimeRun" DESC
          )

        select * from latest_tasks
        ORDER BY  "TimeRun" DESC;`
        )
        .then((res) =>
          res.rows.map((row) => {
            return {
              Name: row.Name,
              Type: row.Type,
              ExecutionType: row.ExecutionType,
              Duration: row.Duration,
              TimeRun: row.TimeRun,
              Result: row.Result,
            };
          })
        );

      this.taskHistory = historyjson;
      this.getTimeTillNextRun();
    } catch (error) {
      console.log("Get Task History Error: " + error);
    }
  }

  async updateIntervalsFromDB() {
    try {
      const settingsjson = await db.query('SELECT settings FROM app_config where "ID"=1').then((res) => res.rows);

      if (settingsjson.length > 0) {
        const settings = settingsjson[0].settings || {};

        for (const taskEnumKey in this.defaultIntervals) {
          const taskSettings = settings.Tasks?.[taskEnumKey] || {};
          if (taskSettings.Interval) {
            this.defaultIntervals[taskEnumKey].Interval = taskSettings.Interval;
          } else {
            taskSettings.Interval = this.defaultIntervals[taskEnumKey];
          }

          if (!settings.Tasks) {
            settings.Tasks = {};
          }
          settings.Tasks[taskEnumKey] = taskSettings;
        }

        let query = 'UPDATE app_config SET settings=$1 where "ID"=1';
        await db.query(query, [settings]);
      }
    } catch (error) {
      console.log("Sync Task Settings Error: " + error);
    }
  }

  getTimeTillNextRun() {
    try {
      for (const taskEnumKey in this.defaultIntervals) {
        const task = this.defaultIntervals[taskEnumKey];
        const interval = task.Interval;
        const lastRun = this.taskHistory.find((history) => history.Name === task.name);
        const currentTime = new Date().getTime();
        if (!lastRun) {
          const nextRunTime = currentTime + interval * 60000;
          this.defaultIntervals[taskEnumKey].NextRunTime = taskEnumKey == "JellyfinSync" ? 0 : nextRunTime;
        } else {
          const lastRunTime = new Date(lastRun.TimeRun).getTime();
          const nextRunTime = lastRunTime + interval * 60000;
          this.defaultIntervals[taskEnumKey].NextRunTime = nextRunTime;
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  mainSchedulerUpdateLoop() {
    setInterval(() => {
      const currentTime = new Date().getTime();

      for (const taskEnumKey in this.defaultIntervals) {
        const task = this.defaultIntervals[taskEnumKey];
        const nextRunTime = task.NextRunTime;
        if (currentTime >= nextRunTime && this.taskManager.isTaskRunning(task.name) === false) {
          console.log(`Running task ${task.name}...`);
          this.beginTask(taskEnumKey);
        }
      }
    }, 10000);
  }
  beginTask(taskEnumKey) {
    switch (taskEnumKey) {
      case "PartialJellyfinSync":
        this.addPartialSyncTask();
        break;
      case "JellyfinSync":
        this.addFullSyncTask();
        break;
      case "Backup":
        this.addBackupTask();
        break;
      default:
        console.log(`Unknown task: ${taskEnumKey}`);
    }
  }

  // Add tasks here

  addPartialSyncTask() {
    const success = this.taskManager.addTask({
      task: this.taskManager.taskList.PartialJellyfinSync,
      onComplete: async () => {
        await this.getTaskHistory();
      },
      onError: async (error) => {
        await this.getTaskHistory();
        console.error(error);
      },
      onExit: async () => {
        await this.getTaskHistory();
        sendUpdate("PartialSyncTask", { type: "Error", message: "Task Stopped" });
      },
    });
    if (success) {
      this.taskManager.startTask(this.taskManager.taskList.PartialJellyfinSync, triggertype.Automatic);
      return;
    }
  }

  addFullSyncTask() {
    const success = this.taskManager.addTask({
      task: this.taskManager.taskList.JellyfinSync,
      onComplete: async () => {
        await this.getTaskHistory();
      },
      onError: async (error) => {
        await this.getTaskHistory();
        console.error(error);
      },
      onExit: async () => {
        await this.getTaskHistory();
        sendUpdate("FullSyncTask", { type: "Error", message: "Task Stopped" });
      },
    });
    if (success) {
      this.taskManager.startTask(this.taskManager.taskList.JellyfinSync, triggertype.Automatic);
      return;
    }
  }

  addBackupTask() {
    const success = this.taskManager.addTask({
      task: this.taskManager.taskList.Backup,
      onComplete: async () => {
        await this.getTaskHistory();
        sendUpdate("BackupTask", { type: "Success", message: triggertype.Automatic + " Backup Completed" });
      },
      onError: async (error) => {
        console.error(error);
        await this.getTaskHistory();
        sendUpdate("BackupTask", { type: "Error", message: "Error: Backup failed" });
      },
      onExit: async () => {
        await this.getTaskHistory();
        sendUpdate("BackupTask", { type: "Error", message: "Backup Task Stopped" });
      },
    });
    if (success) {
      this.taskManager.startTask(this.taskManager.taskList.Backup, triggertype.Automatic);
      return;
    }
  }
}

module.exports = TaskScheduler;
