const TaskManager = require("./task-manager");

class TaskManagerSingleton {
  constructor() {
    if (!TaskManagerSingleton.instance) {
      TaskManagerSingleton.instance = new TaskManager();
      console.log("Task Manager Singleton created");
    }
  }

  getInstance() {
    return TaskManagerSingleton.instance;
  }
}

module.exports = TaskManagerSingleton;
