import { FaPesoSign } from "react-icons/fa6";
import { useState, useEffect } from "react";

const STORAGE_KEY = "finance-transactions";

export default function DashBoard() {
  const [modal, setOpenModal] = useState(false);
  const [transactions, setTransactions] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [categories, setCategories] = useState([
    "Food",
    "Bills",
    "Transportation",
    "Savings",
    "Shopping",
  ]);

  const [customCategory, setCustomCategory] = useState("");
  const [filterTime, setFilterTime] = useState("all");
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    type: "income",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    category: "Savings",
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = () => {
    setOpenModal(!modal);
    if (!modal) {
      setFormData({
        type: "income",
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        category: "Savings",
      });
      setEditingId(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveTransaction = () => {
    if (!formData.description.trim() || !formData.amount) return;

    if (editingId) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? {
                ...t,
                type: formData.type,
                description: formData.description.trim(),
                amount: parseFloat(formData.amount),
                date: formData.date,
                category: formData.category,
              }
            : t,
        ),
      );
      setEditingId(null);
    } else {
      const transaction = {
        id: Date.now(),
        type: formData.type,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        date: formData.date,
        category: formData.category,
        createdAt: Date.now(),
      };
      setTransactions((prev) => [...prev, transaction]);
    }

    setFormData({
      type: "income",
      description: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      category: "Savings",
    });
    setOpenModal(false);
  };

  const deleteTransaction = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const editTransaction = (transaction) => {
    setFormData({
      type: transaction.type,
      description: transaction.description,
      amount: transaction.amount.toString(),
      date: transaction.date,
      category: transaction.category,
    });
    setEditingId(transaction.id);
    setOpenModal(true);
  };

  const addCustomCategory = () => {
    if (customCategory.trim() && !categories.includes(customCategory.trim())) {
      setCategories((prev) => [...prev, customCategory.trim()]);
      setCustomCategory("");
    }
  };

  const clearAllData = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all data? This action cannot be undone.",
      )
    ) {
      setTransactions([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const expenses = transactions
    .filter((item) => item.type === "expenses")
    .reduce((sum, item) => sum + item.amount, 0);

  const balance = income - expenses;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthIncome = transactions
    .filter((item) => {
      const itemDate = new Date(item.date);
      return (
        item.type === "income" &&
        itemDate.getMonth() === currentMonth &&
        itemDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, item) => sum + item.amount, 0);

  const thisMonthExpenses = transactions
    .filter((item) => {
      const itemDate = new Date(item.date);
      return (
        item.type === "expenses" &&
        itemDate.getMonth() === currentMonth &&
        itemDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, item) => sum + item.amount, 0);

  const categoryTotals = transactions
    .filter((item) => {
      const itemDate = new Date(item.date);
      return (
        item.type === "expenses" &&
        itemDate.getMonth() === currentMonth &&
        itemDate.getFullYear() === currentYear
      );
    })
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});

  const topCategory =
    Object.keys(categoryTotals).length > 0
      ? Object.keys(categoryTotals).reduce((a, b) =>
          categoryTotals[a] > categoryTotals[b] ? a : b,
        )
      : "—";

  const thisMonthExpenseTransactions = transactions.filter((item) => {
    const itemDate = new Date(item.date);
    return (
      item.type === "expenses" &&
      itemDate.getMonth() === currentMonth &&
      itemDate.getFullYear() === currentYear
    );
  });

  const highestExpense =
    thisMonthExpenseTransactions.length > 0
      ? Math.max(...thisMonthExpenseTransactions.map((t) => t.amount))
      : 0;

  const filteredTransactions = transactions.filter((t) => {
    if (filterTime === "all") return true;
    const itemDate = new Date(t.date);
    if (filterTime === "month") {
      return (
        itemDate.getMonth() === currentMonth &&
        itemDate.getFullYear() === currentYear
      );
    }
    if (filterTime === "year") {
      return itemDate.getFullYear() === currentYear;
    }
    return true;
  });

  const recentTransactions = [...transactions]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0a1929] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Personal Finance Dashboard</h1>
        <p className="text-gray-400 mb-8">Track income, expenses, budgets</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#132f4c] rounded-lg p-6">
              <h3 className="text-gray-400 text-sm mb-2">Current Balance</h3>
              <h2 className="text-4xl font-bold mb-6 flex items-center">
                <FaPesoSign className="text-3xl" />
                {balance.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#1e4976] rounded-lg p-4">
                  <h4 className="text-gray-300 text-sm mb-1">Income</h4>
                  <p className="text-xl font-semibold flex items-center">
                    <FaPesoSign className="text-base" />
                    {income.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="bg-[#1e4976] rounded-lg p-4">
                  <h4 className="text-gray-300 text-sm mb-1">Expenses</h4>
                  <p className="text-xl font-semibold flex items-center">
                    <FaPesoSign className="text-base" />
                    {expenses.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <label className="text-gray-400 text-sm block mb-2">
                  Quick add transaction
                </label>
                <button
                  onClick={addTransaction}
                  className="bg-[#2e7d32] hover:bg-[#3d9142] text-white 
                            font-semibold py-2 px-4 rounded transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>
            <div className="bg-[#132f4c] rounded-lg p-6">
              <h3 className="text-gray-400 text-sm mb-4">Recent</h3>
              <div className="space-y-3">
                {recentTransactions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No transactions yet</p>
                ) : (
                  recentTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <p className="text-sm text-gray-400">{t.category}</p>
                        <p className="font-semibold">{t.description}</p>
                        <p className="text-xs text-gray-500">{t.date}</p>
                      </div>
                      <p className="text-lg font-bold flex items-center">
                        <FaPesoSign className="text-base" />
                        {t.amount.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#132f4c] rounded-lg p-6">
              <h3 className="text-gray-400 text-sm mb-4">Categories</h3>
              <div className="space-y-2 mb-4">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    className="text-white hover:text-gray-300 cursor-pointer 
                              transition-colors"
                  >
                    {cat}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addCustomCategory()}
                  placeholder="+ custom category"
                  className="flex-1 bg-[#1e4976] text-white px-3 py-2 rounded border
                           border-gray-600 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={addCustomCategory}
                  className="bg-[#1e4976] hover:bg-[#2a5a8f] px-4 py-2 rounded 
                            transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#132f4c] rounded-lg p-4">
                <h4 className="text-gray-400 text-sm mb-1">
                  This month — Income
                </h4>
                <p className="text-2xl font-bold flex items-center">
                  <FaPesoSign className="text-xl" />
                  {thisMonthIncome.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="bg-[#132f4c] rounded-lg p-4">
                <h4 className="text-gray-400 text-sm mb-1">
                  This month — Expenses
                </h4>
                <p className="text-2xl font-bold flex items-center">
                  <FaPesoSign className="text-xl" />
                  {thisMonthExpenses.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="bg-[#132f4c] rounded-lg p-4">
                <h4 className="text-gray-400 text-sm mb-1">
                  Top category (month)
                </h4>
                <p className="text-2xl font-bold">{topCategory}</p>
              </div>
              <div className="bg-[#132f4c] rounded-lg p-4">
                <h4 className="text-gray-400 text-sm mb-1">
                  Highest single expense
                </h4>
                <p className="text-2xl font-bold flex items-center">
                  <FaPesoSign className="text-xl" />
                  {highestExpense.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={clearAllData}
                className="bg-[#d32f2f] hover:bg-[#f44336] text-white px-4 
                            py-2 rounded transition-colors"
              >
                Clear All Data
              </button>
              <p className="text-gray-400 text-sm ml-4 self-center">
                This clears local app data after confirmation.
              </p>
            </div>

            <div className="bg-[#132f4c] rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">Transactions</h3>
                  <p className="text-gray-400 text-sm">All Entries</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mr-2">Filter</label>
                  <select
                    value={filterTime}
                    onChange={(e) => setFilterTime(e.target.value)}
                    className="bg-[#1e4976] text-white px-4 py-2 rounded border
                             border-gray-600 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All time</option>
                    <option value="month">This month</option>
                    <option value="year">This year</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredTransactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No transactions found
                  </p>
                ) : (
                  filteredTransactions
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="flex justify-between items-center bg-[#1e4976] p-4 
                                    rounded-lg hover:bg-[#2a5a8f] transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <p className="text-gray-400 w-24">{t.category}</p>
                          <div>
                            <p className="font-semibold">{t.description}</p>
                            <p className="text-xs text-gray-400">{t.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-2xl font-bold flex items-center">
                            <FaPesoSign className="text-xl" />
                            {t.amount.toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <button
                            onClick={() => editTransaction(t)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteTransaction(t.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            onClick={addTransaction}
            className="absolute inset-0 bg-black bg-opacity-70"
          ></div>
          <div className="relative bg-[#1e4976] rounded-lg p-8 w-full max-w-md z-10">
            <h2 className="text-2xl font-bold mb-6">
              {editingId ? "Edit Transaction" : "Add Transaction"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full bg-[#132f4c] text-white px-4 py-2 rounded border
                           border-gray-600 focus:outline-none focus:border-blue-500"
                >
                  <option value="income">Income</option>
                  <option value="expenses">Expenses</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">Description</label>
                <input
                  type="text"
                  name="description"
                  placeholder="e.g. Groceries"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-[#132f4c] text-white px-4 py-2 rounded border
                           border-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full bg-[#132f4c] text-white px-4 py-2 rounded border
                             border-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full bg-[#132f4c] text-white px-4 py-2 rounded border
                             border-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-[#132f4c] text-white px-4 py-2 rounded border
                           border-gray-600 focus:outline-none focus:border-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={addTransaction}
                className="px-6 py-2 rounded border border-gray-600 hover:bg-[#132f4c] 
                          transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveTransaction}
                className="px-6 py-2 rounded bg-[#2e7d32] hover:bg-[#3d9142] 
                          transition-colors"
              >
                {editingId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
