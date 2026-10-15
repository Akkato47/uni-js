let selected = ['RUB', 'USD'];
let activeField = 0;
let choosingField = 0;
let amounts = ['9261', '100'];
let sourceField = 0;
const converter = document.getElementById('converter');
const selector = document.getElementById('selector');
const search = document.getElementById('search');
let lastQuery = null;

function getCurrency(code) {
  return currencies.find(currency => currency.CharCode === code);
}

function convert(amount, from, to) {
  return amount * (from.Value / from.Nominal) / (to.Value / to.Nominal);
}

function getOtherValue() {
  const value = Number(amounts[sourceField].replace(',', '.') || 0);
  return convert(value, getCurrency(selected[sourceField]), getCurrency(selected[1 - sourceField]));
}

function formatValue(value) {
  return value.toFixed(2).replace(/\.?0+$/, '').replace('.', ',') || '0';
}

function render() {
  amounts[1 - sourceField] = formatValue(getOtherValue());
  selected.forEach((code, index) => {
    const currency = getCurrency(code);
    document.getElementById('code-' + index).textContent = code;
    document.getElementById('name-' + index).textContent = currency.Name;
    const amount = document.getElementById('amount-' + index);
    amount.textContent = amounts[index] + currency.Symbol;
    amount.classList.toggle('active', index === activeField);
  });
}

function selectField(index) {
  activeField = index;
  render();
}

function inputKey(key) {
  let value = amounts[activeField];
  if (key === 'AC') value = '';
  else if (key === 'back') value = value.slice(0, -1);
  else if (key === ',') {
    if (!value.includes(',')) value = (value || '0') + ',';
  } else if (value.length < 14) {
    const fraction = value.split(',')[1];
    if (fraction && fraction.length >= 2) return;
    value = value === '0' ? key : value + key;
  }
  if (value !== amounts[activeField]) {
    amounts[activeField] = value;
    sourceField = activeField;
  }
  render();
}

function renderCurrencies() {
  const query = search.value.trim().toLowerCase();
  const filtered = currencies.filter(currency =>
    currency.CharCode.toLowerCase().includes(query) || currency.Name.toLowerCase().includes(query));
  if (query === lastQuery) return;
  lastQuery = query;
  const list = document.getElementById('currencies');
  list.replaceChildren();
  filtered.forEach(currency => {
    const button = document.createElement('button');
    button.className = 'option';
    const label = document.createElement('span');
    const code = document.createElement('b');
    const name = document.createElement('small');
    code.textContent = currency.CharCode;
    name.textContent = currency.Name;
    label.append(code, name);
    const tick = document.createElement('span');
    tick.className = 'tick';
    tick.textContent = selected.includes(currency.CharCode) ? '✓' : '';
    button.append(label, tick);
    button.onclick = () => {
      selected[choosingField] = currency.CharCode;
      closeSelector();
      render();
    };
    list.append(button);
  });
  if (!filtered.length) list.textContent = 'Валюта не найдена';
}

function closeSelector() {
  selector.hidden = true;
  converter.hidden = false;
}

document.querySelectorAll('.currency').forEach(button => {
  button.onclick = () => {
    choosingField = Number(button.dataset.field);
    converter.hidden = true;
    selector.hidden = false;
    search.value = '';
    lastQuery = null;
    renderCurrencies();
    search.focus();
  };
});
[0, 1].forEach(index => document.getElementById('amount-' + index).onclick = () => selectField(index));
document.querySelectorAll('[data-key]').forEach(button => button.onclick = () => inputKey(button.dataset.key));
document.getElementById('back').onclick = closeSelector;
search.addEventListener('input', renderCurrencies);
search.addEventListener('change', renderCurrencies);
document.addEventListener('keydown', event => {
  if (!selector.hidden) {
    if (event.key === 'Escape') closeSelector();
    return;
  }
  if (/^[0-9]$/.test(event.key)) inputKey(event.key);
  else if (event.key === '.' || event.key === ',') inputKey(',');
  else if (event.key === 'Backspace') { event.preventDefault(); inputKey('back'); }
  else if (event.key === 'Escape' || event.key === 'Delete') inputKey('AC');
});
render();
