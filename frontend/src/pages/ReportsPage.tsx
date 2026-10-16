import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  Building,
  Users,
  CreditCard,
  Clock,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/api';

export const ReportsPage: React.FC = () => {
  const { currentBranch } = useAuth();

  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const branchParam = currentBranch?.id ? `branchId=${currentBranch.id}` : '';
  const dateParams = `startDate=${startDate}&endDate=${endDate}`;
  const query = [branchParam, dateParams].filter(Boolean).join('&');

  const reportItems = [
    {
      title: 'Complete Member Directory',
      description: 'Comprehensive roster with member codes, emergency contacts, blood groups, and active plans.',
      icon: Users,
      csvUrl: `${API_BASE_URL}/reports/members/csv?${query}`,
      excelUrl: `${API_BASE_URL}/reports/members/excel?${query}`,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Financial Revenue & GST Invoices',
      description: 'Transaction-level billing journal with 18% GST breakdowns, UPI/Card/Cash splits, and invoice numbers.',
      icon: CreditCard,
      csvUrl: `${API_BASE_URL}/reports/financial/csv?${query}`,
      excelUrl: `${API_BASE_URL}/reports/financial/excel?${query}`,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Turnstile & Biometric Attendance',
      description: 'Daily check-in / check-out timestamps, visit durations, and staff manual override audit trails.',
      icon: Clock,
      csvUrl: `${API_BASE_URL}/reports/attendance/csv?${query}`,
      excelUrl: null,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'Operational Expenses & Overheads',
      description: 'Operating cost ledger (Rent, Electricity, Maintenance, Salaries) and net profit summaries.',
      icon: DollarSign,
      csvUrl: `${API_BASE_URL}/reports/expenses/csv?${query}`,
      excelUrl: null,
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
          Business Reports & Data Exports
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Export audit-ready CSV and Microsoft Excel (.xlsx) files for accounting, compliance, and analysis.
        </p>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Reporting Timeframe:</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800"
            />
          </div>

          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium">
            Branch: {currentBranch?.name || 'All Branches'}
          </span>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <a
                  href={item.csvUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
                  download
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Download CSV
                </a>
                {item.excelUrl && (
                  <a
                    href={item.excelUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                    download
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Download Excel
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compliance Note */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 text-xs text-emerald-900">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <span className="font-bold">Indian GST & Audit Ready:</span> Financial journals include invoice serial numbers, HSN/SAC codes, and separate CGST (9%) and SGST (9%) figures matching the GSTR-1 and GSTR-3B monthly filing format.
        </div>
      </div>
    </div>
  );
};
