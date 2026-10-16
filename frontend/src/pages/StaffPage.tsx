import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Calendar,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  DollarSign,
  Mail,
  Phone,
  Shield,
  Briefcase,
  Pencil,
} from 'lucide-react';
import { staffApi, branchAndSettingsApi } from '../services/api';
import { Staff, StaffShift, StaffLeave, RoleType, Branch } from '../types';
import { useAuth } from '../context/AuthContext';

export const StaffPage: React.FC = () => {
  const { currentBranch, isOwner, isAdmin } = useAuth();
  const canManage = isOwner || isAdmin;

  const [activeTab, setActiveTab] = useState<'directory' | 'shifts' | 'leaves'>('directory');
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Shifts state
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

  // Modals
  const [showAddStaffModal, setShowAddStaffModal] = useState<boolean>(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showAddShiftModal, setShowAddShiftModal] = useState<boolean>(false);
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState<boolean>(false);

  // Forms
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    role: 'ROLE_TRAINER' as RoleType,
    designation: '',
    department: 'Fitness',
    qualification: '',
    specialties: '',
    baseSalary: 0,
    commissionPercentage: 0,
    status: 'ACTIVE',
    password: '',
  });
  const [staffForm, setStaffForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'ROLE_TRAINER' as RoleType,
    branchId: currentBranch?.id || 1,
    specialties: 'Hypertrophy & Weight Loss',
    qualification: 'ACE Certified Personal Trainer',
    baseSalary: 35000,
    commissionPercentage: 10,
  });

  const [shiftForm, setShiftForm] = useState({
    staffId: 0,
    dayOfWeek: 'MONDAY',
    startTime: '06:00',
    endTime: '14:00',
  });

  const [leaveForm, setLeaveForm] = useState({
    staffId: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    leaveType: 'CASUAL',
    reason: 'Family event',
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await staffApi.getAll(currentBranch?.id);
      setStaffList(res.data || []);
      if (res.data?.length > 0 && !selectedStaffId) {
        setSelectedStaffId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load staff list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    branchAndSettingsApi.getBranches().then((res) => setBranches(res.data || []));
  }, [currentBranch]);

  useEffect(() => {
    if (selectedStaffId && activeTab === 'shifts') {
      staffApi.getShifts(selectedStaffId).then((res) => setShifts(res.data || []));
    }
  }, [selectedStaffId, activeTab]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffApi.createStaff({
        ...staffForm,
        branchId: Number(staffForm.branchId) || currentBranch?.id || 1,
        baseSalary: Number(staffForm.baseSalary),
        commissionPercentage: Number(staffForm.commissionPercentage),
      });

      setShowAddStaffModal(false);
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add staff member');
    }
  };

  const openEditModal = (s: Staff) => {
    setEditingStaff(s);
    setEditForm({
      fullName: s.fullName || '',
      phone: s.phone || '',
      email: s.email || '',
      role: s.role || 'ROLE_TRAINER',
      designation: s.designation || '',
      department: s.department || 'Fitness',
      qualification: s.qualification || '',
      specialties: s.specialties || '',
      baseSalary: s.baseSalary || 0,
      commissionPercentage: s.commissionPercentage || 0,
      status: s.status || 'ACTIVE',
      password: '',
    });
    setShowEditStaffModal(true);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      await staffApi.updateStaff(editingStaff.id, {
        ...editForm,
        baseSalary: Number(editForm.baseSalary),
        commissionPercentage: Number(editForm.commissionPercentage),
      });
      setShowEditStaffModal(false);
      fetchStaff();
      alert('Staff profile updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update staff member');
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffApi.createShift({
        staffId: Number(shiftForm.staffId),
        dayOfWeek: shiftForm.dayOfWeek,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
      });

      setShowAddShiftModal(false);
      if (selectedStaffId) {
        staffApi.getShifts(selectedStaffId).then((res) => setShifts(res.data || []));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign shift');
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffApi.applyLeave({
        staffId: Number(leaveForm.staffId),
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        leaveType: leaveForm.leaveType,
        reason: leaveForm.reason,
      });

      setShowApplyLeaveModal(false);
      alert('Leave application submitted successfully.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to apply leave');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600" />
            Staff & Trainer Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage fitness trainers, receptionists, payroll rules, shifts, and leave approvals.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Staff Member
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('directory')}
          className={`py-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'directory'
              ? 'border-emerald-600 text-emerald-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Staff Directory ({staffList.length})
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          className={`py-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'shifts'
              ? 'border-emerald-600 text-emerald-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Work Shifts & Schedules
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`py-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'leaves'
              ? 'border-emerald-600 text-emerald-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Staff Leaves & Absences
        </button>
      </div>

      {/* Tab 1: Directory */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            staffList.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 font-bold text-base shadow-sm">
                        {s.fullName?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {s.staffCode || `STF-${s.id.toString().padStart(4, '0')}`}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">{s.fullName}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-50 text-emerald-800">
                        {s.role.replace('ROLE_', '')}
                      </span>
                      {canManage && (
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Edit Staff Member"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mt-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.phone}</span>
                    </div>
                    {s.qualification && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>{s.qualification}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="text-xs font-semibold text-slate-700 mb-1">Specialties:</div>
                  <p className="text-xs text-slate-500">{s.specialties || 'General Gym Floor'}</p>

                  <div className="mt-3 flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-500">Base Salary: ₹{s.baseSalary?.toLocaleString('en-IN') || 0}</span>
                    <span className="font-semibold text-emerald-700">Comm: {s.commissionPercentage || 0}%</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Shifts */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">Select Staff:</span>
              <select
                value={selectedStaffId || ''}
                onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.role.replace('ROLE_', '')})
                  </option>
                ))}
              </select>
            </div>

            {canManage && (
              <button
                onClick={() => {
                  if (selectedStaffId) setShiftForm({ ...shiftForm, staffId: selectedStaffId });
                  setShowAddShiftModal(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
              >
                + Assign Shift
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="px-6 py-3">Day of Week</th>
                  <th className="px-6 py-3">Start Time</th>
                  <th className="px-6 py-3">End Time</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No weekly shifts configured for this employee.
                    </td>
                  </tr>
                ) : (
                  shifts.map((sh) => (
                    <tr key={sh.id}>
                      <td className="px-6 py-4 font-bold text-slate-800">{sh.dayOfWeek}</td>
                      <td className="px-6 py-4 text-xs font-mono">{sh.startTime}</td>
                      <td className="px-6 py-4 text-xs font-mono">{sh.endTime}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          Active Shift
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Leaves */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Staff Leave Requests</h2>
            <button
              onClick={() => {
                if (staffList.length > 0) setLeaveForm({ ...leaveForm, staffId: staffList[0].id });
                setShowApplyLeaveModal(true);
              }}
              className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
            >
              + Apply Leave
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600">
            Staff leave workflows are active. Managers receive instant notifications upon submission for approval.
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">Add New Staff / Trainer</h3>
              <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={staffForm.fullName}
                    onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="e.g. Vikram Rao"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="vikram@fitpulse.in"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">System Username *</label>
                  <input
                    type="text"
                    required
                    value={staffForm.username}
                    onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="vikram.trainer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role Type *</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as RoleType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    <option value="ROLE_TRAINER">Fitness Trainer</option>
                    <option value="ROLE_RECEPTIONIST">Receptionist</option>
                    <option value="ROLE_NUTRITIONIST">Nutritionist</option>
                    <option value="ROLE_ACCOUNTANT">Accountant</option>
                    <option value="ROLE_INVENTORY_MANAGER">Inventory Manager</option>
                    <option value="ROLE_ADMINISTRATOR">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Base Monthly Salary (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={staffForm.baseSalary}
                    onChange={(e) => setStaffForm({ ...staffForm, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Commission %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={staffForm.commissionPercentage}
                    onChange={(e) => setStaffForm({ ...staffForm, commissionPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specialties & Certifications</label>
                <input
                  type="text"
                  value={staffForm.specialties}
                  onChange={(e) => setStaffForm({ ...staffForm, specialties: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="e.g. Crossfit L1, Weight Management, Bodybuilding"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Shift Modal */}
      {showAddShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Assign Working Shift</h3>
            <form onSubmit={handleCreateShift} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Day of Week</label>
                <select
                  value={shiftForm.dayOfWeek}
                  onChange={(e) => setShiftForm({ ...shiftForm, dayOfWeek: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                >
                  <option value="MONDAY">Monday</option>
                  <option value="TUESDAY">Tuesday</option>
                  <option value="WEDNESDAY">Wednesday</option>
                  <option value="THURSDAY">Thursday</option>
                  <option value="FRIDAY">Friday</option>
                  <option value="SATURDAY">Saturday</option>
                  <option value="SUNDAY">Sunday</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddShiftModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                >
                  Save Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Apply Staff Leave</h3>
            <form onSubmit={handleApplyLeave} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Member</label>
                <select
                  value={leaveForm.staffId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, staffId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.staffCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason</label>
                <input
                  type="text"
                  required
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowApplyLeaveModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditStaffModal && editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Edit Staff Profile</h3>
                <p className="text-xs text-slate-500">Update staff details, compensation, and status</p>
              </div>
              <button onClick={() => setShowEditStaffModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-base p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role Type *</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as RoleType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-900"
                  >
                    <option value="ROLE_TRAINER">Fitness Trainer</option>
                    <option value="ROLE_RECEPTIONIST">Receptionist</option>
                    <option value="ROLE_NUTRITIONIST">Nutritionist</option>
                    <option value="ROLE_ACCOUNTANT">Accountant</option>
                    <option value="ROLE_INVENTORY_MANAGER">Inventory Manager</option>
                    <option value="ROLE_ADMINISTRATOR">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Base Monthly Salary (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.baseSalary}
                    onChange={(e) => setEditForm({ ...editForm, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Commission %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editForm.commissionPercentage}
                    onChange={(e) => setEditForm({ ...editForm, commissionPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-900"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ON_LEAVE">ON LEAVE</option>
                    <option value="RESIGNED">RESIGNED</option>
                    <option value="TERMINATED">TERMINATED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reset Password (Optional)</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Leave blank to keep current"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
                <input
                  type="text"
                  value={editForm.qualification}
                  onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white placeholder-slate-400"
                  placeholder="e.g. ACSM Certified, ISSA Master Trainer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specialties</label>
                <input
                  type="text"
                  value={editForm.specialties}
                  onChange={(e) => setEditForm({ ...editForm, specialties: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white placeholder-slate-400"
                  placeholder="e.g. Hypertrophy, Crossfit, Injury Rehab"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditStaffModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition"
                >
                  Update Staff Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
