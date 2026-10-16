import React, { useState } from 'react';
import { X, QrCode, Search, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { attendanceApi } from '../services/api';
import confetti from 'canvas-confetti';

interface Props {
  onClose: () => void;
  onSuccess: (attendance: any) => void;
  branchId?: number | null;
}

const QrScannerModal: React.FC<Props> = ({ onClose, onSuccess, branchId }) => {
  const [credentialInput, setCredentialInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<any | null>(null);

  const handleCheckIn = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await attendanceApi.checkIn({
        memberCode: code.startsWith('MEM-') ? code : undefined,
        qrCodeData: code.startsWith('FITPULSE:') ? code : undefined,
        verificationMethod: 'QR',
        branchId: branchId || undefined,
      });

      setLastSuccess(res.data);
      onSuccess(res.data);

      // Trigger celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#3b82f6', '#f59e0b'],
      });

      setCredentialInput('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Access Denied: Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">QR / Card Access Terminal</h3>
              <p className="text-[11px] text-slate-400">Scan member badge or enter code</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Visual Viewfinder Frame */}
          <div className="relative aspect-video rounded-xl border-2 border-dashed border-emerald-500/40 bg-slate-950/60 flex flex-col items-center justify-center p-6 text-center overflow-hidden group">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3 animate-pulse">
              <Camera className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-xs font-semibold text-slate-300">Live Optical Viewfinder Active</p>
            <p className="text-[10px] text-slate-500 mt-1">Align QR code / barcode badge within the scanner guides</p>

            {/* Quick Demo Badges to simulate real physical barcode scans */}
            <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
              <button
                type="button"
                onClick={() => handleCheckIn('MEM-2026-0001')}
                className="px-2 py-1 rounded-md bg-slate-800 hover:bg-emerald-600 text-[10px] font-mono text-slate-300 hover:text-white transition border border-slate-700"
              >
                Scan: MEM-2026-0001
              </button>
              <button
                type="button"
                onClick={() => handleCheckIn('MEM-2026-0002')}
                className="px-2 py-1 rounded-md bg-slate-800 hover:bg-emerald-600 text-[10px] font-mono text-slate-300 hover:text-white transition border border-slate-700"
              >
                Scan: MEM-2026-0002
              </button>
            </div>
          </div>

          {/* Manual Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCheckIn(credentialInput);
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Manual Barcode / Member Code / QR Token
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. MEM-2026-0001 or scan token"
                  value={credentialInput}
                  onChange={(e) => setCredentialInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !credentialInput.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying Access...' : 'Verify Access & Unlock Gate'}
            </button>
          </form>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {lastSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <div>
                <p className="font-bold">Access Granted: {lastSuccess.memberName} ({lastSuccess.memberCode})</p>
                <p className="text-[11px] text-emerald-300/80">Turnstile relay pulse sent. Session started at {new Date(lastSuccess.checkInTime).toLocaleTimeString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrScannerModal;
