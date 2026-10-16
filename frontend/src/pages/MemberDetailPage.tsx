import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  User,
  ArrowLeft,
  Calendar,
  CreditCard,
  Clock,
  Dumbbell,
  Utensils,
  Activity,
  Heart,
  Phone,
  Mail,
  MapPin,
  ShieldAlert,
  Award,
  CheckCircle,
  PauseCircle,
  XCircle,
  Plus,
  FileText,
  Download,
  AlertCircle,
  Droplet,
  Pencil,
} from 'lucide-react';
import {
  membersApi,
  membershipApi,
  paymentsApi,
  attendanceApi,
  workoutApi,
  dietApi,
  fitnessApi,
  classApi,
} from '../services/api';
import {
  Member,
  Subscription,
  Payment,
  Invoice,
  Attendance,
  WorkoutPlan,
  WorkoutLog,
  DietPlan,
  DietLog,
  FitnessMeasurement,
  FitnessGoal,
  TrainerAppointment,
  MembershipPlan,
} from '../types';
import { useAuth } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const MemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMember } = useAuth();
  const memberId = Number(id);

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Tab Data States
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [dietLogs, setDietLogs] = useState<DietLog[]>([]);
  const [measurements, setMeasurements] = useState<FitnessMeasurement[]>([]);
  const [goals, setGoals] = useState<FitnessGoal[]>([]);
  const [appointments, setAppointments] = useState<TrainerAppointment[]>([]);

  // Modals & Action States
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [showFreezeModal, setShowFreezeModal] = useState<boolean>(false);
  const [freezeSubId, setFreezeSubId] = useState<number | null>(null);
  const [freezeDays, setFreezeDays] = useState<number>(14);
  const [freezeReason, setFreezeReason] = useState<string>('Personal Travel');

  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showMeasurementModal, setShowMeasurementModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<any>({});

  // Form States
  const [purchaseData, setPurchaseData] = useState({
    planId: 0,
    startDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'UPI',
    discountAmount: 0,
    paidAmount: 0,
    notes: 'Member subscription purchase',
  });

  const [recordPayData, setRecordPayData] = useState({
    amount: 0,
    paymentMethod: 'UPI',
    notes: 'Balance settlement',
  });

  const [measureData, setMeasureData] = useState({
    weightKg: 75,
    heightCm: 175,
    chestCm: 98,
    waistCm: 84,
    hipsCm: 96,
    bicepsCm: 35,
    bodyFatPercentage: 18.5,
    notes: 'Regular check-in',
  });

  const fetchMemberCore = async () => {
    try {
      setLoading(true);
      const res = await membersApi.getById(memberId);
      setMember(res.data);
    } catch (err: any) {
      setError('Member not found or unauthorized.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (memberId) {
      fetchMemberCore();
    }
  }, [memberId]);

  // Lazy tab fetcher
  useEffect(() => {
    if (!memberId) return;

    if (activeTab === 'subscriptions') {
      membershipApi.getMemberSubscriptions(memberId).then((r) => setSubscriptions(r.data || []));
      membershipApi.getPlans().then((r) => setPlans(r.data || []));
    } else if (activeTab === 'payments') {
      paymentsApi.getMemberPayments(memberId).then((r) => setPayments(r.data || []));
      paymentsApi.getMemberInvoices(memberId).then((r) => setInvoices(r.data || []));
    } else if (activeTab === 'attendance') {
      attendanceApi.getMemberAttendance(memberId).then((r) => setAttendanceLogs(r.data || []));
    } else if (activeTab === 'workouts') {
      workoutApi.getMemberPlans(memberId).then((r) => setWorkoutPlans(r.data || []));
      workoutApi.getMemberLogs(memberId).then((r) => setWorkoutLogs(r.data || []));
    } else if (activeTab === 'diet') {
      dietApi.getMemberPlans(memberId).then((r) => setDietPlans(r.data || []));
      dietApi.getMemberLogs(memberId).then((r) => setDietLogs(r.data || []));
    } else if (activeTab === 'fitness') {
      fitnessApi.getMeasurements(memberId).then((r) => setMeasurements(r.data || []));
      fitnessApi.getMemberGoals(memberId).then((r) => setGoals(r.data || []));
    } else if (activeTab === 'appointments') {
      classApi.getMemberAppointments(memberId).then((r) => setAppointments(r.data || []));
    }
  }, [activeTab, memberId]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await membersApi.updateStatus(memberId, newStatus);
      fetchMemberCore();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handlePurchaseSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await membershipApi.purchase({
        memberId,
        planId: purchaseData.planId,
        startDate: purchaseData.startDate,
        paymentMethod: purchaseData.paymentMethod,
        discountAmount: Number(purchaseData.discountAmount),
        paidAmount: Number(purchaseData.paidAmount),
        notes: purchaseData.notes,
      });
      setShowPurchaseModal(false);
      fetchMemberCore();
      membershipApi.getMemberSubscriptions(memberId).then((r) => setSubscriptions(r.data || []));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to purchase plan');
    }
  };

  const handleFreezeSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freezeSubId) return;
    try {
      await membershipApi.freeze(freezeSubId, {
        freezeDays,
        reason: freezeReason,
      });
      setShowFreezeModal(false);
      membershipApi.getMemberSubscriptions(memberId).then((r) => setSubscriptions(r.data || []));
      fetchMemberCore();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to freeze subscription');
    }
  };

  const handleUnfreezeSubscription = async (subId: number) => {
    if (!window.confirm('Unfreeze this subscription and resume membership?')) return;
    try {
      await membershipApi.unfreeze(subId);
      membershipApi.getMemberSubscriptions(memberId).then((r) => setSubscriptions(r.data || []));
      fetchMemberCore();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to unfreeze subscription');
    }
  };

  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fitnessApi.recordMeasurement({
        memberId,
        ...measureData,
      });
      setShowMeasurementModal(false);
      fitnessApi.getMeasurements(memberId).then((r) => setMeasurements(r.data || []));
    } catch (err: any) {
      alert('Failed to record measurement');
    }
  };

  const openEditModal = () => {
    if (!member) return;
    setEditForm({
      fullName: member.fullName || '',
      email: member.email || '',
      phone: member.phone || '',
      password: '',
      gender: member.gender || 'MALE',
      dateOfBirth: member.dateOfBirth || '1998-05-15',
      bloodGroup: member.bloodGroup || 'O+',
      address: member.address || '',
      emergencyContactName: member.emergencyContactName || '',
      emergencyContactPhone: member.emergencyContactPhone || '',
      fitnessGoals: member.fitnessGoals || '',
      medicalHistory: member.medicalHistory || '',
      notes: member.notes || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await membersApi.update(memberId, editForm);
      setShowEditModal(false);
      fetchMemberCore();
      alert('Member profile updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update member profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-6 h-6" />
        <div>
          <h3 className="font-bold">Error Loading Member</h3>
          <p className="text-sm">{error || 'Member not found.'}</p>
        </div>
      </div>
    );
  }

  const chartData = [...measurements].reverse().map((m) => ({
    date: new Date(m.measurementDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    weight: m.weightKg,
    bodyFat: m.bodyFatPercentage || 0,
    bmi: m.bmi || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/members')}
            className="p-2 border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{member.fullName}</h1>
              <span className="font-mono text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                {member.memberCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Member since {new Date(member.joinDate).toLocaleDateString('en-IN')} • Branch: {member.branchName || 'Main Branch'}
            </p>
          </div>
        </div>

        {!isMember && (
          <div className="flex items-center gap-2">
            <button
              onClick={openEditModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Profile
            </button>
            <span className="text-xs font-semibold text-slate-500 ml-2">Status:</span>
            <select
              value={member.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="FROZEN">FROZEN</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex space-x-1 sm:space-x-4 overflow-x-auto text-sm font-medium">
        {[
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'subscriptions', label: 'Plans & Freezes', icon: Calendar },
          { id: 'payments', label: 'Payments & GST Invoices', icon: CreditCard },
          { id: 'attendance', label: 'Attendance Logs', icon: Clock },
          { id: 'workouts', label: 'Workout Splits', icon: Dumbbell },
          { id: 'diet', label: 'Diet & Water', icon: Utensils },
          { id: 'fitness', label: 'Body Stats & Goals', icon: Activity },
          { id: 'appointments', label: 'PT Appointments', icon: Heart },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 py-3 px-3 border-b-2 whitespace-nowrap transition ${
                isActive
                  ? 'border-emerald-600 text-emerald-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Digital Access Badge Card */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  Digital Access Pass
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-mono">
                  {member.memberCode}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl inline-block shadow-inner mx-auto mb-4">
                <QRCodeSVG value={member.qrCodeData || member.memberCode} size={150} level="H" />
              </div>

              <div className="text-center">
                <h3 className="font-bold text-lg text-white">{member.fullName}</h3>
                <p className="text-xs text-slate-300 mt-0.5">{member.phone}</p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Active Plan:</span>
                <span className="font-semibold text-white">{member.activePlanName || 'No Active Plan'}</span>
              </div>
              <div className="flex justify-between">
                <span>Valid Until:</span>
                <span className="font-semibold text-emerald-400">
                  {member.membershipExpiryDate
                    ? new Date(member.membershipExpiryDate).toLocaleDateString('en-IN')
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Details & Health Declarations */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Profile & Contact Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Email</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {member.email}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Phone</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {member.phone}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Gender & DOB</span>
                  <span className="font-medium text-slate-800 mt-0.5 block">
                    {member.gender || 'Not specified'} • {member.dateOfBirth || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Blood Group</span>
                  <span className="font-semibold text-rose-600 mt-0.5 block">
                    {member.bloodGroup || 'O+'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Assigned Trainer</span>
                  <span className="font-medium text-slate-800 mt-0.5 block">
                    {member.assignedTrainerName || 'None assigned'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Residential Address</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {member.address || 'Address not registered'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Emergency Contact & Health Declarations
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Emergency Contact Name</span>
                  <span className="font-medium text-slate-800 mt-0.5 block">
                    {member.emergencyContactName || 'None recorded'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Emergency Contact Phone</span>
                  <span className="font-medium text-slate-800 mt-0.5 block">
                    {member.emergencyContactPhone || 'None recorded'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Fitness Goals</span>
                  <span className="font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded inline-block mt-0.5">
                    {member.fitnessGoals || 'General Fitness'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Medical Conditions / Injuries</span>
                  <span className="font-medium text-slate-700 mt-0.5 block">
                    {member.medicalHistory || 'No declared medical history.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Subscriptions */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Membership Subscriptions</h2>
            {!isMember && (
              <button
                onClick={() => {
                  if (plans.length > 0) {
                    setPurchaseData((prev) => ({
                      ...prev,
                      planId: plans[0].id,
                      paidAmount: plans[0].totalAmount,
                    }));
                  }
                  setShowPurchaseModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
              >
                <Plus className="w-4 h-4" />
                Purchase / Renew Plan
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="px-6 py-3">Plan Name</th>
                  <th className="px-6 py-3">Period</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Financials</th>
                  <th className="px-6 py-3">Freezes Used</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No subscriptions found for this member.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{sub.planName}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {new Date(sub.startDate).toLocaleDateString('en-IN')} to{' '}
                        {new Date(sub.endDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.status === 'FROZEN'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div>Total: ₹{sub.totalAmount}</div>
                        <div className="text-emerald-700">Paid: ₹{sub.paidAmount}</div>
                        {sub.outstandingAmount > 0 && (
                          <div className="text-rose-600 font-bold">Due: ₹{sub.outstandingAmount}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">{sub.freezesUsed || 0}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {sub.status === 'ACTIVE' && !isMember && (
                          <button
                            onClick={() => {
                              setFreezeSubId(sub.id);
                              setShowFreezeModal(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded"
                          >
                            Freeze
                          </button>
                        )}
                        {sub.status === 'FROZEN' && !isMember && (
                          <button
                            onClick={() => handleUnfreezeSubscription(sub.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded"
                          >
                            Unfreeze
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Payments & Invoices */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Payment History & Tax Invoices</h2>
            {!isMember && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
              >
                <Plus className="w-4 h-4" />
                Record Payment
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="px-6 py-3">Txn ID</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Net Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Invoice #</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono text-xs text-slate-700">{p.transactionId}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">₹{p.netAmount}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            p.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-emerald-700">{p.invoiceNumber || 'N/A'}</td>
                      <td className="px-6 py-4 text-right">
                        {invoices.find((i) => i.invoiceNumber === p.invoiceNumber) && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                const inv = invoices.find((i) => i.invoiceNumber === p.invoiceNumber);
                                if (inv) setSelectedInvoice(inv);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                            >
                              Receipt
                            </button>
                            <a
                              href={paymentsApi.getInvoicePdfUrl(
                                invoices.find((i) => i.invoiceNumber === p.invoiceNumber)!.id
                              )}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded inline-flex items-center gap-1"
                              download
                            >
                              <Download className="w-3 h-3" />
                              PDF
                            </a>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Attendance Logs */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Attendance History</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="px-6 py-3">Check-In Time</th>
                  <th className="px-6 py-3">Check-Out Time</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Access Method</th>
                  <th className="px-6 py-3">Branch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No attendance visits recorded.
                    </td>
                  </tr>
                ) : (
                  attendanceLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-xs font-medium text-slate-800">
                        {new Date(log.checkInTime).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {log.checkOutTime ? new Date(log.checkOutTime).toLocaleString('en-IN') : 'Still in gym'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            log.status === 'CHECKED_IN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'DENIED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">{log.accessMethod}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">{log.branchName || 'Main'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Workouts */}
      {activeTab === 'workouts' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Assigned Workout Routines & Splits</h2>
          {workoutPlans.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
              <Dumbbell className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p>No personalized workout plans assigned yet.</p>
            </div>
          ) : (
            workoutPlans.map((plan) => (
              <div key={plan.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{plan.description || '5-Day Hypertrophy Routine'}</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded">
                    {plan.difficulty}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plan.days?.map((day) => (
                    <div key={day.id} className="border border-slate-100 bg-slate-50/60 p-4 rounded-xl space-y-2">
                      <h4 className="font-bold text-sm text-slate-800 flex items-center justify-between">
                        <span>Day {day.dayNumber}: {day.title}</span>
                      </h4>
                      <p className="text-xs text-slate-500">{day.focusArea}</p>

                      <div className="space-y-2 pt-2 border-t border-slate-200/60">
                        {day.exercises?.map((ex) => (
                          <div key={ex.id} className="text-xs flex justify-between items-center text-slate-700">
                            <span className="font-medium">{ex.exerciseName}</span>
                            <span className="text-slate-500 font-mono">
                              {ex.sets} × {ex.reps} ({ex.targetWeightKg || 0}kg)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 6: Diet & Water */}
      {activeTab === 'diet' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Nutrition Plan & Daily Macro Targets</h2>
          {dietPlans.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
              <Utensils className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p>No customized diet plan assigned yet.</p>
            </div>
          ) : (
            dietPlans.map((plan) => (
              <div key={plan.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                </div>

                {/* Macro Target Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                    <span className="text-xs text-amber-700 font-bold block uppercase">Calories</span>
                    <span className="text-xl font-black text-amber-900">{plan.targetCalories} kcal</span>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-center">
                    <span className="text-xs text-rose-700 font-bold block uppercase">Protein</span>
                    <span className="text-xl font-black text-rose-900">{plan.targetProteinGrams} g</span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                    <span className="text-xs text-blue-700 font-bold block uppercase">Carbs</span>
                    <span className="text-xl font-black text-blue-900">{plan.targetCarbsGrams} g</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                    <span className="text-xs text-emerald-700 font-bold block uppercase">Fats</span>
                    <span className="text-xl font-black text-emerald-900">{plan.targetFatGrams} g</span>
                  </div>
                </div>

                {/* Meals */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800">Prescribed Daily Meals</h4>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                    {plan.mealItems?.map((meal) => (
                      <div key={meal.id} className="p-3 bg-slate-50/50 flex justify-between items-center text-sm">
                        <div>
                          <span className="font-bold text-slate-800">{meal.mealName}</span>
                          <span className="text-xs text-slate-500 ml-2">({meal.timing || 'Anytime'})</span>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {meal.foodItem} • {meal.portionSize}
                          </p>
                        </div>
                        <div className="text-xs text-right font-mono text-slate-600">
                          <div>{meal.calories} kcal</div>
                          <div className="text-rose-600">{meal.proteinGrams}g Protein</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 7: Fitness Progress */}
      {activeTab === 'fitness' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Body Measurements & Fitness Trajectory</h2>
            <button
              onClick={() => setShowMeasurementModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Measurement
            </button>
          </div>

          {/* Progress Chart */}
          {chartData.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Weight & Body Fat Evolution</h3>
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

          {/* Measurements Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Weight (kg)</th>
                  <th className="px-6 py-3">Height (cm)</th>
                  <th className="px-6 py-3">BMI</th>
                  <th className="px-6 py-3">Chest / Waist / Hips</th>
                  <th className="px-6 py-3">Body Fat %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {measurements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No measurements logged yet.
                    </td>
                  </tr>
                ) : (
                  measurements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                        {new Date(m.measurementDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-700">{m.weightKg} kg</td>
                      <td className="px-6 py-4 text-xs text-slate-600">{m.heightCm} cm</td>
                      <td className="px-6 py-4 font-mono text-xs">{m.bmi}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {m.chestCm || '-'} / {m.waistCm || '-'} / {m.hipsCm || '-'} cm
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-rose-600">
                        {m.bodyFatPercentage ? `${m.bodyFatPercentage}%` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 8: Appointments */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Personal Training Sessions & Appointments</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="px-6 py-3">Date & Time</th>
                  <th className="px-6 py-3">Trainer</th>
                  <th className="px-6 py-3">Session Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No PT appointments scheduled.
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                        {new Date(apt.startTime).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-900 font-medium">{apt.trainerName}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">{apt.sessionType}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{apt.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Purchase Plan Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">Purchase / Renew Plan</h3>
              <button onClick={() => setShowPurchaseModal(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handlePurchaseSubscription} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Membership Plan</label>
                <select
                  value={purchaseData.planId}
                  onChange={(e) => {
                    const selPlan = plans.find((p) => p.id === Number(e.target.value));
                    setPurchaseData({
                      ...purchaseData,
                      planId: Number(e.target.value),
                      paidAmount: selPlan ? selPlan.totalAmount : 0,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.durationDays} Days) - ₹{p.totalAmount} (incl. 18% GST)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={purchaseData.startDate}
                    onChange={(e) => setPurchaseData({ ...purchaseData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={purchaseData.paymentMethod}
                    onChange={(e) => setPurchaseData({ ...purchaseData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="BANK_TRANSFER">Bank IMPS / NEFT</option>
                    <option value="RAZORPAY">Razorpay Online Gateway</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={purchaseData.discountAmount}
                    onChange={(e) => setPurchaseData({ ...purchaseData, discountAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Paid Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={purchaseData.paidAmount}
                    onChange={(e) => setPurchaseData({ ...purchaseData, paidAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
                >
                  Confirm & Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Freeze Subscription Modal */}
      {showFreezeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Freeze Membership Subscription</h3>
            <p className="text-xs text-slate-500">
              Freezing pauses membership and shifts expiry date forward by the frozen duration.
            </p>

            <form onSubmit={handleFreezeSubscription} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={freezeDays}
                  onChange={(e) => setFreezeDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Freeze</label>
                <input
                  type="text"
                  required
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="e.g. Vacation, Medical injury, Exam break"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowFreezeModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  Apply Freeze
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Measurement Modal */}
      {showMeasurementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Record Body Measurements</h3>
            <form onSubmit={handleAddMeasurement} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={measureData.weightKg}
                    onChange={(e) => setMeasureData({ ...measureData, weightKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Height (cm) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={measureData.heightCm}
                    onChange={(e) => setMeasureData({ ...measureData, heightCm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chest (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={measureData.chestCm}
                    onChange={(e) => setMeasureData({ ...measureData, chestCm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waist (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={measureData.waistCm}
                    onChange={(e) => setMeasureData({ ...measureData, waistCm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hips (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={measureData.hipsCm}
                    onChange={(e) => setMeasureData({ ...measureData, hipsCm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Body Fat %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={measureData.bodyFatPercentage}
                    onChange={(e) => setMeasureData({ ...measureData, bodyFatPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMeasurementModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
                >
                  Save Measurement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Edit Member Profile</h3>
                <p className="text-xs text-slate-500">Update personal, contact, and fitness information for {member.fullName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName || ''}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Read-only)</label>
                  <input
                    type="email"
                    disabled
                    value={editForm.email || ''}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg text-xs cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reset Password (Optional)</label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={editForm.password || ''}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={editForm.gender || 'MALE'}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth || ''}
                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={editForm.bloodGroup || 'O+'}
                    onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={editForm.emergencyContactName || ''}
                    onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    value={editForm.emergencyContactPhone || ''}
                    onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fitness Goals</label>
                  <input
                    type="text"
                    value={editForm.fitnessGoals || ''}
                    onChange={(e) => setEditForm({ ...editForm, fitnessGoals: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Conditions / History</label>
                <input
                  type="text"
                  value={editForm.medicalHistory || ''}
                  onChange={(e) => setEditForm({ ...editForm, medicalHistory: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tax Invoice Receipt Modal */}
      {selectedInvoice && (
        <ReceiptModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
    </div>
  );
};
