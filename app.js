// ---------- Data layer ----------
const STORAGE_KEY = "pf_dashboard_v1";
const defaultCategories = [
  "Food",
  "Bills",
  "Transportation",
  "Savings",
  "Shopping",
];

let state = {
  categories: [...defaultCategories],
  transactions: [],
};

try {
  localStorage.removeItem(STORAGE_KEY);
} catch (e) {
  console.warn("Could not clear storage:", e);
}

// ---------- Load / Save ----------
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge parsed into default state safely
      if (parsed.categories && Array.isArray(parsed.categories)) {
        state.categories = parsed.categories;
      }
      if (parsed.transactions && Array.isArray(parsed.transactions)) {
        state.transactions = parsed.transactions;
      }
    }
  } catch (e) {
    console.error(e);
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Could not save state:", e);
  }
}

// ---------- Utilities ----------
function fmt(v) {
  const n = Number(v) || 0;
  return (
    "₱" +
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ---------- DOM Elements ----------
const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("totalIncome");
const expenseEl = document.getElementById("totalExpense");
const recentList = document.getElementById("recentList");
const txList = document.getElementById("txList");
const categoriesEl = document.getElementById("categories");
const catSelect = document.getElementById("catSelect");
const filterMonth = document.getElementById("filterMonth");

// analytics elements
const monthIncomeEl = document.getElementById("monthIncome");
const monthExpenseEl = document.getElementById("monthExpense");
const topCategoryEl = document.getElementById("topCategory");
const highestExpenseEl = document.getElementById("highestExpense");

const clearDataBtn = document.getElementById("clearData");

const modalWrap = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const openAdd = document.getElementById("openAdd");
const cancelBtn = document.getElementById("cancel");
const saveTx = document.getElementById("saveTx");

const typeInput = document.getElementById("type");
const descInput = document.getElementById("desc");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const newCatInput = document.getElementById("newCat");
const addCatBtn = document.getElementById("addCat");

// ---------- Rendering ----------
function renderCategories() {
  categoriesEl.innerHTML = "";
  catSelect.innerHTML = "";
  state.categories.forEach((c) => {
    const b = document.createElement("div");
    b.className = "chip";
    b.textContent = c;
    categoriesEl.appendChild(b);

    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    catSelect.appendChild(opt);
  });
}

function renderSummary() {
  const income = state.transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const expense = state.transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  balanceEl.textContent = fmt(income - expense);
  incomeEl.textContent = fmt(income);
  expenseEl.textContent = fmt(expense);
}

function renderRecent() {
  recentList.innerHTML = "";
  const recent = [...state.transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);
  recent.forEach((t) => {
    const el = document.createElement("div");
    el.className = "tx";
    el.innerHTML = `
      <div class="left">
        <div class="chip">${t.category}</div>
        <div>
          <div style="font-weight:600">${t.description || t.category}</div>
          <div class="small">${t.date}</div>
        </div>
      </div>
      <div class="amount ${t.type === "income" ? "income" : ""}">${
      t.type === "expense" ? "-" + fmt(t.amount) : fmt(t.amount)
    }</div>
    `;
    recentList.appendChild(el);
  });
}

function renderTransactions(filter = "all") {
  txList.innerHTML = "";
  let list = [...state.transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  if (filter !== "all") {
    list = list.filter((t) => t.month === filter);
  }

  if (list.length === 0) {
    txList.innerHTML = `<div class="small" style="padding:12px;color:var(--muted)">No transactions yet.</div>`;
    return;
  }

  list.forEach((t) => {
    const el = document.createElement("div");
    el.className = "tx";
    el.innerHTML = `
      <div class="left">
        <div class="chip">${t.category}</div>
        <div>
          <div style="font-weight:600">${t.description || t.category}</div>
          <div class="small">${t.date}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end">
        <div class="amount">${
          t.type === "expense" ? "-" + fmt(t.amount) : fmt(t.amount)
        }</div>
        <div class="actions">
          <button class="link" data-id="${
            t.id
          }" data-action="edit">Edit</button>
          <button class="link" data-id="${
            t.id
          }" data-action="delete">Delete</button>
        </div>
      </div>
    `;
    txList.appendChild(el);
  });
}

function populateMonthFilter() {
  const months = Array.from(new Set(state.transactions.map((t) => t.month)))
    .sort()
    .reverse();
  filterMonth.innerHTML =
    '<option value="all">All time</option>' +
    months.map((m) => `<option value="${m}">${m}</option>`).join("");
}

// ---------- Update Analytics Summary ----------
function updateAnalytics() {
  const now = new Date();
  const mkey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}`;

  // This month's totals
  const monthIncome = state.transactions
    .filter((t) => t.type === "income" && t.month === mkey)
    .reduce((s, t) => s + Number(t.amount), 0);
  const monthExpense = state.transactions
    .filter((t) => t.type === "expense" && t.month === mkey)
    .reduce((s, t) => s + Number(t.amount), 0);

  // Top category (by expense) in current month
  const catAgg = {};
  state.transactions
    .filter((t) => t.type === "expense" && t.month === mkey)
    .forEach((t) => {
      catAgg[t.category] = (catAgg[t.category] || 0) + Number(t.amount);
    });
  const topCategory =
    Object.keys(catAgg).length === 0
      ? "—"
      : Object.entries(catAgg).sort((a, b) => b[1] - a[1])[0][0];

  // Highest single expense overall
  const highestExpenseTx = state.transactions
    .filter((t) => t.type === "expense")
    .sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  const highestExpense = highestExpenseTx ? Number(highestExpenseTx.amount) : 0;

  // Render
  monthIncomeEl.textContent = fmt(monthIncome);
  monthExpenseEl.textContent = fmt(monthExpense);
  topCategoryEl.textContent = topCategory;
  highestExpenseEl.textContent = fmt(highestExpense);
}

// ---------- Modal CRUD ----------
let editingId = null;

function openModal(editId = null) {
  editingId = editId;
  if (editId) {
    const tx = state.transactions.find((t) => t.id === editId);
    modalTitle.textContent = "Edit Transaction";
    typeInput.value = tx.type;
    descInput.value = tx.description;
    amountInput.value = tx.amount;
    dateInput.value = tx.date;
    catSelect.value = tx.category;
  } else {
    modalTitle.textContent = "Add Transaction";
    typeInput.value = "expense";
    descInput.value = "";
    amountInput.value = "";
    dateInput.value = new Date().toISOString().slice(0, 10);
    catSelect.selectedIndex = 0;
  }
  modalWrap.style.display = "flex";
}

function closeModal() {
  modalWrap.style.display = "none";
  editingId = null;
}

saveTx.addEventListener("click", () => {
  const tx = {
    id: editingId || uid(),
    type: typeInput.value,
    description: descInput.value.trim(),
    amount: parseFloat(amountInput.value || 0),
    date: dateInput.value,
    category: catSelect.value,
  };
  const d = new Date(tx.date);
  tx.month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  if (editingId) {
    const idx = state.transactions.findIndex((t) => t.id === editingId);
    if (idx > -1) state.transactions[idx] = tx;
  } else {
    state.transactions.push(tx);
  }
  save();
  renderAll();
  closeModal();
});

cancelBtn.addEventListener("click", closeModal);
openAdd.addEventListener("click", () => openModal());

txList.addEventListener("click", (e) => {
  if (e.target.matches("button")) {
    const id = e.target.dataset.id;
    const action = e.target.dataset.action;
    if (action === "edit") {
      openModal(id);
    }
    if (action === "delete") {
      if (confirm("Delete this transaction?")) {
        state.transactions = state.transactions.filter((t) => t.id !== id);
        save();
        renderAll();
      }
    }
  }
});

addCatBtn.addEventListener("click", () => {
  const v = newCatInput.value.trim();
  if (!v) return;
  if (!state.categories.includes(v)) {
    state.categories.push(v);
    save();
    renderAll();
    newCatInput.value = "";
  }
});

filterMonth.addEventListener("change", () => {
  renderTransactions(filterMonth.value);
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
  }
});

// ---------- Clear All Data button ----------
clearDataBtn.addEventListener("click", () => {
  const confirmed = confirm(
    "Clear ALL saved data for Personal Finance Dashboard? This cannot be undone."
  );
  if (!confirmed) return;

  // Reset in-memory state
  state = {
    categories: [...defaultCategories],
    transactions: [],
  };

  // Remove storage key
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("Could not remove storage key:", e);
  }

  // Re-render clean UI
  save(); // save the fresh state
  renderAll();
});

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "e") {
    navigator.clipboard.writeText(localStorage.getItem(STORAGE_KEY) || "{}");
    alert("Exported JSON to clipboard");
  }
});

function renderAll() {
  renderCategories();
  renderSummary();
  renderRecent();
  populateMonthFilter();
  renderTransactions(filterMonth.value || "all");
  updateAnalytics();
}

load();
renderAll();
