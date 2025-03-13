document.addEventListener("DOMContentLoaded", () => {
  // DOM element references
  const taskInput = document.getElementById("taskInput");
  const taskCategory = document.getElementById("taskCategory");
  const categoryFilter = document.getElementById("categoryFilter");
  const addTaskButton = document.getElementById("addTask");
  const taskList = document.getElementById("taskList");
  const clearAllButton = document.getElementById("clearAll");
  const creditsButton = document.getElementById("credits");
  const exportButton = document.getElementById("exportButton");
  const exportTxtButton = document.getElementById("exportTxt");
  const exportExcelButton = document.getElementById("exportExcel");
  const dropdownContent = document.querySelector(".dropdown-content");
  const resizeHandle = document.querySelector(".resize-handle");
  const themeToggle = document.getElementById("themeToggle");
  const settingsPanel = document.getElementById("settingsPanel");
  const primaryColorPicker = document.getElementById("primaryColor");
  const secondaryColorPicker = document.getElementById("secondaryColor");
  const applyColorsButton = document.getElementById("applyColors");
  const resetColorsButton = document.getElementById("resetColors");

  // Add sun icon to theme toggle button
  themeToggle.innerHTML = '<i class="fas fa-moon"></i><i class="fas fa-sun"></i>';

  let tasks = [];
  let isDarkMode = false;
  let isEditing = false;
  let customColors = {
    light: {
      primary: "#3498db",
      secondary: "#e74c3c"
    },
    dark: {
      primary: "#4a69bd",
      secondary: "#eb2f06"
    }
  };

  // SIMPLIFY: Use event delegation for the settings button
  // This captures clicks on the button or any of its children (like the icon)
  document.addEventListener("click", function(event) {
    // Check if the click is on the settings button or its children
    const settingsButton = document.getElementById("settingsToggle");
    if (event.target === settingsButton || settingsButton.contains(event.target)) {
      console.log("Settings button clicked (delegation)");
      toggleSettings();
    }

    // Check if the click is on the close settings button
    if (event.target.classList.contains("close-settings")) {
      console.log("Close settings button clicked (delegation)");
      closeSettings();
    }
  });

  // Simplified settings toggle functions
  function toggleSettings() {
    console.log("Toggling settings panel");
    if (settingsPanel) {
      settingsPanel.classList.toggle("show");
      
      // Update color pickers to reflect current theme's colors when panel opens
      if (settingsPanel.classList.contains("show")) {
        updateColorPickersForCurrentTheme();
      }
    } else {
      console.error("Settings panel not found");
    }
  }

  function closeSettings() {
    console.log("Closing settings panel");
    if (settingsPanel) {
      settingsPanel.classList.remove("show");
    } else {
      console.error("Settings panel not found");
    }
  }

  // Function to update color pickers based on current theme
  function updateColorPickersForCurrentTheme() {
    const currentThemeColors = isDarkMode ? customColors.dark : customColors.light;
    primaryColorPicker.value = currentThemeColors.primary;
    secondaryColorPicker.value = currentThemeColors.secondary;
    
    // Update the theme indicator text
    const themeIndicator = document.getElementById("currentThemeText");
    if (themeIndicator) {
      themeIndicator.textContent = isDarkMode ? "Dark" : "Light";
    }
  }

  // Load tasks, theme preference, and custom colors from storage
  chrome.storage.sync.get(["tasks", "isDarkMode", "customColors"], (result) => {
    tasks = result.tasks || [];
    isDarkMode = result.isDarkMode || false;
    
    // Handle both old and new format for customColors
    if (result.customColors) {
      if (result.customColors.light && result.customColors.dark) {
        // New format with separate light and dark mode colors
        customColors = result.customColors;
      } else {
        // Old format with single color set - migrate to new format
        customColors = {
          light: {
            primary: result.customColors.primary || "#3498db",
            secondary: result.customColors.secondary || "#e74c3c"
          },
          dark: {
            primary: "#4a69bd",
            secondary: "#eb2f06"
          }
        };
      }
    }
    
    // Ensure both light and dark theme have proper default colors
    ensureDefaultColorsExist();
    
    // Apply theme
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    }
    
    // Set the current theme text
    const themeIndicator = document.getElementById("currentThemeText");
    if (themeIndicator) {
      themeIndicator.textContent = isDarkMode ? "Dark" : "Light";
    }
    
    // Apply custom colors for current theme
    applyCustomColors(isDarkMode ? customColors.dark : customColors.light);
    
    // Set initial color picker values
    updateColorPickersForCurrentTheme();
    
    renderTasks();
  });

  // Function to ensure both themes have default colors
  function ensureDefaultColorsExist() {
    // Set default light theme colors if they don't exist
    if (!customColors.light || !customColors.light.primary) {
      customColors.light = {
        primary: "#3498db",
        secondary: "#e74c3c"
      };
    }
    
    // Set default dark theme colors if they don't exist
    if (!customColors.dark || !customColors.dark.primary) {
      customColors.dark = {
        primary: "#4a69bd",
        secondary: "#eb2f06"
      };
    }
  }

  // Load saved window height
  chrome.storage.local.get(["windowHeight"], (result) => {
    if (result.windowHeight) {
      document.body.style.height = result.windowHeight + "px";
    }
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
  themeToggle.addEventListener("click", toggleTheme);
  applyColorsButton.addEventListener("click", updateCustomColors);
  resetColorsButton.addEventListener("click", resetColors);
  categoryFilter.addEventListener("change", filterTasks);
  
  // Resize functionality
  let isResizing = false;
  let startY, startHeight;

  resizeHandle.addEventListener("mousedown", (e) => {
    isResizing = true;
    startY = e.clientY;
    startHeight = parseInt(document.defaultView.getComputedStyle(document.body).height, 10);
    
    // Add event listeners for mouse movement and release
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    
    // Prevent text selection during resize
    e.preventDefault();
  });

  function handleMouseMove(e) {
    if (!isResizing) return;
    
    const newHeight = startHeight + (e.clientY - startY);
    
    // Apply constraints (min and max height)
    const minHeight = 400;
    const maxHeight = 800;
    const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
    
    document.body.style.height = constrainedHeight + "px";
  }

  function handleMouseUp() {
    isResizing = false;
    
    // Remove event listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    
    // Save the current height to storage
    const currentHeight = parseInt(document.defaultView.getComputedStyle(document.body).height, 10);
    chrome.storage.local.set({ windowHeight: currentHeight });
  }

  // Function to toggle dark/light theme
  function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle("dark-mode");
    
    // Set default colors for dark mode if switching to dark mode for the first time
    if (isDarkMode && !customColors.dark.primary) {
      customColors.dark = {
        primary: "#4a69bd", 
        secondary: "#eb2f06"
      };
    }
    
    // Apply colors for the new theme
    applyCustomColors(isDarkMode ? customColors.dark : customColors.light);
    
    // Update theme indicator text
    const themeIndicator = document.getElementById("currentThemeText");
    if (themeIndicator) {
      themeIndicator.textContent = isDarkMode ? "Dark" : "Light";
    }
    
    // If settings panel is open, update color pickers
    if (settingsPanel.classList.contains("show")) {
      updateColorPickersForCurrentTheme();
    }
    
    // Save theme preference
    chrome.storage.sync.set({ isDarkMode: isDarkMode });
  }

  // Function to apply custom colors
  function applyCustomColors(colors) {
    console.log("Applying colors:", colors, "Dark mode:", isDarkMode);
    
    // Primary and secondary colors
    document.documentElement.style.setProperty('--primary-color', colors.primary);
    document.documentElement.style.setProperty('--primary-hover', adjustColor(colors.primary, -20));
    document.documentElement.style.setProperty('--secondary-color', colors.secondary);
    document.documentElement.style.setProperty('--secondary-hover', adjustColor(colors.secondary, -20));
    
    // Also apply the custom colors to the body element for dark mode
    // This ensures the custom colors work in dark mode
    if (isDarkMode) {
      document.body.style.setProperty('--primary-color', colors.primary);
      document.body.style.setProperty('--primary-hover', adjustColor(colors.primary, -20));
      document.body.style.setProperty('--secondary-color', colors.secondary);
      document.body.style.setProperty('--secondary-hover', adjustColor(colors.secondary, -20));
    }
  }

  // Function to update custom colors
  function updateCustomColors() {
    const newColors = {
      primary: primaryColorPicker.value,
      secondary: secondaryColorPicker.value
    };
    
    console.log("Updating custom colors:", newColors, "For theme:", isDarkMode ? "dark" : "light");
    
    // Update only the current theme's colors
    if (isDarkMode) {
      customColors.dark = newColors;
    } else {
      customColors.light = newColors;
    }
    
    // Apply the new colors
    applyCustomColors(newColors);
    
    // Save custom colors for both themes
    chrome.storage.sync.set({ customColors: customColors });
  }

  // Function to reset colors to default
  function resetColors() {
    const defaultLightColors = {
      primary: "#3498db",
      secondary: "#e74c3c"
    };
    
    const defaultDarkColors = {
      primary: "#4a69bd",
      secondary: "#eb2f06"
    };
    
    // Reset only the current theme's colors
    if (isDarkMode) {
      customColors.dark = defaultDarkColors;
      applyCustomColors(defaultDarkColors);
      primaryColorPicker.value = defaultDarkColors.primary;
      secondaryColorPicker.value = defaultDarkColors.secondary;
    } else {
      customColors.light = defaultLightColors;
      applyCustomColors(defaultLightColors);
      primaryColorPicker.value = defaultLightColors.primary;
      secondaryColorPicker.value = defaultLightColors.secondary;
    }
    
    // Save the reset colors
    chrome.storage.sync.set({ customColors: customColors });
  }

  // Helper function to adjust color brightness
  function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => 
      ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2)
    );
  }

  // Function to filter tasks by category
  function filterTasks() {
    const selectedCategory = categoryFilter.value;
    const taskItems = taskList.querySelectorAll('.task-item');
    
    taskItems.forEach(item => {
      const itemCategory = item.getAttribute('data-category');
      
      if (selectedCategory === 'all' || selectedCategory === itemCategory) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  // Function to add a new task
  function addTask() {
    const taskName = taskInput.value.trim();
    const category = taskCategory.value;
    
    if (taskName) {
      const newTask = {
        id: Date.now(),
        name: taskName,
        time: 0,
        isRunning: false,
        category: category
      };
      tasks.push(newTask);
      saveTasks();
      renderTasks();
      taskInput.value = "";
    }
  }

  // Function to render tasks in the UI
  function renderTasks() {
    if (isEditing) return;
    
    taskList.innerHTML = "";
    tasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-item${task.category ? ` category-${task.category}` : ''}`;
      li.setAttribute('data-category', task.category || '');
      li.setAttribute('data-id', task.id);
      
      // Create category tag if category exists
      let categoryTag = '';
      if (task.category) {
        categoryTag = `<span class="task-category-tag ${task.category}" data-id="${task.id}">${task.category}</span>`;
      } else {
        categoryTag = `<span class="task-category-tag no-category" data-id="${task.id}">No Category</span>`;
      }
      
      li.innerHTML = `
        <span class="task-name" data-id="${task.id}">${categoryTag}<span class="task-text" data-id="${task.id}">${task.name}</span></span>
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

    // Apply current filter
    filterTasks();

    // Add event listeners for start/stop and delete buttons
    document.querySelectorAll(".start-stop").forEach((button) => {
      button.addEventListener("click", toggleTimer);
    });
    document.querySelectorAll(".delete").forEach((button) => {
      button.addEventListener("click", deleteTask);
    });
    
    // Add double-click listener for category tags
    document.querySelectorAll(".task-category-tag").forEach((tag) => {
      tag.addEventListener("dblclick", showCategorySelector);
    });
    
    // Add double-click listener for task text editing
    document.querySelectorAll(".task-text").forEach((text) => {
      text.addEventListener("dblclick", makeTaskEditable);
    });
  }

  // Function to toggle timer for a task
  function toggleTimer(e) {
    const taskId = parseInt(e.currentTarget.getAttribute("data-id"));
    const task = tasks.find((t) => t.id === taskId);

    // Send message to background script to toggle timer
    chrome.runtime.sendMessage({ action: "toggleTimer", taskId: taskId });

    task.isRunning = !task.isRunning;
    renderTasks();
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
    
    // Also close settings panel if clicking outside
    if (
      !event.target.matches("#settingsToggle") &&
      !event.target.closest("#settingsPanel") &&
      settingsPanel && settingsPanel.classList.contains("show")
    ) {
      settingsPanel.classList.remove("show");
    }
  });

  // Function to export tasks to TXT file
  function exportToTxt() {
    let content = "Task Tracker Pro - Tasks\n\n";
    tasks.forEach((task) => {
      const category = task.category ? `[${task.category}] ` : '';
      content += `${category}${task.name} - ${formatTime(task.time)}\n`;
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
    let content = "Category\tTask Name\tTime\n";
    tasks.forEach((task) => {
      content += `${task.category || "None"}\t${task.name}\t${formatTime(task.time)}\n`;
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

  // Add this function to update task times
  function updateTaskTimes() {
    if (isEditing) return;
    
    chrome.storage.sync.get(["tasks"], (result) => {
      tasks = result.tasks || [];
      renderTasks();
    });
  }

  // Call updateTaskTimes every second
  setInterval(updateTaskTimes, 1000);

  // Function to show category selector when tag is double-clicked
  function showCategorySelector(e) {
    e.stopPropagation();
    isEditing = true;
    
    const taskId = parseInt(e.target.getAttribute("data-id"));
    const task = tasks.find((t) => t.id === taskId);
    const categoryTag = e.target;
    const currentCategory = task.category || "";
    
    // Create container for dropdown and buttons
    const editContainer = document.createElement("div");
    editContainer.className = "inline-edit-container";
    editContainer.setAttribute("role", "form");
    editContainer.setAttribute("aria-label", "Edit category");
    
    // Create dropdown directly in place of the tag
    const categorySelector = document.createElement("select");
    // Add accessibility attributes
    const selectId = `category-select-${taskId}`;
    categorySelector.id = selectId;
    categorySelector.name = selectId;
    categorySelector.setAttribute("aria-label", "Select category");
    
    categorySelector.className = "inline-category-select";
    categorySelector.innerHTML = `
      <option value="">No Category</option>
      <option value="work">Work</option>
      <option value="personal">Personal</option>
      <option value="study">Study</option>
      <option value="health">Health</option>
      <option value="other">Other</option>
    `;
    categorySelector.value = currentCategory;
    
    // Create save button (green check)
    const saveButton = document.createElement("button");
    saveButton.className = "inline-edit-save";
    saveButton.innerHTML = '<i class="fas fa-check"></i>';
    saveButton.title = "Save changes";
    saveButton.setAttribute("aria-label", "Save category changes");
    saveButton.type = "button";
    
    // Create cancel button (red X)
    const cancelButton = document.createElement("button");
    cancelButton.className = "inline-edit-cancel";
    cancelButton.innerHTML = '<i class="fas fa-times"></i>';
    cancelButton.title = "Discard changes";
    cancelButton.setAttribute("aria-label", "Cancel category changes");
    cancelButton.type = "button";
    
    // Add elements to container
    editContainer.appendChild(categorySelector);
    editContainer.appendChild(saveButton);
    editContainer.appendChild(cancelButton);
    
    // Hide the original tag and insert the container
    categoryTag.style.display = "none";
    categoryTag.parentNode.insertBefore(editContainer, categoryTag);
    
    // Focus the dropdown
    categorySelector.focus();
    
    // Handle save button click
    saveButton.addEventListener("click", function() {
      task.category = categorySelector.value;
      saveTasks();
      isEditing = false;
      renderTasks();
    });
    
    // Handle cancel button click
    cancelButton.addEventListener("click", function() {
      isEditing = false;
      renderTasks(); // Just redraw without saving changes
    });
    
    // Also save on Enter key
    categorySelector.addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        task.category = this.value;
        saveTasks();
        isEditing = false;
        renderTasks();
      } else if (e.key === "Escape") {
        isEditing = false;
        renderTasks(); // Cancel edit
      }
    });
    
    // Prevent bubbling to avoid unexpected closes
    editContainer.addEventListener("click", function(e) {
      e.stopPropagation();
    });
  }
  
  // Function to make task text editable on double-click
  function makeTaskEditable(e) {
    e.stopPropagation();
    isEditing = true;
    
    const taskId = parseInt(e.target.getAttribute("data-id"));
    const task = tasks.find((t) => t.id === taskId);
    const textSpan = e.target;
    const currentText = task.name;
    
    // Create container for input and buttons
    const editContainer = document.createElement("div");
    editContainer.className = "inline-edit-container";
    editContainer.setAttribute("role", "form");
    editContainer.setAttribute("aria-label", "Edit task");
    
    // Create editable input field
    const editInput = document.createElement("input");
    // Add accessibility attributes
    const inputId = `task-edit-${taskId}`;
    editInput.id = inputId;
    editInput.name = inputId;
    editInput.setAttribute("aria-label", "Edit task name");
    
    editInput.type = "text";
    editInput.value = currentText;
    editInput.className = "inline-task-edit";
    
    // Create save button (green check)
    const saveButton = document.createElement("button");
    saveButton.className = "inline-edit-save";
    saveButton.innerHTML = '<i class="fas fa-check"></i>';
    saveButton.title = "Save changes";
    saveButton.setAttribute("aria-label", "Save task changes");
    saveButton.type = "button";
    
    // Create cancel button (red X)
    const cancelButton = document.createElement("button");
    cancelButton.className = "inline-edit-cancel";
    cancelButton.innerHTML = '<i class="fas fa-times"></i>';
    cancelButton.title = "Discard changes";
    cancelButton.setAttribute("aria-label", "Cancel task changes");
    cancelButton.type = "button";
    
    // Add elements to container
    editContainer.appendChild(editInput);
    editContainer.appendChild(saveButton);
    editContainer.appendChild(cancelButton);
    
    // Replace text with edit container
    textSpan.style.display = "none";
    textSpan.parentNode.insertBefore(editContainer, textSpan);
    
    // Focus the input and select all text
    editInput.focus();
    editInput.setSelectionRange(0, editInput.value.length);
    
    // Handle save button click
    saveButton.addEventListener("click", function() {
      saveTaskEdit(editInput, task);
    });
    
    // Handle cancel button click
    cancelButton.addEventListener("click", function() {
      isEditing = false;
      renderTasks(); // Just redraw without saving changes
    });
    
    // Also handle enter key to save
    editInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        saveTaskEdit(this, task);
      } else if (e.key === "Escape") {
        isEditing = false;
        renderTasks(); // Cancel edit
      }
    });
    
    // Prevent bubbling to avoid unexpected closes
    editContainer.addEventListener("click", function(e) {
      e.stopPropagation();
    });
  }
  
  // Helper function to save task text edit
  function saveTaskEdit(inputField, task) {
    const newText = inputField.value.trim();
    if (newText && newText !== task.name) {
      task.name = newText;
      saveTasks();
    }
    isEditing = false;
    renderTasks();
  }

  // Add event listener for tip close button
  document.querySelector(".close-tip").addEventListener("click", function() {
    document.querySelector(".edit-info-tip").style.display = "none";
  });
});
