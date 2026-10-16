import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Shield, User, Lock, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState<string>('owner');
  const [password, setPassword] = useState<string>('Owner@123');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const loggedInUser = await login({ username, password });
      if (loggedInUser.role === 'ROLE_MEMBER') {
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  // Demo accounts for quick evaluation of all 8 roles
  const demoAccounts = [
    { role: 'Gym Owner', u: 'owner', p: 'Owner@123', desc: 'Full business, all branches, P&L' },
    { role: 'Administrator', u: 'admin', p: 'Admin@123', desc: 'Day-to-day operations' },
    { role: 'Receptionist', u: 'receptionist', p: 'Recept@123', desc: 'Member check-in, sales' },
    { role: 'Trainer', u: 'trainer_rahul', p: 'Trainer@123', desc: 'Workouts, PT appointments' },
    { role: 'Nutritionist', u: 'nutritionist_priya', p: 'Nutri@123', desc: 'Diet plans, macro targets' },
    { role: 'Accountant', u: 'accountant_amit', p: 'Account@123', desc: 'Billing, expenses, collections' },
    { role: 'Inventory Mgr', u: 'inventory_vikram', p: 'Invent@123', desc: 'Equipment, supplement stock' },
    { role: 'Gym Member', u: 'member_arjun', p: 'Member@123', desc: 'Personal mobile QR pass & logs' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/20 mb-4">
            <Dumbbell className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            FitPulse <span className="text-emerald-400">Gym Manager</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Enterprise Fitness Studio Management for India</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            </button>
          </form>

          {/* Demo Role Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              1-Click Demo Accounts (8 Roles)
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {demoAccounts.map((item) => (
                <button
                  key={item.u}
                  type="button"
                  onClick={() => {
                    setUsername(item.u);
                    setPassword(item.p);
                  }}
                  className={`p-2 rounded-lg border text-left transition ${
                    username === item.u
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <p className="text-[11px] font-bold leading-tight">{item.role}</p>
                  <p className="text-[9px] text-slate-500 truncate">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
