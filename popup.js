document.addEventListener("DOMContentLoaded", () => {
  // DOM element references
  const taskInput = document.getElementById("taskInput");
  const addTaskButton = document.getElementById("addTask");
  const taskList = document.getElementById("taskList");
  const clearAllButton = document.getElementById("clearAll");
  const creditsButton = document.getElementById("credits");
  const exportButton = document.getElementById("exportButton");
  const exportTxtButton = document.getElementById("exportTxt");
  const exportExcelButton = document.getElementById("exportExcel");
  const dropdownContent = document.querySelector(".dropdown-content");

  let tasks = [];

  // Load tasks from storage
  chrome.storage.sync.get(["tasks"], (result) => {
    tasks = result.tasks || [];
    renderTasks();
  });

  // Event listeners
  addTaskButton.addEventListener("click", addTask);
  taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  });
  clearAllButton.addEventListener("click", clearAllTasks);
  creditsButton.addEventListener("click", showCredits);
  exportButton.addEventListener("click", toggleExportDropdown);
  exportTxtButton.addEventListener("click", exportToTxt);
  exportExcelButton.addEventListener("click", exportToExcel);

  // Function to add a new task
  function addTask() {
    const taskName = taskInput.value.trim();
    if (taskName) {
      const newTask = {
        id: Date.now(),
        name: taskName,
        time: 0,
        isRunning: false,
      };
      tasks.push(newTask);
      saveTasks();
      renderTasks();
      taskInput.value = "";
    }
  }

  // Function to render tasks in the UI
  function renderTasks() {
    taskList.innerHTML = "";
    tasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item";
      li.innerHTML = `
        <span class="task-name">${task.name}</span>
        <span class="task-time">${formatTime(task.time)}</span>
        <div class="task-controls">
          <button class="start-stop" data-id="${task.id}">
            <i class="fas ${task.isRunning ? "fa-pause" : "fa-play"}"></i>
          </button>
          <button class="delete" data-id="${task.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      taskList.appendChild(li);
    });

    // Add event listeners for start/stop and delete buttons
    document.querySelectorAll(".start-stop").forEach((button) => {
      button.addEventListener("click", toggleTimer);
    });
    document.querySelectorAll(".delete").forEach((button) => {
      button.addEventListener("click", deleteTask);
    });
  }

  // Function to toggle timer for a task
  function toggleTimer(e) {
    const taskId = parseInt(e.currentTarget.getAttribute("data-id"));
    const task = tasks.find((t) => t.id === taskId);
    task.isRunning = !task.isRunning;
    saveTasks();
    renderTasks();

    if (task.isRunning) {
      task.interval = setInterval(() => {
        task.time++;
        updateTaskTime(task);
      }, 1000);
    } else {
      clearInterval(task.interval);
    }
  }

  // Function to delete a task
  function deleteTask(e) {
    const taskId = parseInt(e.currentTarget.getAttribute("data-id"));
    tasks = tasks.filter((t) => t.id !== taskId);
    saveTasks();
    renderTasks();
  }

  // Function to update task time in the UI
  function updateTaskTime(task) {
    const timeElement = document
      .querySelector(`.task-item [data-id="${task.id}"]`)
      .parentElement.parentElement.querySelector(".task-time");
    timeElement.textContent = formatTime(task.time);
    saveTasks();
  }

  // Function to format time in HH:MM:SS format
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
  }

  // Function to pad single digit numbers with a leading zero
  function pad(num) {
    return num.toString().padStart(2, "0");
  }

  // Function to save tasks to Chrome storage
  function saveTasks() {
    chrome.storage.sync.set({ tasks: tasks });
  }

  // Function to clear all tasks
  function clearAllTasks() {
    tasks = [];
    saveTasks();
    renderTasks();
  }

  // Function to show credits modal
  function showCredits() {
    const creditsModal = document.getElementById("creditsModal");
    const closeButton = document.getElementsByClassName("close")[0];

    creditsModal.style.display = "block";

    closeButton.onclick = function () {
      creditsModal.style.display = "none";
    };

    window.onclick = function (event) {
      if (event.target == creditsModal) {
        creditsModal.style.display = "none";
      }
    };
  }

  // Function to toggle export dropdown
  function toggleExportDropdown(event) {
    event.stopPropagation();
    dropdownContent.classList.toggle("show");
  }

  // Close the dropdown if the user clicks outside of it
  window.addEventListener("click", function (event) {
    if (
      !event.target.matches("#exportButton") &&
      !event.target.closest(".dropdown-content")
    ) {
      if (dropdownContent.classList.contains("show")) {
        dropdownContent.classList.remove("show");
      }
    }
  });

  // Function to export tasks to TXT file
  function exportToTxt() {
    let content = "Task Tracker Pro - Tasks\n\n";
    tasks.forEach((task) => {
      content += `${task.name} - ${formatTime(task.time)}\n`;
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.txt";
    a.click();
    URL.revokeObjectURL(url);
    dropdownContent.classList.remove("show");
  }

  // Function to export tasks to Excel file
  function exportToExcel() {
    let content = "Task Name\tTime\n";
    tasks.forEach((task) => {
      content += `${task.name}\t${formatTime(task.time)}\n`;
    });

    const blob = new Blob([content], { type: "text/tab-separated-values" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.xls";
    a.click();
    URL.revokeObjectURL(url);
    dropdownContent.classList.remove("show");
  }
});
