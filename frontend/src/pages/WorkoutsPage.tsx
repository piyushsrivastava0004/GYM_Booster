import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Flame,
  Layers,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { workoutApi } from '../services/api';
import { Exercise, WorkoutPlan } from '../types';
import { useAuth } from '../context/AuthContext';

export const WorkoutsPage: React.FC = () => {
  const { isTrainer, isOwner, isAdmin, isMember } = useAuth();
  const canManage = isTrainer || isOwner || isAdmin;

  const [activeTab, setActiveTab] = useState<'templates' | 'library'>('templates');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Exercise Filter
  const [exerciseSearch, setExerciseSearch] = useState<string>('');
  const [muscleFilter, setMuscleFilter] = useState<string>('');

  // Modals
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<boolean>(false);
  const [showAddPlanModal, setShowAddPlanModal] = useState<boolean>(false);

  // Exercise Form
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    muscleGroup: 'CHEST',
    equipment: 'Barbell',
    difficulty: 'INTERMEDIATE',
    instructions: 'Lower bar with control to mid-chest, drive up explosively.',
  });

  // Plan Form
  const [planForm, setPlanForm] = useState({
    name: '',
    description: 'Weekly resistance training routine',
    difficulty: 'INTERMEDIATE',
    isTemplate: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [exRes, tmplRes] = await Promise.all([
        workoutApi.getExercises(),
        workoutApi.getTemplates(),
      ]);
      setExercises(exRes.data || []);
      setTemplates(tmplRes.data || []);
    } catch (err) {
      console.error('Failed to load workouts data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workoutApi.createExercise(exerciseForm);
      setShowAddExerciseModal(false);
      setExerciseForm({
        name: '',
        muscleGroup: 'CHEST',
        equipment: 'Barbell',
        difficulty: 'INTERMEDIATE',
        instructions: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add exercise');
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workoutApi.createPlan({
        ...planForm,
        days: [
          {
            dayNumber: 1,
            title: 'Push Day (Chest, Shoulders, Triceps)',
            focusArea: 'Chest & Delts',
            exercises: [
              { exerciseId: exercises[0]?.id || 1, sets: 4, reps: 10, targetWeightKg: 60 },
            ],
          },
          {
            dayNumber: 2,
            title: 'Pull Day (Back & Biceps)',
            focusArea: 'Lat Width & Thickness',
            exercises: [
              { exerciseId: exercises[1]?.id || 2, sets: 4, reps: 8, targetWeightKg: 70 },
            ],
          },
        ],
      });
      setShowAddPlanModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create plan');
    }
  };

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      ex.equipment?.toLowerCase().includes(exerciseSearch.toLowerCase());
    const matchesMuscle = !muscleFilter || ex.muscleGroup === muscleFilter;
    return matchesSearch && matchesMuscle;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Dumbbell className="w-7 h-7 text-emerald-600" />
            Workout Library & Routines
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Exercise databases, weekly workout splits (Push/Pull/Legs), and personalized routines.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddExerciseModal(true)}
              className="inline-flex items-center px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition"
            >
              <Plus className="w-4 h-4 mr-1.5 text-slate-500" />
              Add Exercise
            </button>
            <button
              onClick={() => setShowAddPlanModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create Routine Template
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('templates')}
          className={`py-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'templates'
              ? 'border-emerald-600 text-emerald-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Workout Plan Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`py-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'library'
              ? 'border-emerald-600 text-emerald-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Exercise Database ({exercises.length})
        </button>
      </div>

      {/* Tab 1: Templates */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <Dumbbell className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No workout templates found</p>
              <p className="text-xs text-slate-400 mt-1">Create a routine to assign to members.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{tpl.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{tpl.description}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800">
                      {tpl.difficulty}
                    </span>
                  </div>

                  <div className="space-y-3 pt-2">
                    {tpl.days?.map((day) => (
                      <div
                        key={day.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5"
                      >
                        <div className="flex justify-between text-xs font-bold text-slate-800">
                          <span>Day {day.dayNumber}: {day.title}</span>
                          <span className="text-emerald-700 font-normal">{day.focusArea}</span>
                        </div>
                        <div className="divide-y divide-slate-200/60 text-xs text-slate-600">
                          {day.exercises?.map((ex) => (
                            <div key={ex.id} className="py-1 flex justify-between">
                              <span>{ex.exerciseName}</span>
                              <span className="font-mono text-slate-500">
                                {ex.sets} sets × {ex.reps} reps ({ex.targetWeightKg || 0}kg)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Exercise Library */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search exercises by name, equipment (e.g. Bench Press, Dumbbell)..."
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={muscleFilter}
              onChange={(e) => setMuscleFilter(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700"
            >
              <option value="">All Muscle Groups</option>
              <option value="CHEST">Chest</option>
              <option value="BACK">Back</option>
              <option value="LEGS">Legs</option>
              <option value="SHOULDERS">Shoulders</option>
              <option value="ARMS">Arms</option>
              <option value="CORE">Core</option>
              <option value="CARDIO">Cardio</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExercises.map((ex) => (
              <div
                key={ex.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 transition space-y-2"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-900 text-sm">{ex.name}</h4>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {ex.muscleGroup}
                  </span>
                </div>
                <div className="text-xs text-slate-500">Equipment: {ex.equipment || 'Bodyweight'}</div>
                <p className="text-xs text-slate-600 line-clamp-2">{ex.instructions}</p>
                <div className="pt-2 flex justify-between items-center text-xs border-t border-slate-100">
                  <span className="text-slate-400 font-medium">Difficulty:</span>
                  <span className="font-semibold text-slate-700">{ex.difficulty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Exercise Modal */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Add Exercise to Catalog</h3>
            <form onSubmit={handleAddExercise} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exercise Name *</label>
                <input
                  type="text"
                  required
                  value={exerciseForm.name}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="e.g. Romanian Deadlift"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Muscle Group</label>
                  <select
                    value={exerciseForm.muscleGroup}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, muscleGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    <option value="CHEST">Chest</option>
                    <option value="BACK">Back</option>
                    <option value="LEGS">Legs</option>
                    <option value="SHOULDERS">Shoulders</option>
                    <option value="ARMS">Arms</option>
                    <option value="CORE">Core</option>
                    <option value="CARDIO">Cardio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment</label>
                  <input
                    type="text"
                    value={exerciseForm.equipment}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, equipment: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="Barbell, Dumbbell..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Form Instructions</label>
                <textarea
                  rows={3}
                  value={exerciseForm.instructions}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, instructions: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="Hinge at the hips, keep chest up, feel tension in hamstrings..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddExerciseModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                >
                  Add Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Plan Template Modal */}
      {showAddPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Create Workout Routine Template</h3>
            <form onSubmit={handleAddPlan} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Routine Name *</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="e.g. 5-Day Push Pull Legs Hypertrophy"
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                <select
                  value={planForm.difficulty}
                  onChange={(e) => setPlanForm({ ...planForm, difficulty: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
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
                  Save Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
