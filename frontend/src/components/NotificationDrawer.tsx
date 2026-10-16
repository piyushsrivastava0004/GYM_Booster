import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/api';
import { NotificationItem } from '../types';
import { X, Bell, CheckCircle2, AlertTriangle, Info, Calendar, Dumbbell, CreditCard } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const NotificationDrawer: React.FC<Props> = ({ onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user) {
      notificationApi.getUserNotifications(user.id)
        .then((res) => setNotifications(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'EXPIRY_ALERT':
      case 'LOW_STOCK_ALERT':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'PAYMENT_REMINDER':
      case 'INVOICE_GENERATED':
        return <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'CLASS_BOOKED':
        return <Calendar className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'WORKOUT_ASSIGNED':
      case 'DIET_ASSIGNED':
        return <Dumbbell className="w-4 h-4 text-purple-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Notification Center</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {notifications.filter((n) => !n.isRead).length} new
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-400">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">You are all caught up!</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                className={`p-3 rounded-xl border transition cursor-pointer ${
                  n.isRead
                    ? 'bg-slate-800/40 border-slate-800 text-slate-400'
                    : 'bg-slate-800/90 border-emerald-500/30 text-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-700/50 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-bold text-white truncate">{n.title}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mb-1">{n.message}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 font-semibold">
                        {n.channel}
                      </span>
                      {!n.isRead && (
                        <span className="text-[9px] font-bold text-emerald-400">Click to mark read</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
