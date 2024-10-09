// Initialize tasks array
let tasks = [];

// Load tasks from storage
chrome.storage.sync.get(["tasks"], (result) => {
  tasks = result.tasks || [];
  updateAlarms();
});

// Listen for changes in storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync" && changes.tasks) {
    tasks = changes.tasks.newValue;
    updateAlarms();
  }
});

// Update alarms based on running tasks
function updateAlarms() {
  chrome.alarms.clearAll();
  tasks.forEach((task) => {
    if (task.isRunning) {
      chrome.alarms.create(`task-${task.id}`, { periodInMinutes: 1 / 60 });
    }
  });
}

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  const taskId = parseInt(alarm.name.split("-")[1]);
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.time++;
    chrome.storage.sync.set({ tasks: tasks });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleTimer") {
    const task = tasks.find((t) => t.id === request.taskId);
    if (task) {
      task.isRunning = !task.isRunning;
      if (task.isRunning) {
        chrome.alarms.create(`task-${task.id}`, { periodInMinutes: 1 / 60 });
      } else {
        chrome.alarms.clear(`task-${task.id}`);
      }
      chrome.storage.sync.set({ tasks: tasks });
    }
  }
});
