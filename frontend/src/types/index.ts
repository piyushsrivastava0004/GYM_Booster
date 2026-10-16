export type RoleType =
  | 'ROLE_GYM_OWNER'
  | 'ROLE_ADMINISTRATOR'
  | 'ROLE_RECEPTIONIST'
  | 'ROLE_TRAINER'
  | 'ROLE_NUTRITIONIST'
  | 'ROLE_ACCOUNTANT'
  | 'ROLE_INVENTORY_MANAGER'
  | 'ROLE_MEMBER';

export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'FROZEN' | 'EXPIRED' | 'PENDING' | 'CANCELLED';
export type PlanDurationType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL' | 'CUSTOM';
export type PlanCategory = 'GENERAL' | 'TRIAL' | 'FAMILY' | 'COUPLE' | 'STUDENT' | 'CORPORATE' | 'PERSONAL_TRAINING' | 'GROUP_CLASS';
export type SubscriptionStatus = 'ACTIVE' | 'PENDING_ACTIVATION' | 'FROZEN' | 'EXPIRED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'RAZORPAY';
export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIALLY_PAID' | 'FAILED' | 'REFUNDED';
export type AttendanceStatus = 'CHECKED_IN' | 'CHECKED_OUT' | 'DENIED' | 'MANUAL_OVERRIDE';
export type EquipmentStatus = 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER' | 'DECOMMISSIONED';
export type ExpenseCategory = 'RENT' | 'UTILITIES' | 'SALARIES' | 'REPAIRS' | 'EQUIPMENT_PURCHASE' | 'MARKETING' | 'MAINTENANCE' | 'MISCELLANEOUS';
export type ClassBookingStatus = 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED' | 'ATTENDED' | 'NO_SHOW';
export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type NotificationType = 'EXPIRY_ALERT' | 'PAYMENT_REMINDER' | 'INVOICE_GENERATED' | 'CLASS_BOOKED' | 'WORKOUT_ASSIGNED' | 'DIET_ASSIGNED' | 'LOW_STOCK_ALERT' | 'ANNOUNCEMENT' | 'GENERAL';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: RoleType;
  branchId?: number;
  branchName?: string;
}

export interface AuthResponse extends User {
  token: string;
  type: string;
}

export interface Branch {
  id: number;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  currency: string;
  timezone: string;
  active: boolean;
}

export interface Member {
  id: number;
  userId: number;
  memberCode: string;
  fullName: string;
  email: string;
  phone: string;
  branchId?: number;
  branchName?: string;
  dateOfBirth?: string;
  gender?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodGroup?: string;
  address?: string;
  fitnessGoals?: string;
  medicalHistory?: string;
  assignedTrainerId?: number;
  assignedTrainerName?: string;
  joinDate: string;
  status: MemberStatus;
  qrCodeData: string;
  notes?: string;
  activePlanName?: string;
  membershipExpiryDate?: string;
  createdAt: string;
}

export interface MembershipPlan {
  id: number;
  branchId?: number;
  branchName?: string;
  name: string;
  code: string;
  description?: string;
  durationType: PlanDurationType;
  durationDays: number;
  category: PlanCategory;
  basePrice: number;
  taxPercent: number;
  totalAmount: number;
  discountPercent?: number;
  guestPasses?: number;
  maxFreezes?: number;
  maxFreezeDays?: number;
  active: boolean;
}

export interface Subscription {
  id: number;
  memberId: number;
  memberName: string;
  memberCode: string;
  planId: number;
  planName: string;
  branchId?: number;
  branchName?: string;
  startDate: string;
  endDate: string;
  originalEndDate: string;
  status: SubscriptionStatus;
  frozenAt?: string;
  freezeEnd?: string;
  freezesUsed: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  notes?: string;
}

export interface Payment {
  id: number;
  transactionId: string;
  subscriptionId?: number;
  memberId: number;
  memberName: string;
  memberCode: string;
  branchId?: number;
  branchName?: string;
  amount: number;
  taxAmount: number;
  discountAmount: number;
  netAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  idempotencyKey?: string;
  paymentDate: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  member: { id: number; fullName: string; email: string };
  branch?: { id: number; name: string };
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  totalAmount?: number;
  invoiceDate: string;
  dueDate?: string;
  status: string;
}

