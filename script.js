const STORAGE_KEY = "studyflow_tasks_v1";

const taskForm = document.getElementById("taskForm");
const taskTitleInput = document.getElementById("taskTitle");
const taskCategoryInput = document.getElementById("taskCategory");
const taskDateInput = document.getElementById("taskDate");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const sortSelect = document.getElementById("sortSelect");
const toast = document.getElementById("toast");

let currentFilter = "all";
let tasks = loadTasks();
let toastTimeout;

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter(isValidTask) : [];
  } catch (error) {
    console.warn("Could not load saved tasks:", error);
    return [];
  }
}

function isValidTask(task) {
  return task && typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.completed === "boolean";
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    showToast("Could not save tasks in this browser.");
    console.error("Could not save tasks:", error);
  }
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return "No due date";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function dateDifference(dateString) {
  if (!dateString) return null;
  const today = new Date(`${localDateString()}T00:00:00`);
  const due = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  return Math.round((due - today) / 86400000);
}

function dueDateText(task) {
  if (!task.dueDate) return "No due date";
  const difference = dateDifference(task.dueDate);
  if (difference === null) return "No due date";
  if (difference < 0) return `Overdue · ${formatDate(task.dueDate)}`;
  if (difference === 0) return "Due today";
  if (difference === 1) return "Due tomorrow";
  return formatDate(task.dueDate);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function filteredTasks() {
  let result = tasks.filter(task => {
    if (currentFilter === "pending") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  const sort = sortSelect.value;
  if (sort === "newest") {
    result.sort((a, b) => b.createdAt - a.createdAt);
  } else if (sort === "name") {
    result.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    result.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return b.createdAt - a.createdAt;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate) || b.createdAt - a.createdAt;
    });
  }
  return result;
}

function renderStats() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const pending = total - completed;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  document.getElementById("totalStat").textContent = total;
  document.getElementById("pendingStat").textContent = pending;
  document.getElementById("completedStat").textContent = completed;
  document.getElementById("progressStat").textContent = progress;
  document.getElementById("progressFill").style.width = `${progress}%`;
  document.getElementById("allCount").textContent = total;
  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("completedCount").textContent = completed;
}

function renderTasks() {
  const visibleTasks = filteredTasks();
  taskList.innerHTML = visibleTasks.map(task => {
    const difference = dateDifference(task.dueDate);
    const dueClass = !task.completed && difference !== null && difference < 0
      ? "overdue"
      : (!task.completed && difference === 0 ? "today" : "");
    return `
      <article class="task-item ${task.completed ? "is-completed" : ""}">
        <input class="task-check" type="checkbox" data-action="toggle" data-id="${escapeHTML(task.id)}"
          aria-label="Mark ${escapeHTML(task.title)} as ${task.completed ? "pending" : "completed"}"
          ${task.completed ? "checked" : ""}>
        <div class="task-main">
          <div class="task-title">${escapeHTML(task.title)}</div>
          <div class="task-meta">
            <span class="category-tag">${escapeHTML(task.category || "Study")}</span>
            <span class="due-date ${dueClass}">◷ ${escapeHTML(dueDateText(task))}</span>
          </div>
        </div>
        <button class="delete-button" type="button" data-action="delete" data-id="${escapeHTML(task.id)}"
          aria-label="Delete ${escapeHTML(task.title)}" title="Delete task">×</button>
      </article>`;
  }).join("");

  const noTasks = visibleTasks.length === 0;
  emptyState.hidden = !noTasks;
  taskList.hidden = noTasks;
  document.getElementById("visibleCount").textContent = `${visibleTasks.length} ${visibleTasks.length === 1 ? "task" : "tasks"}`;
  document.getElementById("listTitle").textContent = currentFilter === "all"
    ? "All tasks"
    : currentFilter === "pending" ? "Pending tasks" : "Completed tasks";

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.classList.toggle("active", button.classList.contains("nav-item") && button.dataset.filter === currentFilter);
    button.classList.toggle("selected", button.classList.contains("filter-pill") && button.dataset.filter === currentFilter);
    if (button.classList.contains("nav-item")) {
      if (button.dataset.filter === currentFilter) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    }
  });
}

function renderUpcoming() {
  const upcoming = tasks
    .filter(task => !task.completed && task.dueDate && dateDifference(task.dueDate) >= 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  const upcomingList = document.getElementById("upcomingList");
  const upcomingEmpty = document.getElementById("upcomingEmpty");
  upcomingList.innerHTML = upcoming.map(task => {
    const date = new Date(`${task.dueDate}T00:00:00`);
    return `<div class="upcoming-item">
      <div class="date-box"><strong>${date.getDate()}</strong><span>${date.toLocaleDateString(undefined, { month: "short" })}</span></div>
      <div class="upcoming-details"><strong>${escapeHTML(task.title)}</strong><span>${escapeHTML(task.category || "Study")} · ${escapeHTML(dueDateText(task))}</span></div>
    </div>`;
  }).join("");
  upcomingEmpty.hidden = upcoming.length > 0;
}

function render() {
  renderStats();
  renderTasks();
  renderUpcoming();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2400);
}

function setFilter(filter) {
  currentFilter = filter;
  renderTasks();
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();
  const title = taskTitleInput.value.trim();
  if (!title) {
    taskTitleInput.focus();
    return;
  }

  tasks.unshift({
    id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    category: taskCategoryInput.value,
    dueDate: taskDateInput.value,
    completed: false,
    createdAt: Date.now()
  });
  saveTasks();
  taskForm.reset();
  taskCategoryInput.value = "Assignment";
  currentFilter = "all";
  render();
  taskTitleInput.focus();
  showToast("Task added successfully!");
});

document.addEventListener("click", event => {
  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    setFilter(filterButton.dataset.filter);
    return;
  }

  const actionButton = event.target.closest("[data-action='delete']");
  if (actionButton) {
    const task = tasks.find(item => item.id === actionButton.dataset.id);
    tasks = tasks.filter(item => item.id !== actionButton.dataset.id);
    saveTasks();
    render();
    showToast(task ? "Task deleted." : "Task removed.");
  }
});

document.addEventListener("change", event => {
  const checkbox = event.target.closest("[data-action='toggle']");
  if (!checkbox) return;
  const task = tasks.find(item => item.id === checkbox.dataset.id);
  if (!task) return;
  task.completed = checkbox.checked;
  saveTasks();
  render();
  showToast(task.completed ? "Great work — task completed!" : "Task moved to pending.");
});

sortSelect.addEventListener("change", renderTasks);

document.getElementById("todayLabel").textContent = new Date().toLocaleDateString(undefined, {
  weekday: "long", month: "long", day: "numeric"
}).toUpperCase();

render();
