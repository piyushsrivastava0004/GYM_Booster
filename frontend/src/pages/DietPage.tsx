import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Plus,
  Flame,
  Droplet,
  PieChart,
  CheckCircle,
  Apple,
  Clock,
  Sparkles,
} from 'lucide-react';
import { dietApi } from '../services/api';
import { DietPlan } from '../types';
import { useAuth } from '../context/AuthContext';

export const DietPage: React.FC = () => {
  const { isNutritionist, isTrainer, isOwner, isAdmin } = useAuth();
  const canManage = isNutritionist || isTrainer || isOwner || isAdmin;

  const [templates, setTemplates] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [waterGlasses, setWaterGlasses] = useState<number>(5);

  // Modal
  const [showAddPlanModal, setShowAddPlanModal] = useState<boolean>(false);
  const [planForm, setPlanForm] = useState({
    name: 'High Protein Indian Lean Muscle',
    description: 'Designed with paneer, whey protein, dal, eggs, and oats for optimal recovery.',
    targetCalories: 2400,
    targetProteinGrams: 160,
    targetCarbsGrams: 220,
    targetFatGrams: 65,
    isTemplate: true,
  });

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await dietApi.getTemplates();
      setTemplates(res.data || []);
    } catch (err) {
      console.error('Failed to load diet templates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dietApi.createPlan({
        ...planForm,
        targetCalories: Number(planForm.targetCalories),
        targetProteinGrams: Number(planForm.targetProteinGrams),
        targetCarbsGrams: Number(planForm.targetCarbsGrams),
        targetFatGrams: Number(planForm.targetFatGrams),
        mealItems: [
          {
            mealName: 'Breakfast',
            timing: '08:00 AM',
            foodItem: 'Oatmeal with Almond Milk & 1 Scoop Whey',
            portionSize: '1 Bowl (300g)',
            calories: 450,
            proteinGrams: 35,
            carbsGrams: 55,
            fatGrams: 8,
          },
          {
            mealName: 'Lunch',
            timing: '01:00 PM',
            foodItem: 'Brown Rice with Grilled Paneer / Chicken & Dal',
            portionSize: '1 Plate (450g)',
            calories: 700,
            proteinGrams: 50,
            carbsGrams: 75,
            fatGrams: 20,
          },
          {
            mealName: 'Evening Snack',
            timing: '05:00 PM',
            foodItem: 'Roasted Chana, Sprouted Moong & Black Coffee',
            portionSize: '1 Bowl (150g)',
            calories: 250,
            proteinGrams: 18,
            carbsGrams: 35,
            fatGrams: 4,
          },
          {
            mealName: 'Dinner',
            timing: '08:30 PM',
            foodItem: 'Multigrain Roti with Soya Chunks Bhurji & Green Salad',
            portionSize: '2 Rotis + 1 Bowl Sabzi',
            calories: 600,
            proteinGrams: 45,
            carbsGrams: 50,
            fatGrams: 15,
          },
        ],
      });

      setShowAddPlanModal(false);
      fetchTemplates();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create meal plan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Utensils className="w-7 h-7 text-emerald-600" />
            Diet, Nutrition & Water Tracking
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Indian-centric meal plans, calorie targets, macro ratios (Carb/Protein/Fat), and hydration counters.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowAddPlanModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Diet Template
          </button>
        )}
      </div>

      {/* Daily Hydration Counter Widget */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-wider">
            <Droplet className="w-4 h-4 text-blue-400" />
            Daily Hydration Counter
          </div>
          <h3 className="text-xl font-bold">Goal: 8 Glasses (2.5L - 3.5L per day)</h3>
          <p className="text-xs text-blue-200">
            Optimal hydration promotes muscle protein synthesis, joint lubrication, and prevents cramping.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
              <button
                key={g}
                onClick={() => setWaterGlasses(g)}
                className={`w-9 h-12 rounded-lg border flex flex-col items-center justify-end pb-1 transition ${
                  g <= waterGlasses
                    ? 'bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50'
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                }`}
                title={`Glass ${g}`}
              >
                <Droplet className="w-3.5 h-3.5 text-white" />
              </button>
            ))}
          </div>
          <span className="text-xl font-black text-blue-300 whitespace-nowrap">
            {waterGlasses} / 8 Glasses
          </span>
        </div>
      </div>

      {/* Diet Plan Templates */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900">Standard Diet & Nutrition Templates</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Apple className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No diet plans created yet</p>
            <p className="text-xs text-slate-400 mt-1">Create a nutrition plan to assign to gym members.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-5"
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{tpl.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{tpl.description}</p>
                </div>

                {/* Macro Target Pills */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-amber-700 font-bold block uppercase">Calories</span>
                    <span className="text-sm font-black text-amber-950">{tpl.targetCalories}</span>
                  </div>
                  <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                    <span className="text-[10px] text-rose-700 font-bold block uppercase">Protein</span>
                    <span className="text-sm font-black text-rose-950">{tpl.targetProteinGrams}g</span>
                  </div>
                  <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-blue-700 font-bold block uppercase">Carbs</span>
                    <span className="text-sm font-black text-blue-950">{tpl.targetCarbsGrams}g</span>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 font-bold block uppercase">Fats</span>
                    <span className="text-sm font-black text-emerald-950">{tpl.targetFatGrams}g</span>
                  </div>
                </div>

                {/* Meal Items */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Meal Schedule & Recipes
                  </h4>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden text-xs">
                    {tpl.mealItems?.map((meal) => (
                      <div key={meal.id} className="p-3 bg-slate-50/50 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-900">{meal.mealName}</span>
                          <span className="text-slate-400 ml-1.5">({meal.timing || 'Anytime'})</span>
                          <p className="text-slate-600 mt-0.5">
                            {meal.foodItem} • {meal.portionSize}
                          </p>
                        </div>
                        <div className="text-right font-mono text-slate-600">
                          <div>{meal.calories} kcal</div>
                          <div className="text-rose-600 font-bold">{meal.proteinGrams}g P</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Diet Template Modal */}
      {showAddPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Create Nutrition Plan Template</h3>
            <form onSubmit={handleCreatePlan} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Calories</label>
                  <input
                    type="number"
                    value={planForm.targetCalories}
                    onChange={(e) => setPlanForm({ ...planForm, targetCalories: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={planForm.targetProteinGrams}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, targetProteinGrams: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-rose-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={planForm.targetCarbsGrams}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, targetCarbsGrams: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={planForm.targetFatGrams}
                    onChange={(e) => setPlanForm({ ...planForm, targetFatGrams: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddPlanModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                >
                  Publish Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
