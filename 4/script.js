const passages = [
  'Задача организации в особенности же рамки и место обучения кадров в значительной степени обуславливает создание направлений прогрессивного развития Таким образом постоянное информационное обеспечение нашей деятельности играет важную роль в формировании новых предложений С другой стороны постоянный количественный рост помогает оценивать результаты и выбирать дальнейший путь',
  'Утром город просыпается постепенно На улицах появляются первые прохожие и машины Солнце освещает окна домов а свежий ветер приносит прохладу Люди спешат на работу и учёбу Каждый день начинается с небольших планов которые со временем превращаются в большие дела и новые открытия',
  'Изучение программирования требует внимания и практики Простые задачи помогают понять основные правила языка После этого можно переходить к работе с данными и созданию собственных приложений Хороший результат складывается из понятного кода проверки ошибок и желания разобраться в том как работает каждая часть программы'
];
let mode = 'time';
let limit = 60;
let words = [];
let originalWords = [];
let passageIndex = -1;
let startedAt = null;
let timer = null;
let running = false;
const input = document.getElementById('input');
const text = document.getElementById('text');
const customLimit = document.getElementById('custom-limit');

function renderSettings() {
  document.querySelectorAll('[data-mode]').forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
  const values = mode === 'time' ? [15, 30, 60, 120] : [10, 25, 50, 100];
  const limits = document.getElementById('limits');
  limits.replaceChildren();
  values.forEach(value => {
    const button = document.createElement('button');
    button.textContent = value;
    button.classList.toggle('active', value === limit);
    button.onclick = () => changeSettings(mode, value);
    limits.append(button);
  });
  customLimit.max = mode === 'time' ? 600 : 1000;
}

function changeSettings(newMode, newLimit) {
  clearInterval(timer);
  mode = newMode;
  limit = newLimit;
  running = false;
  startedAt = null;
  input.value = '';
  document.getElementById('typing').hidden = true;
  document.getElementById('start').hidden = false;
  document.getElementById('result').hidden = true;
  document.getElementById('test').hidden = false;
  customLimit.value = '';
  renderSettings();
}

function makeWords(count) {
  const source = passages[passageIndex].split(' ');
  return Array.from({ length: count }, (_, index) => source[index % source.length]);
}

function newTest() {
  passageIndex = (passageIndex + 1) % passages.length;
  originalWords = makeWords(mode === 'words' ? limit : 200);
  restartTest();
}

function restartTest() {
  clearInterval(timer);
  words = [...originalWords];
  startedAt = null;
  running = true;
  input.value = '';
  input.disabled = false;
  document.getElementById('test').hidden = false;
  document.getElementById('result').hidden = true;
  document.getElementById('start').hidden = true;
  document.getElementById('typing').hidden = false;
  document.getElementById('hint').textContent = 'Тест начинается с первого введённого символа';
  text.scrollTop = 0;
  renderText();
  updateProgress();
  input.focus();
}

function parseInput(value) {
  const entries = [];
  let current = '';
  let leadingSpaces = '';
  for (const character of value) {
    if (character !== ' ') current += character;
    else if (current) {
      entries.push({ text: current, spaces: '' });
      current = '';
    } else if (entries.length) {
      entries[entries.length - 1].spaces += ' ';
    } else leadingSpaces += ' ';
  }
  return { entries, current, leadingSpaces };
}

function renderText() {
  const typed = parseInput(input.value);
  text.replaceChildren();
  if (typed.leadingSpaces) {
    const extra = document.createElement('span');
    extra.className = 'extra';
    extra.textContent = typed.leadingSpaces.replaceAll(' ', '·');
    text.append(extra);
  }
  words.forEach((word, index) => {
    const entry = typed.entries[index];
    const value = entry ? entry.text : index === typed.entries.length ? typed.current : '';
    const wrapper = document.createElement('span');
    wrapper.className = 'word';
    const hasWrongLetters = [...value].some((character, i) => character !== word[i]);
    if (hasWrongLetters || (entry && (entry.text !== word || entry.spaces))) wrapper.classList.add('invalid');
    const letters = Math.max(word.length, value.length);
    for (let i = 0; i < letters; i++) {
      const span = document.createElement('span');
      span.textContent = i < value.length ? value[i] : word[i];
      if (i < value.length) span.className = i >= word.length ? 'extra' : value[i] === word[i] ? 'correct' : 'wrong';
      else if (entry) span.className = 'wrong';
      if (index === typed.entries.length && i === value.length) span.classList.add('cursor');
      wrapper.append(span);
    }
    if (entry && entry.spaces) {
      const extra = document.createElement('span');
      extra.className = 'extra';
      extra.textContent = entry.spaces.replaceAll(' ', '·');
      wrapper.append(extra);
    }
    if (index === typed.entries.length && value.length >= word.length) {
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      cursor.textContent = '\u200b';
      wrapper.append(cursor);
    }
    text.append(wrapper);
  });
  const cursor = text.querySelector('.cursor');
  if (cursor) {
    const top = cursor.offsetTop - text.offsetTop;
    if (top < text.scrollTop || top > text.scrollTop + text.clientHeight - 40) text.scrollTop = Math.max(0, top - 60);
  }
}

