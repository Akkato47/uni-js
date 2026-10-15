(function () {
  "use strict";

  var current = "0";
  var previous = null;
  var operator = null;
  var waiting = false;
  var memory = null;

  var displayEl = document.getElementById("display");
  var MEM_KEY = "calc.memory";

  function loadMemory() {
    var raw = localStorage.getItem(MEM_KEY);
    memory = raw === null ? null : parseFloat(raw);
    if (memory !== null && isNaN(memory)) memory = null;
  }

  function saveMemory() {
    if (memory === null) localStorage.removeItem(MEM_KEY);
    else localStorage.setItem(MEM_KEY, String(memory));
  }

  function render() {
    displayEl.textContent = current.replace(".", ",");
    displayEl.classList.toggle("mem", memory !== null);
  }

  function toNumber(str) {
    return parseFloat(str.replace(",", "."));
  }

  function fromNumber(n) {
    if (!isFinite(n)) return "Ошибка";
    var r = Math.round((n + Number.EPSILON) * 1e10) / 1e10;
    return String(r);
  }

  function inputDigit(d) {
    if (current === "Ошибка") current = "0";
    if (waiting) {
      current = d;
      waiting = false;
    } else {
      current = current === "0" ? d : current + d;
    }
    render();
  }

  function inputDot() {
    if (current === "Ошибка") current = "0";
    if (waiting) {
      current = "0.";
      waiting = false;
    } else if (current.indexOf(".") === -1) {
      current += ".";
    }
    render();
  }

  function compute(a, b, op) {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b === 0 ? Infinity : a / b;
      case "%": return a % b;
    }
    return b;
  }

  function highlightOp(op) {
    var buttons = document.querySelectorAll(".op");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle("active", buttons[i].getAttribute("data-op") === op);
    }
  }

  function chooseOperator(op) {
    if (current === "Ошибка") return;
    var value = toNumber(current);

    if (operator !== null && !waiting) {
      previous = compute(previous, value, operator);
      current = fromNumber(previous);
    } else {
      previous = value;
    }

    operator = op;
    waiting = true;
    highlightOp(op);
    render();
  }

  function equals() {
    if (operator === null || previous === null) return;
    var value = toNumber(current);
    var result = compute(previous, value, operator);
    current = fromNumber(result);
    previous = null;
    operator = null;
    waiting = true;
    highlightOp(null);
    render();
  }

  function clearAll() {
    current = "0";
    previous = null;
    operator = null;
    waiting = false;
    highlightOp(null);
    render();
  }

  function memorySave() {
    memory = toNumber(current);
    saveMemory();
    render();
  }

  function memoryClear() {
    memory = null;
    saveMemory();
    render();
  }

  function memoryRead() {
    if (memory === null) return;
    current = fromNumber(memory);
    waiting = true;
    render();
  }

  function memoryPlus() {
    memory = (memory === null ? 0 : memory) + toNumber(current);
    saveMemory();
    render();
  }

  function memoryMinus() {
    memory = (memory === null ? 0 : memory) - toNumber(current);
    saveMemory();
    render();
  }

  document.querySelector(".grid").addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn) return;

    if (btn.dataset.num !== undefined) return inputDigit(btn.dataset.num);
    if (btn.dataset.op !== undefined) return chooseOperator(btn.dataset.op);

    switch (btn.dataset.action) {
      case "dot": return inputDot();
      case "equals": return equals();
      case "clear": return clearAll();
    }

    switch (btn.dataset.mem) {
      case "MS": return memorySave();
      case "MC": return memoryClear();
      case "MR": return memoryRead();
      case "M+": return memoryPlus();
      case "M-": return memoryMinus();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key >= "0" && e.key <= "9") return inputDigit(e.key);
    if (e.key === "." || e.key === ",") return inputDot();
    if (e.key === "+" || e.key === "-" || e.key === "*" || e.key === "/" || e.key === "%") return chooseOperator(e.key);
    if (e.key === "Enter" || e.key === "=") { e.preventDefault(); return equals(); }
    if (e.key === "Escape") return clearAll();
  });

  loadMemory();
  render();
})();
