const TaskScheduler = require("./task-scheduler.js");

class TaskSchedulerSingleton {
  constructor() {
    if (!TaskSchedulerSingleton.instance) {
      TaskSchedulerSingleton.instance = new TaskScheduler();
      console.log("Task Scheduler Singleton created");
    }
  }

  getInstance() {
    return TaskSchedulerSingleton.instance;
  }
}

module.exports = TaskSchedulerSingleton;
