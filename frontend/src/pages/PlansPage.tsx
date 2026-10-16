import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  CheckCircle,
  Tag,
  Clock,
  Users,
  Shield,
  Percent,
  Search,
  IndianRupee,
} from 'lucide-react';
import { membershipApi, branchAndSettingsApi } from '../services/api';
import { MembershipPlan, PlanDurationType, PlanCategory, Branch } from '../types';
import { useAuth } from '../context/AuthContext';

export const PlansPage: React.FC = () => {
  const { currentBranch, isOwner, isAdmin } = useAuth();
  const canManagePlans = isOwner || isAdmin;

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [branches, setBranches] = useState<Branch[]>([]);

  // Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    durationType: 'MONTHLY' as PlanDurationType,
    durationDays: 30,
    category: 'GENERAL' as PlanCategory,
    basePrice: 2000,
    taxPercent: 18.0,
    discountPercent: 0,
    guestPasses: 2,
    maxFreezes: 1,
    maxFreezeDays: 14,
    branchId: currentBranch?.id || 1,
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await membershipApi.getPlans(currentBranch?.id);
      setPlans(res.data || []);
    } catch (err) {
      console.error('Failed to fetch plans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [currentBranch]);

  useEffect(() => {
    branchAndSettingsApi.getBranches().then((res) => setBranches(res.data || []));
  }, []);

  const handleDurationChange = (type: PlanDurationType) => {
    let days = 30;
    if (type === 'DAILY') days = 1;
    else if (type === 'WEEKLY') days = 7;
    else if (type === 'MONTHLY') days = 30;
    else if (type === 'QUARTERLY') days = 90;
    else if (type === 'HALF_YEARLY') days = 180;
    else if (type === 'ANNUAL') days = 365;

    setFormData((prev) => ({
      ...prev,
      durationType: type,
      durationDays: days,
    }));
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        branchId: Number(formData.branchId) || currentBranch?.id || 1,
        basePrice: Number(formData.basePrice),
        taxPercent: Number(formData.taxPercent),
        discountPercent: Number(formData.discountPercent),
        durationDays: Number(formData.durationDays),
        guestPasses: Number(formData.guestPasses),
        maxFreezes: Number(formData.maxFreezes),
        maxFreezeDays: Number(formData.maxFreezeDays),
      };

      await membershipApi.createPlan(payload);
      setShowAddModal(false);
      setFormData({
        name: '',
        code: '',
        description: '',
        durationType: 'MONTHLY',
        durationDays: 30,
        category: 'GENERAL',
        basePrice: 2000,
        taxPercent: 18.0,
        discountPercent: 0,
        guestPasses: 2,
        maxFreezes: 1,
        maxFreezeDays: 14,
        branchId: currentBranch?.id || 1,
      });
      fetchPlans();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create plan. Ensure plan code is unique.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || plan.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const calculatedTax = (formData.basePrice * formData.taxPercent) / 100;
  const calculatedTotal = formData.basePrice + calculatedTax;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-7 h-7 text-emerald-600" />
            Membership Plans & Pricing
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure subscription tiers, Indian GST (18%) structures, freeze limits, and guest passes.
          </p>
        </div>

        {canManagePlans && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create New Plan
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search plans by name or code (e.g. ANNUAL-PRO)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Categories</option>
            <option value="GENERAL">General</option>
            <option value="PERSONAL_TRAINING">Personal Training</option>
            <option value="COUPLE">Couple</option>
            <option value="STUDENT">Student</option>
            <option value="CORPORATE">Corporate</option>
            <option value="TRIAL">Trial</option>
          </select>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">No membership plans found</p>
          <p className="text-xs text-slate-400 mt-1">Create a plan or adjust filter parameters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden relative"
            >
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {plan.code}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">{plan.name}</h3>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {plan.category.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                  {plan.description || 'Full gym facility access, locker room amenities, and expert floor assistance.'}
                </p>

                {/* Pricing Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-black text-slate-900">₹{plan.totalAmount}</span>
                    <span className="text-xs text-slate-500 ml-2 font-medium">
                      / {plan.durationDays} Days ({plan.durationType})
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                    <span>Base: ₹{plan.basePrice}</span>
                    <span>+ {plan.taxPercent}% GST: ₹{(plan.totalAmount - plan.basePrice).toFixed(2)}</span>
                  </div>
                </div>

                {/* Features list */}
                <div className="space-y-2 text-xs text-slate-600 pt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Duration: <strong>{plan.durationDays} Days</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Freezes Allowed: <strong>{plan.maxFreezes || 0} times</strong> (Max {plan.maxFreezeDays || 0} days total)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Guest Passes: <strong>{plan.guestPasses || 0} complimentary passes</strong></span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Branch: {plan.branchName || 'All Branches'}</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Standard Plan
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Create New Membership Plan</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure plan pricing with Indian GST and duration parameters.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreatePlan} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Gold Annual Membership"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                    placeholder="e.g. GOLD-ANNUAL"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Includes steam bath, cardio zone, and group classes"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as PlanCategory })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="GENERAL">General</option>
                    <option value="PERSONAL_TRAINING">Personal Training</option>
                    <option value="COUPLE">Couple</option>
                    <option value="STUDENT">Student</option>
                    <option value="CORPORATE">Corporate</option>
                    <option value="TRIAL">Trial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration Type</label>
                  <select
                    value={formData.durationType}
                    onChange={(e) => handleDurationChange(e.target.value as PlanDurationType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="DAILY">Daily (1 Day)</option>
                    <option value="WEEKLY">Weekly (7 Days)</option>
                    <option value="MONTHLY">Monthly (30 Days)</option>
                    <option value="QUARTERLY">Quarterly (90 Days)</option>
                    <option value="HALF_YEARLY">Half Yearly (180 Days)</option>
                    <option value="ANNUAL">Annual (365 Days)</option>
                  </select>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Pricing & Indian GST Calculation
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Base Price (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">GST Rate (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.taxPercent}
                      onChange={(e) => setFormData({ ...formData, taxPercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Total Bill (₹)</label>
                    <div className="px-3 py-2 border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-lg font-bold">
                      ₹{calculatedTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Privileges & Freezes */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Guest Passes</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.guestPasses}
                    onChange={(e) => setFormData({ ...formData, guestPasses: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Freezes</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.maxFreezes}
                    onChange={(e) => setFormData({ ...formData, maxFreezes: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Freeze Days</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.maxFreezeDays}
                    onChange={(e) => setFormData({ ...formData, maxFreezeDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Publish Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
