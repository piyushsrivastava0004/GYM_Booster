import axios from 'axios';
import {
  AuthResponse,
  Branch,
  DashboardMetrics,
  FinancialSummary,
  Member,
  MembershipPlan,
  Subscription,
  Payment,
  Invoice,
  Attendance,
  Staff,
  StaffShift,
  StaffLeave,
  Exercise,
  WorkoutPlan,
  WorkoutLog,
  DietPlan,
  DietLog,
  FitnessMeasurement,
  FitnessGoal,
  GroupClass,
  ClassBooking,
  TrainerAppointment,
  Equipment,
  MaintenanceDto,
  InventoryItem,
  InventoryMovement,
  Expense,
  NotificationItem,
  AuditLog,
} from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => api.post<AuthResponse>('/auth/login', data),
  register: (data: any) => api.post<AuthResponse>('/auth/register', data),
};

export const dashboardApi = {
  getMetrics: (branchId?: number) =>
    api.get<DashboardMetrics>('/dashboard/metrics', { params: { branchId } }),
};

export const membersApi = {
  search: (params?: any) => api.get<any>('/members', { params }),
  getAll: (branchId?: number) => api.get<Member[]>('/members/all', { params: { branchId } }),
  getById: (id: number) => api.get<Member>(`/members/${id}`),
  getByUserId: (userId: number) => api.get<Member>(`/members/user/${userId}`),
  lookup: (credential: string) => api.get<Member>('/members/lookup', { params: { credential } }),
  register: (data: any) => api.post<Member>('/members/register', data),
  update: (id: number, data: any) => api.put<Member>(`/members/${id}`, data),
  updateStatus: (id: number, status: string) =>
    api.patch<Member>(`/members/${id}/status`, null, { params: { status } }),
  exportCsvUrl: (branchId?: number) => `${API_BASE_URL}/reports/members/csv${branchId ? `?branchId=${branchId}` : ''}`,
  exportExcelUrl: (branchId?: number) => `${API_BASE_URL}/reports/members/excel${branchId ? `?branchId=${branchId}` : ''}`,
};

export const membershipApi = {
  getPlans: (branchId?: number) => api.get<MembershipPlan[]>('/plans', { params: { branchId } }),
  getPublicPlans: (branchId?: number) => api.get<MembershipPlan[]>('/plans/public', { params: { branchId } }),
  createPlan: (data: any) => api.post<MembershipPlan>('/plans', data),
  purchase: (data: any) => api.post<Subscription>('/subscriptions/purchase', data),
  getSubscriptions: (params?: any) => api.get<any>('/subscriptions', { params }),
  getMemberSubscriptions: (memberId: number) => api.get<Subscription[]>(`/subscriptions/member/${memberId}`),
  freeze: (id: number, data: any) => api.post<Subscription>(`/subscriptions/${id}/freeze`, data),
  unfreeze: (id: number) => api.post<Subscription>(`/subscriptions/${id}/unfreeze`),
  cancel: (id: number, reason?: string) => api.post<Subscription>(`/subscriptions/${id}/cancel`, null, { params: { reason } }),
};

export const attendanceApi = {
  checkIn: (data: any) => api.post<Attendance>('/attendance/check-in', data),
  checkOut: (memberId: number) => api.post<Attendance>(`/attendance/check-out/${memberId}`),
  override: (data: any) => api.post<Attendance>('/attendance/override', data),
  getLogs: (params?: any) => api.get<any>('/attendance/logs', { params }),
  getMemberAttendance: (memberId: number) => api.get<Attendance[]>(`/attendance/member/${memberId}`),
};

export const paymentsApi = {
  record: (data: any) => api.post<Payment>('/payments/record', data),
  getPayments: (params?: any) => api.get<any>('/payments', { params }),
  getMemberPayments: (memberId: number) => api.get<Payment[]>(`/payments/member/${memberId}`),
  getMemberInvoices: (memberId: number) => api.get<Invoice[]>(`/invoices/member/${memberId}`),
  createRazorpayOrder: (data: any) => api.post<any>('/payments/razorpay/create-order', data),
  verifyRazorpay: (data: any) => api.post<Payment>('/payments/razorpay/verify', null, { params: data }),
  processRefund: (data: any) => api.post<Payment>('/payments/refund', data),
  getInvoicePdfUrl: (invoiceId: number) => `${API_BASE_URL}/invoices/${invoiceId}/pdf`,
};

export const staffApi = {
  getAll: (branchId?: number) => api.get<Staff[]>('/staff', { params: { branchId } }),
  getTrainers: (branchId?: number) => api.get<Staff[]>('/staff/trainers', { params: { branchId } }),
  createStaff: (data: any) => api.post<Staff>('/staff', data),
  createShift: (data: any) => api.post<StaffShift>('/staff/shifts', data),
  getShifts: (staffId: number) => api.get<StaffShift[]>(`/staff/${staffId}/shifts`),
  applyLeave: (data: any) => api.post<StaffLeave>('/staff/leaves', data),
  updateLeaveStatus: (leaveId: number, status: string) =>
    api.patch<StaffLeave>(`/staff/leaves/${leaveId}/status`, null, { params: { status } }),
};

