import React, { useState, useEffect } from 'react';
import {
  Clock,
  QrCode,
  UserCheck,
  UserX,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  LogOut,
  Building,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { attendanceApi, membersApi } from '../services/api';
import { Attendance, AttendanceStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import QrScannerModal from '../components/QrScannerModal';

export const AttendancePage: React.FC = () => {
  const { currentBranch, isMember } = useAuth();

  const [logs, setLogs] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // QR Modal
  const [showScanner, setShowScanner] = useState<boolean>(false);

  // Manual Check-In & Override states
  const [quickCredential, setQuickCredential] = useState<string>('');
  const [checkInMsg, setCheckInMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [overrideData, setOverrideData] = useState({
    memberCode: '',
    reason: 'Managerial approval for forgotten card',
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        size: 15,
        sort: 'checkInTime,desc',
      };
      if (statusFilter) params.status = statusFilter;
      if (currentBranch?.id) params.branchId = currentBranch.id;

      const res = await attendanceApi.getLogs(params);
      setLogs(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch attendance logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter, currentBranch]);

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckInMsg(null);
    if (!quickCredential.trim()) return;

    try {
      // Lookup member first
      const memRes = await membersApi.lookup(quickCredential.trim());
      const member = memRes.data;

      const res = await attendanceApi.checkIn({
        memberId: member.id,
        branchId: currentBranch?.id || member.branchId || 1,
        accessMethod: 'MANUAL_ENTRY',
      });

      setCheckInMsg({
        type: 'success',
        text: `Checked in ${member.fullName} (${member.memberCode}) successfully!`,
      });
      setQuickCredential('');
      fetchLogs();
    } catch (err: any) {
      setCheckInMsg({
        type: 'error',
        text: err.response?.data?.message || 'Access Denied: Member not active or already checked in.',
      });
    }
  };

  const handleCheckOut = async (memberId: number, memberName: string) => {
    try {
      await attendanceApi.checkOut(memberId);
      setCheckInMsg({
        type: 'success',
        text: `Checked out ${memberName} successfully.`,
      });
      fetchLogs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to check out');
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const memRes = await membersApi.lookup(overrideData.memberCode.trim());
      const member = memRes.data;

      await attendanceApi.override({
        memberId: member.id,
        branchId: currentBranch?.id || member.branchId || 1,
        reason: overrideData.reason,
      });

      setShowOverrideModal(false);
      setOverrideData({ memberCode: '', reason: 'Managerial approval for forgotten card' });
      setCheckInMsg({
        type: 'success',
        text: `Authorized override check-in for ${member.fullName}. Audit log recorded.`,
      });
      fetchLogs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process override');
    }
  };

  const currentlyInGym = logs.filter((l) => l.status === 'CHECKED_IN' && !l.checkOutTime);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-7 h-7 text-emerald-600" />
            Attendance & Turnstile Access
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time biometric & QR code gate access, visitor logs, and manual staff overrides.
          </p>
        </div>

        {!isMember && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOverrideModal(true)}
              className="inline-flex items-center px-3.5 py-2 border border-amber-300 rounded-lg text-sm font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 transition shadow-sm"
            >
              <ShieldAlert className="w-4 h-4 mr-1.5 text-amber-600" />
              Manual Override
            </button>
            <button
              onClick={() => setShowScanner(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
            >
              <QrCode className="w-4 h-4 mr-1.5" />
              Open QR Scanner
            </button>
          </div>
        )}
      </div>

      {/* Live Status Message */}
      {checkInMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            checkInMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {checkInMsg.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-medium">{checkInMsg.text}</span>
          </div>
          <button
            onClick={() => setCheckInMsg(null)}
            className="text-xs font-bold uppercase opacity-60 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Check-in Bar & In-Gym Counter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Check-In Form */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Quick Desk Check-In
          </h2>
          <form onSubmit={handleManualCheckIn} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Member Code (e.g. MEM-2026-0001) or 10-digit Phone..."
              value={quickCredential}
              onChange={(e) => setQuickCredential(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition"
            >
              Punch Check-In
            </button>
          </form>
        </div>

        {/* Live Footfall Widget */}
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-5 rounded-xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block">
              Currently Working Out
            </span>
            <span className="text-3xl font-black mt-1 block">{currentlyInGym.length} Active</span>
            <span className="text-xs text-slate-300 mt-1 block">
              Branch: {currentBranch?.name || 'All Branches'}
            </span>
          </div>
          <Users className="w-12 h-12 text-emerald-400/40" />
        </div>
      </div>

      {/* Attendance Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <h3 className="font-bold text-slate-800 text-sm">Attendance Ledger ({totalElements} logs)</h3>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="CHECKED_IN">Currently Checked In</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="DENIED">Access Denied</option>
              <option value="MANUAL_OVERRIDE">Manual Override</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
              <tr>
                <th className="px-6 py-3.5">Member</th>
                <th className="px-6 py-3.5">Check-In Time</th>
                <th className="px-6 py-3.5">Check-Out Time</th>
                <th className="px-6 py-3.5">Method</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
                    <p>Loading attendance ledger...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{log.memberName}</div>
                      <span className="font-mono text-xs text-emerald-700">{log.memberCode}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-800">
                      {new Date(log.checkInTime).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {log.checkOutTime ? (
                        new Date(log.checkOutTime).toLocaleString('en-IN')
                      ) : (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          In Gym
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                        {log.accessMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                          log.status === 'CHECKED_IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'CHECKED_OUT'
                            ? 'bg-blue-100 text-blue-800'
                            : log.status === 'DENIED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {log.status === 'CHECKED_IN' && <CheckCircle className="w-3 h-3" />}
                        {log.status === 'DENIED' && <XCircle className="w-3 h-3" />}
                        {log.status}
                      </span>
                      {log.overrideReason && (
                        <p className="text-[11px] text-amber-700 mt-1 italic">
                          Override: {log.overrideReason}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!log.checkOutTime && log.status === 'CHECKED_IN' && !isMember && (
                        <button
                          onClick={() => handleCheckOut(log.memberId, log.memberName)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-semibold rounded-lg transition"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Check-Out
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
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
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

      {/* Manual Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                Staff Manual Access Override
              </h3>
              <button onClick={() => setShowOverrideModal(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Overrides bypass plan expiry or missing credentials. Every override is permanently recorded in the system audit log.
            </p>

            <form onSubmit={handleOverrideSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Member Code or Phone *
                </label>
                <input
                  type="text"
                  required
                  value={overrideData.memberCode}
                  onChange={(e) => setOverrideData({ ...overrideData, memberCode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. MEM-2026-0001"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Justification / Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={overrideData.reason}
                  onChange={(e) => setOverrideData({ ...overrideData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                  placeholder="State the operational reason for granting manual access..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg"
                >
                  Authorize Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Optical QR Scanner Modal */}
      {showScanner && (
        <QrScannerModal
          onClose={() => setShowScanner(false)}
          onSuccess={(attendance) => {
            setCheckInMsg({
              type: 'success',
              text: `QR Scan successful for ${attendance?.memberName || 'Member'}! Turnstile unlocked.`,
            });
            fetchLogs();
          }}
          branchId={currentBranch?.id}
        />
      )}
    </div>
  );
};
