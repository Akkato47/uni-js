const storageKey = 'todo.tasks';
let tasks = [];
let editingId = null;
const modal = document.getElementById('modal');
const listScreen = document.getElementById('list-screen');
const taskText = document.getElementById('task-text');

try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (Array.isArray(saved)) {
    tasks = saved.filter(task => task && typeof task.id === 'string' && typeof task.text === 'string')
      .map(task => ({ id: task.id, text: task.text, done: Boolean(task.done) }));
  }
} catch (error) {
  tasks = [];
}

function saveTasks() {
  try {
    if (tasks.length) localStorage.setItem(storageKey, JSON.stringify(tasks));
    else localStorage.removeItem(storageKey);
  } catch (error) {
    alert('Не удалось сохранить задачи. Проверьте доступ к хранилищу браузера.');
  }
}

function openModal(id = null) {
  editingId = id;
  const task = tasks.find(item => item.id === id);
  taskText.value = task ? task.text : '';
  listScreen.hidden = true;
  modal.hidden = false;
  taskText.focus();
}

function closeModal() {
  modal.hidden = true;
  listScreen.hidden = false;
  taskText.value = '';
  taskText.setCustomValidity('');
  editingId = null;
}

function createTask() {
  const text = taskText.value.trim();
  if (!text) {
    taskText.setCustomValidity('Введите текст задачи');
    taskText.reportValidity();
    return;
  }
  if (editingId !== null) {
    const task = tasks.find(item => item.id === editingId);
    if (task) task.text = text;
  } else {
    tasks.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), text, done: false });
  }
  saveTasks();
  renderTodoList();
  closeModal();
}

function deleteItem(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTodoList();
}

function setDone(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  task.done = !task.done;
  saveTasks();
  renderTodoList();
}

function renderTodoList() {
  const list = document.getElementById('tasks');
  list.replaceChildren();
  document.getElementById('empty').hidden = tasks.length > 0;
  tasks.forEach(task => {
    const row = document.createElement('li');
    row.className = task.done ? 'task done' : 'task';
    const check = document.createElement('button');
    check.className = 'check';
    check.textContent = task.done ? '✓' : '';
    check.setAttribute('aria-label', task.done ? 'Отменить выполнение' : 'Выполнить');
    check.setAttribute('aria-pressed', task.done);
    check.onclick = () => setDone(task.id);
    const text = document.createElement('p');
    text.textContent = task.text;
    const edit = document.createElement('button');
    edit.className = 'edit';
    edit.textContent = '✎';
    edit.setAttribute('aria-label', 'Редактировать');
    edit.onclick = () => openModal(task.id);
    const remove = document.createElement('button');
    remove.className = 'delete';
    remove.textContent = '⊗';
    remove.setAttribute('aria-label', 'Удалить');
    remove.onclick = () => deleteItem(task.id);
    row.append(check, text, edit, remove);
    list.append(row);
  });
}

function storageInfo() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
  return { length: localStorage.length, keys };
}

function clearStorage() {
  if (!confirm('Удалить всё хранилище этого адреса, включая данные других приложений?')) return;
  localStorage.clear();
  tasks = [];
  closeModal();
  renderTodoList();
}

document.getElementById('add').onclick = () => openModal();
document.getElementById('back').onclick = closeModal;
document.getElementById('task-form').onsubmit = event => {
  event.preventDefault();
  createTask();
};
taskText.oninput = () => taskText.setCustomValidity('');
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeModal();
});
renderTodoList();