function getStats() {
  const typed = parseInput(input.value);
  let correct = 0;
  let errors = typed.leadingSpaces.length;
  const values = [...typed.entries, { text: typed.current, spaces: '' }];
  values.forEach((entry, index) => {
    const word = words[index] || '';
    for (let i = 0; i < entry.text.length; i++) {
      if (entry.text[i] === word[i]) correct++;
      else errors++;
    }
    errors += entry.spaces.length;
    if (index < typed.entries.length) {
      correct++;
      errors += Math.max(0, word.length - entry.text.length);
    }
  });
  return { correct, errors, characters: input.value.length };
}

function updateProgress() {
  const elapsed = startedAt === null ? 0 : (performance.now() - startedAt) / 1000;
  const completed = parseInput(input.value).entries.length;
  document.getElementById('progress').textContent = mode === 'time' ? Math.max(0, limit - Math.floor(elapsed)) : completed + '/' + limit;
  if (running && mode === 'time' && elapsed >= limit) finishTest(limit);
}

function finishTest(seconds) {
  if (!running) return;
  running = false;
  clearInterval(timer);
  input.disabled = true;
  const stats = getStats();
  const total = stats.correct + stats.errors;
  document.getElementById('result-mode').textContent = (mode === 'time' ? 'время ' : 'слова ') + limit;
  document.getElementById('cpm').textContent = Math.round(stats.correct * 60 / Math.max(seconds, 0.1));
  document.getElementById('accuracy').textContent = (total ? Math.round(stats.correct / total * 100) : 0) + '%';
  document.getElementById('characters').textContent = stats.characters;
  document.getElementById('errors').textContent = stats.errors;
  document.getElementById('test').hidden = true;
  document.getElementById('result').hidden = false;
}

input.addEventListener('input', () => {
  if (!running) return;
  const now = performance.now();
  if (startedAt !== null && mode === 'time' && now - startedAt >= limit * 1000) {
    finishTest(limit);
    return;
  }
  input.value = input.value.replace(/[\r\n\t]/g, ' ');
  if (startedAt === null && input.value) {
    startedAt = now;
    timer = setInterval(updateProgress, 100);
    document.getElementById('hint').textContent = 'Ошибки можно исправлять клавишей Backspace';
  }
  const typed = parseInput(input.value);
  if (mode === 'time' && typed.entries.length >= words.length - 20) words.push(...makeWords(100));
  renderText();
  updateProgress();
  if (mode === 'words' && (typed.entries.length >= limit ||
      (typed.entries.length === limit - 1 && typed.current.length >= words[limit - 1].length))) {
    finishTest((performance.now() - startedAt) / 1000);
  }
});
input.addEventListener('paste', event => event.preventDefault());
text.onclick = () => input.focus();
document.getElementById('hint').onclick = () => input.focus();
document.querySelectorAll('[data-mode]').forEach(button => {
  button.onclick = () => changeSettings(button.dataset.mode, button.dataset.mode === 'time' ? 60 : 50);
});
customLimit.addEventListener('change', () => {
  const value = Number(customLimit.value);
  const maximum = mode === 'time' ? 600 : 1000;
  if (Number.isInteger(value) && value >= 1 && value <= maximum) {
    changeSettings(mode, value);
    customLimit.value = value;
  } else {
    customLimit.value = '';
    customLimit.placeholder = '1–' + maximum;
  }
});
document.getElementById('start').onclick = newTest;
document.getElementById('restart').onclick = restartTest;
document.getElementById('again').onclick = restartTest;
document.getElementById('next').onclick = newTest;
renderSettings();
