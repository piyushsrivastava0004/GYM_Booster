import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  QrCode,
  IndianRupee,
  UserCheck,
  Dumbbell,
  Apple,
  TrendingUp,
  CalendarDays,
  Package,
  Receipt,
  FileBarChart,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, isOwner, isAdmin, isReceptionist, isTrainer, isNutritionist, isAccountant, isInventoryManager, isMember } = useAuth();

  const links = [
    // Dashboard (all staff)
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      visible: !isMember,
    },
    // Member Portal (for Gym Member)
    {
      to: '/portal',
      label: 'My Member Pass',
      icon: User,
      visible: isMember,
    },
    // Member Management
    {
      to: '/members',
      label: 'Members',
      icon: Users,
      visible: isOwner || isAdmin || isReceptionist || isTrainer || isNutritionist,
    },
    // Membership Plans & Subscriptions
    {
      to: '/plans',
      label: 'Plans & Subscriptions',
      icon: CreditCard,
      visible: isOwner || isAdmin || isReceptionist,
    },
    // Attendance & Access Control
    {
      to: '/attendance',
      label: 'Attendance & Gate',
      icon: QrCode,
      visible: isOwner || isAdmin || isReceptionist,
    },
    // Payments & Invoices
    {
      to: '/billing',
      label: 'Billing & Payments',
      icon: IndianRupee,
      visible: isOwner || isAdmin || isReceptionist || isAccountant,
    },
    // Trainers & Staff
    {
      to: '/staff',
      label: 'Staff & Trainers',
      icon: UserCheck,
      visible: isOwner || isAdmin,
    },
    // Workouts
    {
      to: '/workouts',
      label: 'Workouts & Exercises',
      icon: Dumbbell,
      visible: !isAccountant && !isInventoryManager,
    },
    // Diet & Nutrition
    {
      to: '/diet',
      label: 'Diet & Nutrition',
      icon: Apple,
      visible: !isAccountant && !isInventoryManager,
    },
    // Fitness Progress & Goals
    {
      to: '/fitness',
      label: 'Fitness Progress',
      icon: TrendingUp,
      visible: !isAccountant && !isInventoryManager,
    },
    // Group Classes & PT Appointments
    {
      to: '/classes',
      label: 'Classes & Booking',
      icon: CalendarDays,
      visible: true, // everyone can view or book classes
    },
    // Inventory & Equipment
    {
      to: '/inventory',
      label: 'Inventory & Equipment',
      icon: Package,
      visible: isOwner || isAdmin || isInventoryManager,
    },
    // Expenses & Accounting
    {
      to: '/expenses',
      label: 'Expenses & P&L',
      icon: Receipt,
      visible: isOwner || isAdmin || isAccountant,
    },
    // Reports & Analytics
    {
      to: '/reports',
      label: 'Reports & Exports',
      icon: FileBarChart,
      visible: isOwner || isAdmin || isAccountant,
    },
    // Settings & Branches
    {
      to: '/settings',
      label: 'Admin Settings',
      icon: Settings,
      visible: isOwner || isAdmin,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
        <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Navigation
        </p>
        {links
          .filter((link) => link.visible)
          .map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{link.label}</span>
              </NavLink>
            );
          })}
      </div>

      {/* Role badge footer */}
      <div className="mt-auto p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="truncate">
            <p className="font-semibold text-slate-300 truncate">{user?.fullName}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.role?.replace('ROLE_', '')}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
