import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Wrench,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Search,
  Filter,
} from 'lucide-react';
import { inventoryApi } from '../services/api';
import {
  Equipment,
  EquipmentStatus,
  MaintenanceDto,
  InventoryItem,
  InventoryMovement,
} from '../types';
import { useAuth } from '../context/AuthContext';

export const InventoryPage: React.FC = () => {
  const { currentBranch, isOwner, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'equipment' | 'inventory'>('equipment');
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState<boolean>(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState<boolean>(false);
  const [showAddStockModal, setShowAddStockModal] = useState<boolean>(false);
  const [showMovementModal, setShowMovementModal] = useState<boolean>(false);

  // Form States
  const [equipmentForm, setEquipmentForm] = useState({
    name: 'LifeFitness Treadmill 95T',
    brand: 'LifeFitness',
    modelNumber: 'LF-95T',
    serialNumber: 'SN-LF-2026-88',
    purchasePrice: 185000,
    warrantyUntil: '2028-12-31',
    status: 'OPERATIONAL' as EquipmentStatus,
    branchId: currentBranch?.id || 1,
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    equipmentId: 0,
    issueDescription: 'Motor belt lubrication and tension calibration',
    cost: 4500,
    technicianName: 'Suresh Service Tech',
    performedAt: new Date().toISOString().split('T')[0],
  });

  const [itemForm, setItemForm] = useState({
    name: 'Optimum Nutrition Gold Standard Whey (2kg)',
    sku: 'SUPP-ON-WHEY-2KG',
    category: 'SUPPLEMENT',
    quantity: 24,
    reorderThreshold: 5,
    unitPrice: 5800,
    costPrice: 4600,
    branchId: currentBranch?.id || 1,
  });

  const [movementForm, setMovementForm] = useState({
    itemId: 0,
    movementType: 'IN',
    quantity: 10,
    reason: 'Vendor replenishment shipment',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eqRes, invRes, alertRes] = await Promise.all([
        inventoryApi.getEquipment({ branchId: currentBranch?.id }),
        inventoryApi.getInventory({ branchId: currentBranch?.id }),
        inventoryApi.getLowStockAlerts(currentBranch?.id),
      ]);
      setEquipmentList(eqRes.data.content || eqRes.data || []);
      setInventoryList(invRes.data.content || invRes.data || []);
      setLowStockAlerts(alertRes.data || []);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentBranch]);

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryApi.addEquipment({
        ...equipmentForm,
        purchasePrice: Number(equipmentForm.purchasePrice),
        branchId: currentBranch?.id || 1,
      });
      setShowAddEquipmentModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add equipment');
    }
  };

  const handleRecordMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryApi.recordMaintenance({
        ...maintenanceForm,
        cost: Number(maintenanceForm.cost),
      });
      setShowMaintenanceModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record maintenance');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryApi.addInventory({
        ...itemForm,
        quantity: Number(itemForm.quantity),
        reorderThreshold: Number(itemForm.reorderThreshold),
        unitPrice: Number(itemForm.unitPrice),
        costPrice: Number(itemForm.costPrice),
        branchId: currentBranch?.id || 1,
      });
      setShowAddStockModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add item');
    }
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryApi.recordMovement({
        ...movementForm,
        quantity: Number(movementForm.quantity),
      });
      setShowMovementModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record stock movement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-emerald-600" />
            Equipment & Inventory Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gym equipment maintenance logs, supplement merchandise stock, and low-inventory alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'equipment' ? (
            <button
              onClick={() => setShowAddEquipmentModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Equipment
            </button>
          ) : (
            <button
              onClick={() => setShowAddStockModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Inventory SKU
            </button>
          )}
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockAlerts.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Low Stock Threshold Alerts ({lowStockAlerts.length} items)
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                The following products are near exhaustion:{' '}
                {lowStockAlerts.map((i) => `${i.name} (${i.quantity} left)`).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 flex space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('equipment')}
          className={`py-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'equipment'
              ? 'border-emerald-600 text-emerald-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Gym Machinery & Equipment ({equipmentList.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'inventory'
              ? 'border-emerald-600 text-emerald-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          Supplements & Merchandise Stock ({inventoryList.length})
        </button>
      </div>

      {/* Tab 1: Equipment */}
      {activeTab === 'equipment' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
              <tr>
                <th className="px-6 py-3.5">Equipment Name & Model</th>
                <th className="px-6 py-3.5">Serial #</th>
                <th className="px-6 py-3.5">Purchase Cost</th>
                <th className="px-6 py-3.5">Warranty End</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {equipmentList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No gym equipment registered.
                  </td>
                </tr>
              ) : (
                equipmentList.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{eq.name}</div>
                      <div className="text-xs text-slate-500">{eq.brand} • {eq.modelNumber || 'Standard'}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{eq.serialNumber || 'N/A'}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">₹{eq.purchasePrice?.toLocaleString('en-IN') || 0}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {eq.warrantyUntil ? new Date(eq.warrantyUntil).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          eq.status === 'OPERATIONAL'
                            ? 'bg-emerald-100 text-emerald-800'
                            : eq.status === 'UNDER_MAINTENANCE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {eq.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setMaintenanceForm({ ...maintenanceForm, equipmentId: eq.id });
                          setShowMaintenanceModal(true);
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                      >
                        Log Service
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Inventory */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Product SKU & Title</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Stock Level</th>
                  <th className="px-6 py-3.5">Unit Selling Price</th>
                  <th className="px-6 py-3.5">Cost Price</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No stock records found.
                    </td>
                  </tr>
                ) : (
                  inventoryList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <span className="font-mono text-xs text-emerald-700">{item.sku}</span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              item.quantity <= (item.reorderThreshold || 5)
                                ? 'text-rose-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {item.quantity} units
                          </span>
                          {item.quantity <= (item.reorderThreshold || 5) && (
                            <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                              Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">₹{item.unitPrice}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">₹{item.costPrice}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setMovementForm({ ...movementForm, itemId: item.id });
                            setShowMovementModal(true);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                        >
                          Stock In / Out
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddEquipmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Add Gym Equipment</h3>
            <form onSubmit={handleAddEquipment} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Name *</label>
                <input
                  type="text"
                  required
                  value={equipmentForm.name}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={equipmentForm.brand}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Model #</label>
                  <input
                    type="text"
                    value={equipmentForm.modelNumber}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, modelNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={equipmentForm.serialNumber}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    value={equipmentForm.purchasePrice}
                    onChange={(e) =>
                      setEquipmentForm({ ...equipmentForm, purchasePrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Warranty Expiry</label>
                <input
                  type="date"
                  value={equipmentForm.warrantyUntil}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, warrantyUntil: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddEquipmentModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                >
                  Register Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Record Maintenance & Repair</h3>
            <form onSubmit={handleRecordMaintenance} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Description *</label>
                <textarea
                  required
                  rows={3}
                  value={maintenanceForm.issueDescription}
                  onChange={(e) =>
                    setMaintenanceForm({ ...maintenanceForm, issueDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={maintenanceForm.cost}
                    onChange={(e) =>
                      setMaintenanceForm({ ...maintenanceForm, cost: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Technician Name</label>
                  <input
                    type="text"
                    required
                    value={maintenanceForm.technicianName}
                    onChange={(e) =>
                      setMaintenanceForm({ ...maintenanceForm, technicianName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                >
                  Save Maintenance Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Inventory SKU Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Add Inventory Product SKU</h3>
            <form onSubmit={handleAddItem} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={itemForm.sku}
                    onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={itemForm.unitPrice}
                    onChange={(e) => setItemForm({ ...itemForm, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stock Units</label>
                  <input
                    type="number"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                >
                  Create SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Stock Movement (In / Out)</h3>
            <form onSubmit={handleRecordMovement} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Direction</label>
                  <select
                    value={movementForm.movementType}
                    onChange={(e) => setMovementForm({ ...movementForm, movementType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    <option value="IN">Stock IN (Restock)</option>
                    <option value="OUT">Stock OUT (Sale / Damaged)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={movementForm.quantity}
                    onChange={(e) =>
                      setMovementForm({ ...movementForm, quantity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Note</label>
                <input
                  type="text"
                  required
                  value={movementForm.reason}
                  onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                >
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