export interface Attendance {
  id: number;
  memberId: number;
  memberName: string;
  memberCode: string;
  branchId?: number;
  branchName?: string;
  checkInTime: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  verificationMethod?: string;
  accessMethod?: string;
  overrideReason?: string;
  notes?: string;
  overrideByName?: string;
}

export interface Staff {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  role: RoleType;
  branchId?: number;
  branchName?: string;
  staffCode?: string;
  designation?: string;
  department?: string;
  qualification?: string;
  specialties?: string;
  baseSalary?: number;
  commissionPercent?: number;
  commissionPercentage?: number;
  dateOfJoining?: string;
  status: string;
}

export interface StaffShift {
  id: number;
  staffId: number;
  staffName?: string;
  branchId?: number;
  dayOfWeek: any;
  startTime: string;
  endTime: string;
  active?: boolean;
}

export interface StaffLeave {
  id: number;
  staffId: number;
  staffName?: string;
  startDate: string;
  endDate: string;
  leaveType?: string;
  reason: string;
  status: string;
}

export interface Exercise {
  id: number;
  name: string;
  muscleGroup: string;
  equipmentNeeded?: string;
  equipment?: string;
  difficulty: string;
  instructions?: string;
  mediaUrl?: string;
}

export interface WorkoutPlan {
  id: number;
  name: string;
  description?: string;
  createdById?: number;
  createdByName?: string;
  memberId?: number;
  memberName?: string;
  isTemplate?: boolean;
  targetGoal?: string;
  difficulty?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  days?: {
    id: number;
    dayOfWeek?: number;
    dayNumber?: number;
    dayName?: string;
    title?: string;
    focusArea?: string;
    isRestDay?: boolean;
    exercises: {
      id: number;
      exerciseId: number;
      exerciseName: string;
      muscleGroup?: string;
      sets: number;
      reps: number;
      weightKg?: number;
      targetWeightKg?: number;
      restTimeSeconds?: number;
      notes?: string;
    }[];
  }[];
}

export interface WorkoutLog {
  id: number;
  memberId: number;
  memberName?: string;
  exerciseId: number;
  exerciseName?: string;
  muscleGroup?: string;
  workoutDate: string;
  setsCompleted: number;
  repsCompleted: number;
  weightUsedKg?: number;
  notes?: string;
  verifiedByTrainer?: boolean;
}

export interface DietPlan {
  id: number;
  name: string;
  description?: string;
  createdById?: number;
  createdByName?: string;
  memberId?: number;
  memberName?: string;
  isTemplate?: boolean;
  dailyCalories?: number;
  targetCalories?: number;
  proteinGrams?: number;
  targetProteinGrams?: number;
  carbsGrams?: number;
  targetCarbsGrams?: number;
  fatGrams?: number;
  targetFatGrams?: number;
  dietaryPreference?: string;
  allergyAlerts?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  mealItems?: {
    id: number;
    mealTime?: string;
    timing?: string;
    mealName?: string;
    foodName?: string;
    foodItem?: string;
    quantity?: string;
    portionSize?: string;
    calories?: number;
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
    notes?: string;
  }[];
}

export interface DietLog {
  id: number;
  memberId: number;
  memberName?: string;
  logDate: string;
  waterIntakeLiters: number;
  mealsFollowed: number;
  caloriesConsumed?: number;
  notes?: string;
}

export interface FitnessMeasurement {
  id: number;
  memberId: number;
  recordedDate?: string;
  measurementDate?: string;
  weightKg: number;
  heightCm?: number;
  bmi?: number;
  bodyFatPercent?: number;
  bodyFatPercentage?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  bicepCm?: number;
  bicepsCm?: number;
  thighsCm?: number;
  notes?: string;
}

export interface FitnessGoal {
  id: number;
  memberId: number;
  goalType: string;
  targetValue: number;
  currentValue?: number;
  unit: string;
  targetDate?: string;
  status: string;
  notes?: string;
  description?: string;
}

