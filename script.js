// ===== DOM ELEMENTS =====
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const mandatoryCheckbox = document.getElementById('mandatoryCheckbox');
const categorySelect = document.getElementById('categorySelect');
const dueDateInput = document.getElementById('dueDateInput');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const emptyState = document.getElementById('emptyState');
const confettiCanvas = document.getElementById('confetti');
const particlesContainer = document.getElementById('particles');

// Statistics elements
const totalTasksEl = document.getElementById('totalTasks');
const completedTasksEl = document.getElementById('completedTasks');
const pendingTasksEl = document.getElementById('pendingTasks');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// ===== STATE =====
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
  createParticles();
  loadTasks();
  updateStatistics();
  checkDarkMode();
});

// ===== INITIALIZE APP =====
function initializeApp() {
  // Event Listeners
  addBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });
  themeToggleBtn.addEventListener('click', toggleDarkMode);
  searchInput.addEventListener('input', filterTasks);
  
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      filterTasks();
    });
  });
}

// ===== CREATE PARTICLE BACKGROUND =====
function createParticles() {
  const particleCount = 30;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = Math.random() * 4 + 2 + 'px';
    particle.style.height = particle.style.width;
    particle.style.background = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
    particle.style.borderRadius = '50%';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animation = `float ${Math.random() * 10 + 10}s linear infinite`;
    particle.style.animationDelay = Math.random() * 5 + 's';
    particlesContainer.appendChild(particle);
  }
  
  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes float {
      0%, 100% {
        transform: translate(0, 0) rotate(0deg);
        opacity: 0.3;
      }
      25% {
        transform: translate(100px, -100px) rotate(90deg);
        opacity: 0.5;
      }
      50% {
        transform: translate(-50px, -200px) rotate(180deg);
        opacity: 0.7;
      }
      75% {
        transform: translate(-150px, -100px) rotate(270deg);
        opacity: 0.5;
      }
    }
  `;
  document.head.appendChild(style);
}

// ===== ADD TASK =====
function addTask() {
  const taskText = taskInput.value.trim();
  if (taskText === '') {
    shakeInput();
    return;
  }
  
  const task = {
    id: Date.now(),
    text: taskText,
    completed: false,
    priority: mandatoryCheckbox.checked,
    category: categorySelect.value,
    dueDate: dueDateInput.value || null,
    createdAt: new Date().toISOString()
  };
  
  tasks.push(task);
  saveTasks();
  renderTask(task);
  
  // Clear inputs
  taskInput.value = '';
  mandatoryCheckbox.checked = false;
  dueDateInput.value = '';
  
  updateStatistics();
  updateEmptyState();
}

// ===== RENDER TASK =====
function renderTask(task) {
  const li = document.createElement('li');
  li.dataset.id = task.id;
  if (task.completed) li.classList.add('completed');
  
  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  
  li.innerHTML = `
    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
    <div class="task-text">
      ${task.priority ? '<span class="priority-badge">!</span> ' : ''}
      ${task.text}
    </div>
    <div class="task-meta">
      <span class="task-category category-${task.category}">${task.category}</span>
      ${task.dueDate ? `<span class="task-date"><i class="fas fa-calendar"></i> ${dueDate}</span>` : ''}
    </div>
    <div class="actions">
      <button class="delete-btn">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  
  // Event listeners
  const checkbox = li.querySelector('.task-checkbox');
  checkbox.addEventListener('change', () => toggleComplete(task.id));
  
  const deleteBtn = li.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', () => deleteTask(task.id));
  
  // Make draggable
  li.draggable = true;
  li.addEventListener('dragstart', handleDragStart);
  li.addEventListener('dragover', handleDragOver);
  li.addEventListener('drop', handleDrop);
  li.addEventListener('dragend', handleDragEnd);
  
  taskList.appendChild(li);
}

// ===== LOAD TASKS =====
function loadTasks() {
  taskList.innerHTML = '';
  tasks.forEach(task => renderTask(task));
  updateEmptyState();
}

// ===== TOGGLE COMPLETE =====
function toggleComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  
  task.completed = !task.completed;
  saveTasks();
  
  const li = document.querySelector(`li[data-id="${id}"]`);
  li.classList.toggle('completed');
  
  if (task.completed) {
    triggerConfetti();
  }
  
  updateStatistics();
}

