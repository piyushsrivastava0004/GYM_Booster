import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api';
import { DashboardMetrics } from '../types';
import {
  Users,
  IndianRupee,
  Clock,
  TrendingUp,
  AlertTriangle,
  QrCode,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import QrScannerModal from '../components/QrScannerModal';

const DashboardPage: React.FC = () => {
  const { selectedBranchId, user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showScanner, setShowScanner] = useState<boolean>(false);

  const fetchMetrics = () => {
    setLoading(true);
    dashboardApi.getMetrics(selectedBranchId || undefined)
      .then((res) => setMetrics(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMetrics();
  }, [selectedBranchId]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const pieData = metrics?.membersByStatus
    ? Object.entries(metrics.membersByStatus).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Terminal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 inline-block mb-2">
            Live Gym Operations
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time database analytics for {selectedBranchId ? 'Selected Branch' : 'All Branches'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowScanner(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            Launch QR Check-in Terminal
          </button>
        </div>
      </div>

      {/* Expiring memberships alert */}
      {metrics && metrics.expiringMembershipsCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>{metrics.expiringMembershipsCount} memberships</strong> are expiring in the next 7 days. Send renewal reminders!
            </span>
          </div>
          <a
            href="/plans"
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition shrink-0"
          >
            Review Renewals
          </a>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Members */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Members</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{metrics?.activeMembersCount || 0}</p>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold">{metrics?.retentionRatePercent}%</span>
            <span>member retention rate</span>
          </div>
        </div>

        {/* Monthly Collections */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Month Collections (Cash/UPI)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">₹{metrics?.monthCollections?.toLocaleString('en-IN') || '0'}</p>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-rose-400 font-semibold">₹{metrics?.outstandingReceivables?.toLocaleString('en-IN') || '0'}</span>
            <span>outstanding balance</span>
          </div>
        </div>

        {/* Operating Expenses & Profit */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Estimated Net Profit</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400">
            ₹{metrics?.estimatedNetProfit?.toLocaleString('en-IN') || '0'}
          </p>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
            <span>Expenses: ₹{metrics?.monthExpenses?.toLocaleString('en-IN') || '0'}</span>
          </div>
        </div>

        {/* Today's Check-ins */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Today's Visits (Check-ins)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{metrics?.todayCheckInsCount || 0}</p>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-amber-400 font-semibold">{metrics?.lowStockCount || 0} items</span>
            <span>low stock reorders</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Expenses Trend (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white">Revenue Collections vs Expenses (Last 6 Months)</h3>
              <p className="text-[11px] text-slate-400">Actual financial cash flows (INR)</p>
            </div>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.revenueTrend || []}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="collections" name="Collections (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses (₹)" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours Trend */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white">Peak Attendance Hours</h3>
              <p className="text-[11px] text-slate-400">Daily footfall distribution</p>
            </div>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics?.peakHours || []}>
                <XAxis dataKey="hourLabel" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="count" name="Visits" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Row: Status Pie Chart & Recent Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Membership Status Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-white mb-1">Members by Status</h3>
          <p className="text-[11px] text-slate-400 mb-4">Active, Frozen, Expired distribution</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {pieData.map((entry, index) => (
              <span key={entry.name} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                {entry.name}: {entry.value}
              </span>
            ))}
          </div>
        </div>

        {/* Live Activity Timeline */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white">Recent System Activity & Audit Trail</h3>
              <p className="text-[11px] text-slate-400">Logged operations across members, payments, and check-ins</p>
            </div>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {metrics?.recentActivities?.length ? (
              metrics.recentActivities.map((act, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-white">{act.title}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{act.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                    {act.timestamp}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No recent activity logged</p>
            )}
          </div>
        </div>
      </div>

      {/* QR Scanner Terminal Modal */}
      {showScanner && (
        <QrScannerModal
          onClose={() => setShowScanner(false)}
          onSuccess={() => {
            fetchMetrics();
          }}
          branchId={selectedBranchId}
        />
      )}
    </div>
  );
};

export default DashboardPage;