export interface GroupClass {
  id: number;
  branchId?: number;
  branchName?: string;
  trainerId: number;
  trainerName: string;
  name: string;
  description?: string;
  roomName?: string;
  room?: string;
  capacity?: number;
  maxCapacity?: number;
  bookedCount?: number;
  currentBookingsCount?: number;
  startTime: string;
  endTime: string;
  dayOfWeek?: number;
  recurring?: boolean;
  recurringDays?: string;
  active?: boolean;
}

export interface ClassBooking {
  id: number;
  groupClassId: number;
  className: string;
  trainerName: string;
  roomName?: string;
  startTime: string;
  endTime: string;
  memberId: number;
  memberName: string;
  bookingDate: string;
  classDate: string;
  status: ClassBookingStatus;
  waitlistPosition?: number;
}

export interface TrainerAppointment {
  id: number;
  trainerId: number;
  trainerName: string;
  memberId: number;
  memberName: string;
  branchId?: number;
  appointmentDate?: string;
  startTime: string;
  endTime: string;
  sessionType?: string;
  status: AppointmentStatus;
  notes?: string;
  sessionNotes?: string;
}

export interface Equipment {
  id: number;
  branchId?: number;
  branchName?: string;
  name: string;
  brand?: string;
  modelNumber?: string;
  serialNumber?: string;
  category?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  purchasePrice?: number;
  warrantyExpiryDate?: string;
  warrantyUntil?: string;
  status: EquipmentStatus;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
}

export interface EquipmentMaintenance {
  id: number;
  equipmentId: number;
  equipmentName?: string;
  maintenanceDate: string;
  cost: number;
  description: string;
  vendorName?: string;
  performedBy?: string;
  status: string;
}

export type MaintenanceDto = EquipmentMaintenance;

export interface InventoryItem {
  id: number;
  branchId?: number;
  branchName?: string;
  name: string;
  sku: string;
  category?: string;
  unitPrice: number;
  sellingPrice?: number;
  costPrice?: number;
  quantity?: number;
  quantityInStock?: number;
  reorderThreshold: number;
  isLowStock?: boolean;
  active?: boolean;
}

export interface InventoryMovement {
  id: number;
  itemId: number;
  itemName: string;
  sku: string;
  movementType: string;
  quantity: number;
  unitPrice?: number;
  totalAmount?: number;
  reason?: string;
  recordedById?: number;
  recordedByName?: string;
  createdAt: string;
}

export interface Expense {
  id: number;
  branchId?: number;
  branchName?: string;
  category: ExpenseCategory;
  title: string;
  description?: string;
  amount: number;
  expenseDate: string;
  vendorName?: string;
  paidTo?: string;
  receiptUrl?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  paymentMethod?: string;
  recordedById?: number;
  recordedByName?: string;
}

export interface NotificationItem {
  id: number;
  recipientId: number;
  recipientName?: string;
  title: string;
  message: string;
  type: NotificationType;
  channel: string;
  isRead: boolean;
  isSent: boolean;
  sentTime?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  activeMembersCount: number;
  totalMembersCount: number;
  expiringMembershipsCount: number;
  overduePaymentsCount: number;
  monthCollections: number;
  monthExpenses: number;
  estimatedNetProfit: number;
  outstandingReceivables: number;
  todayCheckInsCount: number;
  lowStockCount: number;
  retentionRatePercent: number;
  revenueTrend: {
    month: string;
    collections: number;
    expenses: number;
    profit: number;
  }[];
  peakHours: {
    hourLabel: string;
    count: number;
  }[];
  recentActivities: {
    title: string;
    description: string;
    timestamp: string;
    type: string;
  }[];
  membersByStatus: Record<string, number>;
}

export interface FinancialSummary {
  totalInvoicedRevenue?: number;
  totalCashCollections?: number;
  totalRevenue?: number;
  totalExpenses?: number;
  netProfit?: number;
  profitMarginPercent?: number;
  totalOutstandingReceivables?: number;
  totalRefunds?: number;
  totalOperatingExpenses?: number;
  netProfitOrLoss?: number;
  expensesByCategory?: Record<string, number>;
}

export interface AuditLog {
  id: number;
  userId?: number;
  username: string;
  action: string;
  entityName?: string;
  entityId?: number;
  branchId?: number;
  branchName?: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
}
