import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  FileText,
  Download,
  IndianRupee,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Building,
} from 'lucide-react';
import { paymentsApi, membersApi } from '../services/api';
import { Payment, Invoice, PaymentMethod, PaymentStatus, Member } from '../types';
import { useAuth } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';

export const BillingPage: React.FC = () => {
  const { currentBranch, isMember } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Modals
  const [showRecordModal, setShowRecordModal] = useState<boolean>(false);
  const [showRefundModal, setShowRefundModal] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Refund Form
  const [refundData, setRefundData] = useState({
    originalPaymentId: 0,
    refundAmount: 0,
    reason: 'Customer request within cancellation window',
  });

  // Record Payment Form
  const [searchMemberQuery, setSearchMemberQuery] = useState<string>('');
  const [foundMember, setFoundMember] = useState<Member | null>(null);
  const [lookupError, setLookupError] = useState<string>('');
  const [payFormData, setPayFormData] = useState({
    amount: 2360,
    paymentMethod: 'UPI' as PaymentMethod,
    taxAmount: 360,
    discountAmount: 0,
    notes: 'Gym facility fee & membership renewal',
  });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        size: 15,
        sort: 'paymentDate,desc',
      };
      if (methodFilter) params.paymentMethod = methodFilter;
      if (statusFilter) params.status = statusFilter;
      if (currentBranch?.id) params.branchId = currentBranch.id;

      const res = await paymentsApi.getPayments(params);
      setPayments(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, methodFilter, statusFilter, currentBranch]);

  const handleMemberLookup = async () => {
    setLookupError('');
    setFoundMember(null);
    if (!searchMemberQuery.trim()) return;

    try {
      const res = await membersApi.lookup(searchMemberQuery.trim());
      setFoundMember(res.data);
    } catch (err) {
      setLookupError('No member found with this code or phone number.');
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundMember) {
      alert('Please look up and select an active gym member first.');
      return;
    }

    try {
      await paymentsApi.record({
        memberId: foundMember.id,
        branchId: currentBranch?.id || foundMember.branchId || 1,
        amount: Number(payFormData.amount),
        taxAmount: Number(payFormData.taxAmount),
        discountAmount: Number(payFormData.discountAmount),
        paymentMethod: payFormData.paymentMethod,
        notes: payFormData.notes,
      });

      setShowRecordModal(false);
      setFoundMember(null);
      setSearchMemberQuery('');
      fetchPayments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentsApi.processRefund({
        paymentId: refundData.originalPaymentId,
        refundAmount: Number(refundData.refundAmount),
        reason: refundData.reason,
      });

      setShowRefundModal(false);
      fetchPayments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process refund');
    }
  };

  const totalCollected = payments
    .filter((p) => p.paymentStatus === 'PAID')
    .reduce((acc, p) => acc + (p.netAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-emerald-600" />
            Billing, Invoices & Collections
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Point-of-Sale billing, Indian GST (18%) compliant tax invoices, UPI/Card/Cash ledger, and refunds.
          </p>
        </div>

        {!isMember && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRecordModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Record POS Payment
            </button>
          </div>
        )}
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Page Collections
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{totalCollected.toLocaleString('en-IN')}</div>
          <span className="text-xs text-emerald-600 mt-1 block">Successfully reconciled</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Ledger Transactions
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalElements} Records</div>
          <span className="text-xs text-slate-500 mt-1 block">Includes Cash, UPI & Razorpay</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Active GSTIN Rate
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">18.00% GST</div>
          <span className="text-xs text-slate-500 mt-1 block">9% CGST + 9% SGST</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filters:</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Payment Modes</option>
            <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Credit / Debit Card</option>
            <option value="BANK_TRANSFER">Bank IMPS / NEFT</option>
            <option value="RAZORPAY">Razorpay Gateway</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
              <tr>
                <th className="px-6 py-3.5">Transaction ID</th>
                <th className="px-6 py-3.5">Member Details</th>
                <th className="px-6 py-3.5">Date & Time</th>
                <th className="px-6 py-3.5">Method</th>
                <th className="px-6 py-3.5">Net Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Tax Invoice</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
                    <p>Loading transactions...</p>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No transactions found matching criteria.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-800">
                      {p.transactionId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{p.memberName}</div>
                      <span className="font-mono text-xs text-emerald-700">{p.memberCode}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {new Date(p.paymentDate).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">₹{p.netAmount}</div>
                      <div className="text-[11px] text-slate-400">Tax: ₹{p.taxAmount || 0}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          p.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.paymentStatus === 'REFUNDED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-emerald-700">
                      {p.invoiceNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {p.paymentStatus === 'PAID' && !isMember && (
                        <button
                          onClick={() => {
                            setRefundData({
                              originalPaymentId: p.id,
                              refundAmount: p.netAmount,
                              reason: 'Customer refund request',
                            });
                            setShowRefundModal(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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

      {/* Record POS Payment Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">Record Point-of-Sale (POS) Payment</h3>
              <button onClick={() => setShowRecordModal(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            {/* Step 1: Member Lookup */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Member Search *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Member Code or Phone number..."
                  value={searchMemberQuery}
                  onChange={(e) => setSearchMemberQuery(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleMemberLookup}
                  className="px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
                >
                  Lookup
                </button>
              </div>
              {lookupError && <p className="text-xs text-rose-600">{lookupError}</p>}
              {foundMember && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex justify-between items-center">
                  <div>
                    <span className="font-bold">{foundMember.fullName}</span> ({foundMember.memberCode})
                  </div>
                  <span className="font-bold">{foundMember.phone}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-sm pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Bill (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={payFormData.amount}
                    onChange={(e) => {
                      const amt = Number(e.target.value);
                      const tax = (amt * 18) / 118; // 18% inclusive
                      setPayFormData({ ...payFormData, amount: amt, taxAmount: Math.round(tax) });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={payFormData.paymentMethod}
                    onChange={(e) =>
                      setPayFormData({ ...payFormData, paymentMethod: e.target.value as PaymentMethod })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="UPI">UPI / QR (Instant)</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="BANK_TRANSFER">Bank IMPS / NEFT</option>
                    <option value="RAZORPAY">Razorpay</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST Component (18%)</label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
                    ₹{payFormData.taxAmount} (9% CGST + 9% SGST)
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Applied (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={payFormData.discountAmount}
                    onChange={(e) =>
                      setPayFormData({ ...payFormData, discountAmount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Notes</label>
                <input
                  type="text"
                  value={payFormData.notes}
                  onChange={(e) => setPayFormData({ ...payFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!foundMember}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                  Record & Generate Tax Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Process Transaction Refund</h3>
            <form onSubmit={handleRefundSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Refund Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={refundData.refundAmount}
                  onChange={(e) => setRefundData({ ...refundData, refundAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-rose-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Refund Justification *</label>
                <textarea
                  required
                  rows={3}
                  value={refundData.reason}
                  onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg"
                >
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tax Invoice Modal */}
      {selectedInvoice && (
        <ReceiptModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
    </div>
  );
};