export const workoutApi = {
  getExercises: () => api.get<Exercise[]>('/exercises'),
  createExercise: (data: any) => api.post<Exercise>('/exercises', data),
  createPlan: (data: any) => api.post<WorkoutPlan>('/workouts/plans', data),
  getTemplates: () => api.get<WorkoutPlan[]>('/workouts/templates'),
  getMemberPlans: (memberId: number) => api.get<WorkoutPlan[]>(`/workouts/plans/member/${memberId}`),
  getPlanById: (id: number) => api.get<WorkoutPlan>(`/workouts/plans/${id}`),
  logWorkout: (data: any) => api.post<WorkoutLog>('/workouts/logs', data),
  getMemberLogs: (memberId: number) => api.get<WorkoutLog[]>(`/workouts/logs/member/${memberId}`),
};

export const dietApi = {
  createPlan: (data: any) => api.post<DietPlan>('/diet/plans', data),
  getTemplates: () => api.get<DietPlan[]>('/diet/templates'),
  getMemberPlans: (memberId: number) => api.get<DietPlan[]>(`/diet/plans/member/${memberId}`),
  getPlanById: (id: number) => api.get<DietPlan>(`/diet/plans/${id}`),
  logDaily: (data: any) => api.post<DietLog>('/diet/logs', data),
  getMemberLogs: (memberId: number) => api.get<DietLog[]>(`/diet/logs/member/${memberId}`),
};

export const fitnessApi = {
  recordMeasurement: (data: any) => api.post<FitnessMeasurement>('/fitness/measurements', data),
  getMeasurements: (memberId: number) => api.get<FitnessMeasurement[]>(`/fitness/measurements/member/${memberId}`),
  createGoal: (data: any) => api.post<FitnessGoal>('/fitness/goals', data),
  updateGoalStatus: (id: number, status: string, currentValue?: number) =>
    api.patch<FitnessGoal>(`/fitness/goals/${id}/status`, null, { params: { status, currentValue } }),
  getMemberGoals: (memberId: number) => api.get<FitnessGoal[]>(`/fitness/goals/member/${memberId}`),
};

export const classApi = {
  getClasses: (branchId?: number, date?: string) =>
    api.get<GroupClass[]>('/classes', { params: { branchId, date } }),
  createClass: (data: any) => api.post<GroupClass>('/classes', data),
  bookClass: (classId: number, memberId: number, classDate?: string) =>
    api.post<ClassBooking>(`/classes/${classId}/book`, null, { params: { memberId, classDate } }),
  cancelBooking: (bookingId: number) => api.post<ClassBooking>(`/classes/bookings/${bookingId}/cancel`),
  getMemberBookings: (memberId: number) => api.get<ClassBooking[]>(`/classes/bookings/member/${memberId}`),
  scheduleAppointment: (data: any) => api.post<TrainerAppointment>('/appointments', data),
  getTrainerAppointments: (trainerId: number, date?: string) =>
    api.get<TrainerAppointment[]>(`/appointments/trainer/${trainerId}`, { params: { date } }),
  getMemberAppointments: (memberId: number) =>
    api.get<TrainerAppointment[]>(`/appointments/member/${memberId}`),
};

export const inventoryApi = {
  getEquipment: (params?: any) => api.get<any>('/equipment', { params }),
  addEquipment: (data: any) => api.post<Equipment>('/equipment', data),
  recordMaintenance: (data: any) => api.post<MaintenanceDto>('/equipment/maintenance', data),
  getMaintenanceHistory: (equipmentId: number) =>
    api.get<MaintenanceDto[]>(`/equipment/${equipmentId}/maintenance`),
  getInventory: (params?: any) => api.get<any>('/inventory', { params }),
  addInventory: (data: any) => api.post<InventoryItem>('/inventory', data),
  getLowStockAlerts: (branchId?: number) => api.get<InventoryItem[]>('/inventory/alerts', { params: { branchId } }),
  recordMovement: (data: any) => api.post<InventoryMovement>('/inventory/movements', data),
};

export const expenseApi = {
  recordExpense: (data: any) => api.post<Expense>('/expenses', data),
  getExpenses: (params?: any) => api.get<any>('/expenses', { params }),
  getSummary: (branchId?: number, start?: string, end?: string) =>
    api.get<FinancialSummary>('/expenses/summary', { params: { branchId, start, end } }),
};

export const notificationApi = {
  getUserNotifications: (userId: number) => api.get<NotificationItem[]>(`/notifications/user/${userId}`),
  getUnreadCount: (userId: number) => api.get<number>(`/notifications/user/${userId}/unread-count`),
  markAsRead: (id: number) => api.patch(`/notifications/${id}/read`),
  dispatch: (data: any) => api.post<NotificationItem>('/notifications/dispatch', null, { params: data }),
};

export const branchAndSettingsApi = {
  getBranches: () => api.get<Branch[]>('/branches'),
  createBranch: (data: any) => api.post<Branch>('/branches', data),
  getSettings: (branchId?: number) => api.get<Record<string, string>>('/settings/public', { params: { branchId } }),
  saveSetting: (data: any) => api.post('/settings', null, { params: data }),
  getAuditLogs: (params?: any) => api.get<any>('/admin/audit-logs', { params }),
};

export default api;
