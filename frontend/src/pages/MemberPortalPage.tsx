import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  User,
  Calendar,
  CreditCard,
  Clock,
  Dumbbell,
  Utensils,
  Award,
  CheckCircle,
  FileText,
  Download,
  Flame,
  Droplet,
  PauseCircle,
  AlertCircle,
} from 'lucide-react';
import {
  membersApi,
  membershipApi,
  paymentsApi,
  workoutApi,
  dietApi,
  classApi,
} from '../services/api';
import {
  Member,
  Subscription,
  Invoice,
  WorkoutPlan,
  DietPlan,
  ClassBooking,
} from '../types';
import { useAuth } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';

export const MemberPortalPage: React.FC = () => {
  const { user } = useAuth();

  const [member, setMember] = useState<Member | null>(null);
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [bookings, setBookings] = useState<ClassBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Water tracker
  const [waterGlasses, setWaterGlasses] = useState<number>(6);

  // Completed workout checklist state
  const [completedExercises, setCompletedExercises] = useState<Record<number, boolean>>({});

  // Freeze Modal
  const [showFreezeModal, setShowFreezeModal] = useState<boolean>(false);
  const [freezeDays, setFreezeDays] = useState<number>(14);
  const [freezeReason, setFreezeReason] = useState<string>('Personal Travel');

  useEffect(() => {
    const loadPortalData = async () => {
      try {
        setLoading(true);
        if (!user) return;

        // Fetch Member Record
        const memRes = await membersApi.getByUserId(user.id);
        const memData = memRes.data;
        setMember(memData);

        if (memData) {
          const [subRes, invRes, wkRes, dtRes, bkRes] = await Promise.all([
            membershipApi.getMemberSubscriptions(memData.id),
            paymentsApi.getMemberInvoices(memData.id),
            workoutApi.getMemberPlans(memData.id),
            dietApi.getMemberPlans(memData.id),
            classApi.getMemberBookings(memData.id),
          ]);

          const active = subRes.data?.find((s: Subscription) => s.status === 'ACTIVE' || s.status === 'FROZEN');
          setActiveSub(active || subRes.data?.[0] || null);
          setInvoices(invRes.data || []);
          setWorkoutPlan(wkRes.data?.[0] || null);
          setDietPlan(dtRes.data?.[0] || null);
          setBookings(bkRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load member portal', err);
      } finally {
        setLoading(false);
      }
    };

    loadPortalData();
  }, [user]);

  const handleToggleExercise = (id: number) => {
    setCompletedExercises((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRequestFreeze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSub) return;
    try {
      await membershipApi.freeze(activeSub.id, {
        freezeDays,
        reason: freezeReason,
      });
      setShowFreezeModal(false);
      alert('Subscription frozen successfully. Your end date has been extended.');
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to freeze subscription');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl flex items-center gap-3">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <div>
          <h3 className="font-bold">Member Account Not Found</h3>
          <p className="text-xs">Your user account is not linked to an active member profile.</p>
        </div>
      </div>
    );
  }

  const daysRemaining = activeSub?.endDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(activeSub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {member.fullName}! 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your workout split, check your nutrition targets, and view your digital turnstile pass.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
            {member.memberCode}
          </span>
        </div>
      </div>

      {/* Top Row: Digital Access Badge & Active Plan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pass */}
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>

          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-3">
            Digital Entry Turnstile Pass
          </span>

          <div className="bg-white p-3.5 rounded-xl shadow-inner my-2">
            <QRCodeSVG value={member.qrCodeData || member.memberCode} size={140} level="H" />
          </div>

          <div className="mt-2">
            <h3 className="font-bold text-base text-white">{member.fullName}</h3>
            <p className="text-xs text-slate-300 font-mono mt-0.5">{member.memberCode}</p>
          </div>

          <div className="w-full pt-3 mt-3 border-t border-slate-800 text-xs text-slate-300 flex justify-between">
            <span>Gate Access:</span>
            <span className="text-emerald-400 font-bold">Authorized</span>
          </div>
        </div>

        {/* Plan Status */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                  Active Subscription
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                  {activeSub?.planName || member.activePlanName || 'No Active Plan'}
                </h3>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  activeSub?.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {activeSub?.status || member.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-400 block font-medium">Days Remaining</span>
                <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                  {daysRemaining} Days
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-400 block font-medium">Valid Until</span>
                <span className="text-sm font-bold text-slate-800 mt-1 block">
                  {activeSub?.endDate
                    ? new Date(activeSub.endDate).toLocaleDateString('en-IN')
                    : 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-400 block font-medium">Freezes Used</span>
                <span className="text-sm font-bold text-slate-800 mt-1 block">
                  {activeSub?.freezesUsed || 0} times
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Assigned Trainer: <strong>{member.assignedTrainerName || 'Floor Trainer'}</strong>
            </span>
            {activeSub?.status === 'ACTIVE' && (
              <button
                onClick={() => setShowFreezeModal(true)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Request Freeze
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Daily Water Tracking Widget */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-wider">
            <Droplet className="w-4 h-4 text-blue-400" />
            Hydration Tracker
          </div>
          <h4 className="text-base font-bold">Goal: 8 Glasses Today</h4>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
            <button
              key={g}
              onClick={() => setWaterGlasses(g)}
              className={`w-8 h-10 rounded-lg border flex flex-col items-center justify-end pb-1 transition ${
                g <= waterGlasses
                  ? 'bg-blue-500 border-blue-400 shadow-md shadow-blue-500/50'
                  : 'bg-white/10 border-white/20'
              }`}
            >
              <Droplet className="w-3 h-3 text-white" />
            </button>
          ))}
          <span className="text-sm font-bold text-blue-300 ml-2 whitespace-nowrap">
            {waterGlasses} / 8 Glasses
          </span>
        </div>
      </div>

      {/* Middle Row: Today's Workout Split & Nutrition Target */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workout Split */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Today's Prescribed Routine</h3>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
              {workoutPlan?.name || 'Full Body Workout'}
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {workoutPlan?.days?.[0]?.exercises?.map((ex, idx) => (
              <div
                key={ex.id || idx}
                onClick={() => handleToggleExercise(ex.id || idx)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  completedExercises[ex.id || idx]
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50 border-slate-100 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                      completedExercises[ex.id || idx]
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {completedExercises[ex.id || idx] && <CheckCircle className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">{ex.exerciseName}</span>
                    <span className="text-[11px] text-slate-500">
                      {ex.sets} sets × {ex.reps} reps ({ex.targetWeightKg || 0}kg)
                    </span>
                  </div>
                </div>
              </div>
            )) || <p className="text-xs text-slate-400">No workout exercises assigned today.</p>}
          </div>
        </div>

        {/* Nutrition Target */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-slate-900 text-sm">Daily Nutrition Targets</h3>
            </div>
            <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">
              {dietPlan?.name || 'Clean Muscle'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-[10px] text-amber-700 font-bold block uppercase">Calories</span>
              <span className="text-sm font-black text-amber-950">
                {dietPlan?.targetCalories || 2200}
              </span>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-[10px] text-rose-700 font-bold block uppercase">Protein</span>
              <span className="text-sm font-black text-rose-950">
                {dietPlan?.targetProteinGrams || 150}g
              </span>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
              <span className="text-[10px] text-blue-700 font-bold block uppercase">Carbs</span>
              <span className="text-sm font-black text-blue-950">
                {dietPlan?.targetCarbsGrams || 200}g
              </span>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-700 font-bold block uppercase">Fat</span>
              <span className="text-sm font-black text-emerald-950">
                {dietPlan?.targetFatGrams || 60}g
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {dietPlan?.mealItems?.slice(0, 3).map((m) => (
              <div key={m.id} className="p-2.5 bg-slate-50 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800">{m.mealName}</span>
                  <p className="text-slate-500 text-[11px]">{m.foodItem}</p>
                </div>
                <span className="font-mono text-slate-600">{m.calories} kcal</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Invoices & Receipts */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          My Payment Invoices & Receipts
        </h3>

        <div className="divide-y divide-slate-100">
          {invoices.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No invoices recorded yet.</p>
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                  <div className="text-slate-500 text-[11px]">
                    Issued: {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-900 text-sm">₹{inv.grandTotal ?? inv.totalAmount}</span>
                  <div className="space-x-2">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
                    >
                      Receipt
                    </button>
                    <a
                      href={paymentsApi.getInvoicePdfUrl(inv.id)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-semibold inline-flex items-center gap-1"
                      download
                    >
                      <Download className="w-3 h-3" />
                      PDF
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Freeze Modal */}
      {showFreezeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Request Membership Freeze</h3>
            <form onSubmit={handleRequestFreeze} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Freeze Duration (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={freezeDays}
                  onChange={(e) => setFreezeDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason</label>
                <input
                  type="text"
                  required
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="e.g. Travel, Work Project, Exam"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowFreezeModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs"
                >
                  Apply Freeze
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
