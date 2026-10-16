import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Users,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  XCircle,
  UserCheck,
} from 'lucide-react';
import { classApi, staffApi, membersApi } from '../services/api';
import { GroupClass, ClassBooking, TrainerAppointment, Staff, Member } from '../types';
import { useAuth } from '../context/AuthContext';

export const ClassesPage: React.FC = () => {
  const { currentBranch, user, isMember, isTrainer, isOwner, isAdmin } = useAuth();
  const canManage = isOwner || isAdmin || isTrainer;

  const [activeTab, setActiveTab] = useState<'classes' | 'appointments'>('classes');
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [trainers, setTrainers] = useState<Staff[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showAddClassModal, setShowAddClassModal] = useState<boolean>(false);
  const [showSchedulePtModal, setShowSchedulePtModal] = useState<boolean>(false);

  // Class Form
  const [classForm, setClassForm] = useState({
    name: 'Zumba Cardio Dance',
    description: 'High-energy dance workout combining Latin rhythms and interval training.',
    trainerId: 0,
    branchId: currentBranch?.id || 1,
    room: 'Studio A (Wooden Floor)',
    maxCapacity: 25,
    startTime: '07:00',
    endTime: '08:00',
    recurringDays: 'MONDAY,WEDNESDAY,FRIDAY',
  });

  // PT Form
  const [ptForm, setPtForm] = useState({
    memberId: 0,
    trainerId: 0,
    startTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 90000000).toISOString().slice(0, 16),
    sessionType: 'PERSONAL_TRAINING',
    notes: 'Upper body hypertrophy & form check',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clsRes, trnRes] = await Promise.all([
        classApi.getClasses(currentBranch?.id),
        staffApi.getTrainers(currentBranch?.id),
      ]);
      setClasses(clsRes.data || []);
      setTrainers(trnRes.data || []);
      if (trnRes.data?.length > 0) {
        setClassForm((prev) => ({ ...prev, trainerId: trnRes.data[0].id }));
        setPtForm((prev) => ({ ...prev, trainerId: trnRes.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load classes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (!isMember) {
      membersApi.getAll(currentBranch?.id).then((res) => {
        setMembers(res.data || []);
        if (res.data?.length > 0) {
          setPtForm((prev) => ({ ...prev, memberId: res.data[0].id }));
        }
      });
    }
  }, [currentBranch]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await classApi.createClass({
        ...classForm,
        trainerId: Number(classForm.trainerId),
        branchId: Number(classForm.branchId) || currentBranch?.id || 1,
        maxCapacity: Number(classForm.maxCapacity),
      });

      setShowAddClassModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create group class');
    }
  };

  const handleBookClass = async (classId: number) => {
    try {
      // In member portal user.id maps to member, otherwise grab first member or prompt
      let mId = 1;
      if (isMember && user) {
        const memRes = await membersApi.getByUserId(user.id);
        mId = memRes.data.id;
      } else if (members.length > 0) {
        mId = members[0].id;
      }

      const res = await classApi.bookClass(
        classId,
        mId,
        new Date().toISOString().split('T')[0]
      );
      alert(`Booking status: ${res.data.status}! Confirmed reservation.`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Booking failed');
    }
  };

  const handleSchedulePt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await classApi.scheduleAppointment({
        ...ptForm,
        memberId: Number(ptForm.memberId),
        trainerId: Number(ptForm.trainerId),
        startTime: ptForm.startTime + ':00',
        endTime: ptForm.endTime + ':00',
      });

      setShowSchedulePtModal(false);
      alert('Personal training session scheduled successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Conflict: Trainer has an overlapping appointment!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-emerald-600" />
            Group Classes & Personal Training
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Studio group classes (Yoga, Zumba, HIIT) and 1-on-1 PT appointments with conflict prevention.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSchedulePtModal(true)}
              className="inline-flex items-center px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition"
            >
              <UserCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
              Schedule 1-on-1 PT
            </button>
            <button
              onClick={() => setShowAddClassModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create Group Class
            </button>
          </div>
        )}
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : classes.length === 0 ? (
          <div className="col-span-3 bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <CalendarIcon className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No scheduled group classes</p>
            <p className="text-xs text-slate-400 mt-1">Add Zumba, Yoga, or Spinning classes.</p>
          </div>
        ) : (
          classes.map((cls) => {
            const booked = cls.currentBookingsCount || 0;
            const cap = cls.maxCapacity || 20;
            const percent = Math.min(100, Math.round((booked / cap) * 100));

            return (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{cls.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{cls.description}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Studio Class
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mt-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-800">
                        {cls.startTime} - {cls.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cls.room || 'Main Studio'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Instructor: <strong>{cls.trainerName || 'Master Trainer'}</strong></span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Seat Occupancy:</span>
                      <span className="font-bold text-slate-800">
                        {booked} / {cap} Seats
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percent >= 90 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">
                    {cls.recurringDays || 'DAILY'}
                  </span>
                  <button
                    onClick={() => handleBookClass(cls.id)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition"
                  >
                    Reserve Seat
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Create Group Class Schedule</h3>
            <form onSubmit={handleCreateClass} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class Title *</label>
                <input
                  type="text"
                  required
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={classForm.description}
                  onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Instructor *</label>
                  <select
                    value={classForm.trainerId}
                    onChange={(e) => setClassForm({ ...classForm, trainerId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.specialties || 'Fitness'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room / Studio</label>
                  <input
                    type="text"
                    value={classForm.room}
                    onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={classForm.startTime}
                    onChange={(e) => setClassForm({ ...classForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={classForm.endTime}
                    onChange={(e) => setClassForm({ ...classForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={classForm.maxCapacity}
                    onChange={(e) => setClassForm({ ...classForm, maxCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Recurring Days</label>
                <input
                  type="text"
                  value={classForm.recurringDays}
                  onChange={(e) => setClassForm({ ...classForm, recurringDays: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  placeholder="MONDAY,WEDNESDAY,FRIDAY"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                >
                  Publish Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule PT Modal */}
      {showSchedulePtModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Schedule 1-on-1 PT Appointment</h3>
            <p className="text-xs text-slate-500">
              The backend ensures zero overlapping appointments for the selected trainer.
            </p>

            <form onSubmit={handleSchedulePt} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gym Member *</label>
                  <select
                    value={ptForm.memberId}
                    onChange={(e) => setPtForm({ ...ptForm, memberId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.memberCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fitness Trainer *</label>
                  <select
                    value={ptForm.trainerId}
                    onChange={(e) => setPtForm({ ...ptForm, trainerId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={ptForm.startTime}
                    onChange={(e) => setPtForm({ ...ptForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={ptForm.endTime}
                    onChange={(e) => setPtForm({ ...ptForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Session Goals / Notes</label>
                <input
                  type="text"
                  value={ptForm.notes}
                  onChange={(e) => setPtForm({ ...ptForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSchedulePtModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
