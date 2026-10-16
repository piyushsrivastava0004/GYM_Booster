import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Filter,
  TrendingDown,
  TrendingUp,
  Receipt,
  Building,
  Calendar,
  IndianRupee,
} from 'lucide-react';
import { expenseApi } from '../services/api';
import { Expense, ExpenseCategory, FinancialSummary } from '../types';
import { useAuth } from '../context/AuthContext';

export const ExpensesPage: React.FC = () => {
  const { currentBranch, isOwner, isAdmin, isAccountant } = useAuth();
  const canManage = isOwner || isAdmin || isAccountant;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [expenseForm, setExpenseForm] = useState({
    title: 'Monthly Facility Lease Rent',
    category: 'RENT' as ExpenseCategory,
    amount: 85000,
    paymentMethod: 'BANK_TRANSFER',
    paidTo: 'Indiranagar Commercial Properties Ltd',
    expenseDate: new Date().toISOString().split('T')[0],
    description: 'Ground & 1st floor lease payment for current month',
    taxDeducted: 0,
    branchId: currentBranch?.id || 1,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        size: 15,
        sort: 'expenseDate,desc',
      };
      if (categoryFilter) params.category = categoryFilter;
      if (currentBranch?.id) params.branchId = currentBranch.id;

      const [expRes, sumRes] = await Promise.all([
        expenseApi.getExpenses(params),
        expenseApi.getSummary(currentBranch?.id),
      ]);
      setExpenses(expRes.data.content || []);
      setTotalPages(expRes.data.totalPages || 1);
      setTotalElements(expRes.data.totalElements || 0);
      setSummary(sumRes.data);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, categoryFilter, currentBranch]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await expenseApi.recordExpense({
        ...expenseForm,
        amount: Number(expenseForm.amount),
        taxDeducted: Number(expenseForm.taxDeducted),
        branchId: currentBranch?.id || 1,
      });

      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record expense');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-emerald-600" />
            Operational Expenses & P&L
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track overhead costs (Rent, Salaries, Electricity, Repairs) and calculate Net Profit margin.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Record Expense
          </button>
        )}
      </div>

      {/* Financial Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Revenue
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 flex items-center">
              ₹{summary.totalRevenue?.toLocaleString('en-IN') || 0}
            </div>
            <span className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Membership & Services
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Expenses
            </span>
            <div className="text-2xl font-black text-rose-600 mt-1 flex items-center">
              ₹{summary.totalExpenses?.toLocaleString('en-IN') || 0}
            </div>
            <span className="text-xs text-rose-600 mt-1 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              Operating Overheads
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Net Profit
            </span>
            <div
              className={`text-2xl font-black mt-1 ${
                summary.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              ₹{summary.netProfit?.toLocaleString('en-IN') || 0}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Revenue minus Expenses</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Profit Margin
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {summary.profitMarginPercent?.toFixed(1) || 0}%
            </div>
            <span className="text-xs text-emerald-600 mt-1 block">Operating healthy</span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Expense Ledger ({totalElements} entries)</span>

        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Categories</option>
            <option value="RENT">Rent & Lease</option>
            <option value="UTILITIES">Utilities (Electricity, Water)</option>
            <option value="SALARIES">Staff Salaries</option>
            <option value="REPAIRS">Repairs & Maintenance</option>
            <option value="EQUIPMENT_PURCHASE">Equipment Purchase</option>
            <option value="MARKETING">Marketing & Advertising</option>
            <option value="MISCELLANEOUS">Miscellaneous</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
            <tr>
              <th className="px-6 py-3.5">Expense Title</th>
              <th className="px-6 py-3.5">Category</th>
              <th className="px-6 py-3.5">Date</th>
              <th className="px-6 py-3.5">Paid To (Vendor)</th>
              <th className="px-6 py-3.5">Method</th>
              <th className="px-6 py-3.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
                  <p>Loading expenses...</p>
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  No expense records found.
                </td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{exp.title}</div>
                    <div className="text-xs text-slate-500">{exp.description}</div>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">
                    {new Date(exp.expenseDate).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-800 font-medium">{exp.paidTo}</td>
                  <td className="px-6 py-4 text-xs text-slate-600">{exp.paymentMethod}</td>
                  <td className="px-6 py-4 text-right font-bold text-rose-600">
                    ₹{exp.amount?.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page {page + 1} of {totalPages}
            </span>
            <div className="space-x-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 bg-white border border-slate-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-white border border-slate-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Record Operational Expense</h3>
            <form onSubmit={handleCreateExpense} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseCategory })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    <option value="RENT">Rent & Lease</option>
                    <option value="UTILITIES">Utilities</option>
                    <option value="SALARIES">Staff Salaries</option>
                    <option value="REPAIRS">Repairs & Maintenance</option>
                    <option value="EQUIPMENT_PURCHASE">Equipment Purchase</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="MISCELLANEOUS">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-rose-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Paid To (Vendor) *</label>
                  <input
                    type="text"
                    required
                    value={expenseForm.paidTo}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    <option value="BANK_TRANSFER">Bank IMPS / NEFT</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Credit / Debit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Date</label>
                <input
                  type="date"
                  required
                  value={expenseForm.expenseDate}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
