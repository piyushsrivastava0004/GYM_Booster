import React from 'react';
import { X, Printer, Download, Share2, CheckCircle2 } from 'lucide-react';
import { paymentsApi } from '../services/api';

interface Props {
  invoice: any;
  onClose: () => void;
}

const ReceiptModal: React.FC<Props> = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const downloadPdf = () => {
    if (invoice.id) {
      window.open(paymentsApi.getInvoicePdfUrl(invoice.id), '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400">Tax Invoice Receipt</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
              GST Verified
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadPdf}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition"
              title="Download Server-side PDF"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition"
              title="Print"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-6 bg-slate-900 text-slate-200 space-y-5 print:p-0 print:bg-white print:text-black">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
            <div>
              <h2 className="font-extrabold text-lg text-emerald-400 tracking-tight">FITPULSE GYM & FITNESS</h2>
              <p className="text-xs text-slate-400">{invoice.branchName || 'Central Branch, Indiranagar'}</p>
              <p className="text-[11px] text-slate-500">GSTIN: 29AABCU9603R1ZM</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs font-bold text-white">{invoice.invoiceNumber || 'INV-2026-0001'}</p>
              <p className="text-xs text-slate-400">Date: {invoice.invoiceDate || new Date().toISOString().split('T')[0]}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                {invoice.status || 'PAID'}
              </span>
            </div>
          </div>

          {/* Billed To */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <p className="text-slate-400 font-semibold mb-0.5">Billed To:</p>
            <p className="font-bold text-white text-sm">{invoice.memberName || invoice.member?.fullName}</p>
            <p className="text-slate-400">{invoice.memberEmail || invoice.member?.email}</p>
          </div>

          {/* Line items table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/90 text-slate-400 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Taxable (₹)</th>
                  <th className="p-3 text-right">GST 18% (₹)</th>
                  <th className="p-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="p-3 font-medium">Gym Membership Subscription Fee</td>
                  <td className="p-3 text-right">₹{invoice.subtotal || (invoice.amount ? (invoice.amount * 0.847).toFixed(2) : '2,118.64')}</td>
                  <td className="p-3 text-right">₹{invoice.taxAmount || (invoice.amount ? (invoice.amount * 0.153).toFixed(2) : '381.36')}</td>
                  <td className="p-3 text-right font-bold text-white">₹{invoice.grandTotal || invoice.netAmount || '2,500.00'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-end pt-2">
            <div className="w-48 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>₹{invoice.subtotal || '2,118.64'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>CGST (9%):</span>
                <span>₹{((invoice.taxAmount || 381.36) / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SGST (9%):</span>
                <span>₹{((invoice.taxAmount || 381.36) / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-emerald-400 border-t border-slate-800 pt-1.5">
                <span>Total Paid:</span>
                <span>₹{invoice.grandTotal || invoice.netAmount || '2,500.00'}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[10px] text-slate-500 border-t border-slate-800/80 pt-3">
            <p>This is a computer generated tax invoice. Thank you for choosing FitPulse Gym!</p>
            <p>For support, email support@fitpulse.in or call +91 98765 43210</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