// ===== DELETE TASK =====
function deleteTask(id) {
  const li = document.querySelector(`li[data-id="${id}"]`);
  
  // Animate out
  li.style.animation = 'slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
  
  setTimeout(() => {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    li.remove();
    updateStatistics();
    updateEmptyState();
  }, 300);
  
  // Add CSS animation
  if (!document.getElementById('slideOutStyle')) {
    const style = document.createElement('style');
    style.id = 'slideOutStyle';
    style.textContent = `
      @keyframes slideOut {
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// ===== FILTER TASKS =====
function filterTasks() {
  const searchTerm = searchInput.value.toLowerCase();
  const allTasks = document.querySelectorAll('#taskList li');
  
  allTasks.forEach(li => {
    const taskId = parseInt(li.dataset.id);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const matchesSearch = task.text.toLowerCase().includes(searchTerm);
    const matchesFilter = 
      currentFilter === 'all' ||
      (currentFilter === 'completed' && task.completed) ||
      (currentFilter === 'pending' && !task.completed);
    
    if (matchesSearch && matchesFilter) {
      li.style.display = 'flex';
    } else {
      li.style.display = 'none';
    }
  });
  
  updateEmptyState();
}

// ===== UPDATE STATISTICS =====
function updateStatistics() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Animate numbers
  animateNumber(totalTasksEl, total);
  animateNumber(completedTasksEl, completed);
  animateNumber(pendingTasksEl, pending);
  
  // Update progress bar
  progressFill.style.width = percentage + '%';
  progressText.textContent = percentage + '% Complete';
}

// ===== ANIMATE NUMBER =====
function animateNumber(element, target) {
  const current = parseInt(element.textContent) || 0;
  const increment = target > current ? 1 : -1;
  const steps = Math.abs(target - current);
  
  if (steps === 0) return;
  
  let count = current;
  const interval = setInterval(() => {
    count += increment;
    element.textContent = count;
    
    if (count === target) {
      clearInterval(interval);
    }
  }, 50);
}

// ===== UPDATE EMPTY STATE =====
function updateEmptyState() {
  const visibleTasks = Array.from(taskList.querySelectorAll('li')).filter(li => li.style.display !== 'none');
  
  if (visibleTasks.length === 0) {
    emptyState.classList.add('show');
  } else {
    emptyState.classList.remove('show');
  }
}

// ===== DRAG AND DROP =====
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = this;
  this.style.opacity = '0.5';
}

function handleDragOver(e) {
  e.preventDefault();
  return false;
}

function handleDrop(e) {
  e.stopPropagation();
  
  if (draggedElement !== this) {
    const allTasks = Array.from(taskList.querySelectorAll('li'));
    const draggedIndex = allTasks.indexOf(draggedElement);
    const targetIndex = allTasks.indexOf(this);
    
    if (draggedIndex < targetIndex) {
      this.parentNode.insertBefore(draggedElement, this.nextSibling);
    } else {
      this.parentNode.insertBefore(draggedElement, this);
    }
    
    // Update tasks array order
    const draggedId = parseInt(draggedElement.dataset.id);
    const targetId = parseInt(this.dataset.id);
    const draggedTaskIndex = tasks.findIndex(t => t.id === draggedId);
    const targetTaskIndex = tasks.findIndex(t => t.id === targetId);
    
    const [removed] = tasks.splice(draggedTaskIndex, 1);
    tasks.splice(targetTaskIndex, 0, removed);
    saveTasks();
  }
  
  return false;
}

function handleDragEnd() {
  this.style.opacity = '1';
  draggedElement = null;
}

// ===== CONFETTI ANIMATION =====
function triggerConfetti() {
  const ctx = confettiCanvas.getContext('2d');
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  
  const particles = [];
  const particleCount = 100;
  const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#10b981', '#f59e0b'];
  
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      r: Math.random() * 6 + 2,
      d: Math.random() * particleCount,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngleIncremental: Math.random() * 0.07 + 0.05,
      tiltAngle: 0
    });
  }
  
  function draw() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
    particles.forEach((p, i) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.x += Math.sin(p.d);
      p.tilt = Math.sin(p.tiltAngle - i / 3) * 15;
      
      ctx.beginPath();
      ctx.lineWidth = p.r / 2;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
      ctx.stroke();
    });
    
    if (particles.some(p => p.y < confettiCanvas.height)) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }
  
  draw();
}

// ===== SHAKE INPUT ANIMATION =====
function shakeInput() {
  taskInput.style.animation = 'shake 0.5s';
  setTimeout(() => {
    taskInput.style.animation = '';
  }, 500);
  
  if (!document.getElementById('shakeStyle')) {
    const style = document.createElement('style');
    style.id = 'shakeStyle';
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
    `;
    document.head.appendChild(style);
  }
}

// ===== DARK MODE =====
function toggleDarkMode() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  
  const icon = themeToggleBtn.querySelector('i');
  const text = themeToggleBtn.querySelector('span');
  
  if (isDark) {
    icon.className = 'fas fa-sun';
    text.textContent = 'Light Mode';
  } else {
    icon.className = 'fas fa-moon';
    text.textContent = 'Dark Mode';
  }
  
  localStorage.setItem('darkMode', isDark);
}

function checkDarkMode() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  
  if (isDark) {
    document.body.classList.add('dark');
    const icon = themeToggleBtn.querySelector('i');
    const text = themeToggleBtn.querySelector('span');
    icon.className = 'fas fa-sun';
    text.textContent = 'Light Mode';
  }
}

// ===== LOCAL STORAGE =====
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// ===== WINDOW RESIZE HANDLER =====
window.addEventListener('resize', () => {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
});