import React, { useState, useEffect } from 'react';
import {
  Activity,
  Plus,
  TrendingUp,
  Target,
  Award,
  Search,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { fitnessApi, membersApi } from '../services/api';
import { FitnessMeasurement, FitnessGoal, Member } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const FitnessProgressPage: React.FC = () => {
  const { user, isMember } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [measurements, setMeasurements] = useState<FitnessMeasurement[]>([]);
  const [goals, setGoals] = useState<FitnessGoal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showMeasureModal, setShowAddMeasureModal] = useState<boolean>(false);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);

  // Measurement Form
  const [measureForm, setMeasureForm] = useState({
    weightKg: 75,
    heightCm: 175,
    chestCm: 98,
    waistCm: 84,
    hipsCm: 96,
    bicepsCm: 35,
    bodyFatPercentage: 18.5,
    notes: 'Bi-weekly fitness evaluation',
  });

  // Goal Form
  const [goalForm, setGoalForm] = useState({
    goalType: 'WEIGHT_LOSS',
    targetValue: 70,
    currentValue: 75,
    unit: 'kg',
    targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Reach 12% body fat with clean nutrition',
  });

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        if (isMember && user) {
          const res = await membersApi.getByUserId(user.id);
          setSelectedMember(res.data);
          loadMemberFitness(res.data.id);
        } else {
          const res = await membersApi.getAll();
          setMembers(res.data || []);
          if (res.data?.length > 0) {
            setSelectedMember(res.data[0]);
            loadMemberFitness(res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load fitness data', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [isMember, user]);

  const loadMemberFitness = async (memberId: number) => {
    try {
      const [mRes, gRes] = await Promise.all([
        fitnessApi.getMeasurements(memberId),
        fitnessApi.getMemberGoals(memberId),
      ]);
      setMeasurements(mRes.data || []);
      setGoals(gRes.data || []);
    } catch (err) {
      console.error('Failed to load member stats', err);
    }
  };

  const handleMemberChange = (mId: number) => {
    const m = members.find((x) => x.id === mId);
    if (m) {
      setSelectedMember(m);
      loadMemberFitness(m.id);
    }
  };

  const handleRecordMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      await fitnessApi.recordMeasurement({
        memberId: selectedMember.id,
        ...measureForm,
      });
      setShowAddMeasureModal(false);
      loadMemberFitness(selectedMember.id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record measurement');
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      await fitnessApi.createGoal({
        memberId: selectedMember.id,
        ...goalForm,
        targetValue: Number(goalForm.targetValue),
        currentValue: Number(goalForm.currentValue),
      });
      setShowGoalModal(false);
      loadMemberFitness(selectedMember.id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create goal');
    }
  };

  const chartData = [...measurements].reverse().map((m) => ({
    date: new Date(m.measurementDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    weight: m.weightKg,
    bodyFat: m.bodyFatPercentage || 0,
    bmi: m.bmi || 0,
  }));

  const latest = measurements[0];

  const getBmiCategory = (bmi: number) => {
    if (!bmi) return 'N/A';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 24.9) return 'Normal Weight';
    if (bmi < 29.9) return 'Overweight';
    return 'Obese';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-7 h-7 text-emerald-600" />
            Fitness Progress & Body Measurements
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track weight trends, BMI changes, body fat percentages, and personal strength goals.
          </p>
        </div>

        {selectedMember && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGoalModal(true)}
              className="inline-flex items-center px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition"
            >
              <Target className="w-4 h-4 mr-1.5 text-emerald-600" />
              Set Goal
            </button>
            <button
              onClick={() => setShowAddMeasureModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Log Measurement
            </button>
          </div>
        )}
      </div>

      {/* Member Selector (for Staff) */}
      {!isMember && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
            Select Member Profile:
          </label>
          <select
            value={selectedMember?.id || ''}
            onChange={(e) => handleMemberChange(Number(e.target.value))}
            className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName} ({m.memberCode}) - {m.phone}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedMember && (
        <>
          {/* Latest Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Current Weight
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1">
                {latest ? `${latest.weightKg} kg` : '--'}
              </div>
              <span className="text-xs text-emerald-600 mt-1 block">
                Height: {latest ? `${latest.heightCm} cm` : '--'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Calculated BMI
              </span>
              <div className="text-3xl font-black text-emerald-700 mt-1">
                {latest?.bmi ? latest.bmi.toFixed(1) : '--'}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                {latest ? getBmiCategory(latest.bmi) : 'No data'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Body Fat %
              </span>
              <div className="text-3xl font-black text-rose-600 mt-1">
                {latest?.bodyFatPercentage ? `${latest.bodyFatPercentage}%` : '--'}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">Calipers measurement</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total Check-Ins
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1">{measurements.length}</div>
              <span className="text-xs text-slate-500 mt-1 block">Historical logs</span>
            </div>
          </div>

          {/* Progress Chart */}
          {chartData.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Weight & Body Fat Progression</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" stroke="#059669" />
                    <YAxis yAxisId="right" orientation="right" stroke="#e11d48" />
                    <Tooltip />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="weight"
                      name="Weight (kg)"
                      stroke="#059669"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="bodyFat"
                      name="Body Fat %"
                      stroke="#e11d48"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Goals Tracker */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              Fitness Goals & Targets ({goals.length})
            </h3>
            {goals.length === 0 ? (
              <p className="text-xs text-slate-400">No active goals set. Click 'Set Goal' to start!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((g) => {
                  const percent = Math.min(
                    100,
                    Math.round(
                      ((g.currentValue || 0) / (g.targetValue || 1)) * 100
                    )
                  );
                  return (
                    <div
                      key={g.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-sm text-slate-800">{g.goalType}</span>
                          <p className="text-xs text-slate-500">{g.notes || 'In progress'}</p>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {g.status}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs text-slate-600 font-medium pt-1">
                        <span>Current: {g.currentValue} {g.unit}</span>
                        <span>Target: {g.targetValue} {g.unit}</span>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Measurement Modal */}
      {showMeasureModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Record Measurement</h3>
            <form onSubmit={handleRecordMeasurement} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={measureForm.weightKg}
                    onChange={(e) => setMeasureForm({ ...measureForm, weightKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Height (cm) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={measureForm.heightCm}
                    onChange={(e) => setMeasureForm({ ...measureForm, heightCm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chest (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={measureForm.chestCm}
                    onChange={(e) => setMeasureForm({ ...measureForm, chestCm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waist (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={measureForm.waistCm}
                    onChange={(e) => setMeasureForm({ ...measureForm, waistCm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hips (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={measureForm.hipsCm}
                    onChange={(e) => setMeasureForm({ ...measureForm, hipsCm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Biceps (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={measureForm.bicepsCm}
                    onChange={(e) => setMeasureForm({ ...measureForm, bicepsCm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Body Fat %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={measureForm.bodyFatPercentage}
                    onChange={(e) =>
                      setMeasureForm({ ...measureForm, bodyFatPercentage: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={measureForm.notes}
                  onChange={(e) => setMeasureForm({ ...measureForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddMeasureModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                >
                  Save Measurement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Set Fitness Goal</h3>
            <form onSubmit={handleCreateGoal} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Goal Type</label>
                <input
                  type="text"
                  required
                  value={goalForm.goalType}
                  onChange={(e) => setGoalForm({ ...goalForm, goalType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="e.g. Weight Loss, 100kg Bench Press"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Value</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={goalForm.targetValue}
                    onChange={(e) => setGoalForm({ ...goalForm, targetValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={goalForm.unit}
                    onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="kg, reps, %"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={goalForm.targetDate}
                  onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                >
                  Set Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
