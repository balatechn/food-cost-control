import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import PageHeader from '../common/PageHeader';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';

export default function WastePage() {
  const [wasteLogs, setWasteLogs] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ item_id: '', quantity: '', reason: '', waste_date: new Date().toISOString().slice(0, 10) });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [wasteRes, itemsRes] = await Promise.all([
        API.get('/waste'),
        API.get('/inventory'),
      ]);
      setWasteLogs(wasteRes.data);
      setItems(itemsRes.data);
    } catch (err) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await API.post('/waste', form);
      toast.success('Waste recorded');
      setShowModal(false);
      setForm({ item_id: '', quantity: '', reason: '', waste_date: new Date().toISOString().slice(0, 10) });
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to record waste'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this waste log?')) return;
    try {
      await API.delete(`/waste/${id}`);
      toast.success('Waste log deleted');
      loadData();
    } catch (err) { toast.error('Delete failed'); }
  };

  if (loading) return <LoadingSpinner />;

  const totalWaste = wasteLogs.reduce((s, w) => s + parseFloat(w.total_cost || 0), 0);

  return (
    <div className="space-y-6 pt-8 lg:pt-0">
      <PageHeader title="Waste Tracking" subtitle={`Total waste: ${formatCurrency(totalWaste)}`}
        action={
          <button onClick={() => setShowModal(true)} className="btn-danger">
            <HiOutlinePlus className="w-4 h-4 inline mr-1" />Record Waste
          </button>
        }
      />

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left">
          <thead><tr>
            <th className="table-header">Date</th>
            <th className="table-header">Item</th>
            <th className="table-header">Qty</th>
            <th className="table-header">Unit Cost</th>
            <th className="table-header">Total Cost</th>
            <th className="table-header">Reason</th>
            <th className="table-header">Actions</th>
          </tr></thead>
          <tbody>
            {wasteLogs.map(w => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="table-cell">{formatDate(w.waste_date)}</td>
                <td className="table-cell font-medium">{w.item_name}</td>
                <td className="table-cell">{w.quantity} {w.unit}</td>
                <td className="table-cell">{formatCurrency(w.unit_cost)}</td>
                <td className="table-cell text-red-600 font-medium">{formatCurrency(w.total_cost)}</td>
                <td className="table-cell">{w.reason}</td>
                <td className="table-cell">
                  <button onClick={() => handleDelete(w.id)} className="p-1.5 hover:bg-red-50 rounded text-red-600"><HiOutlineTrash className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {wasteLogs.length === 0 && <p className="text-center py-8 text-gray-400">No waste logs found</p>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Food Waste">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Item</label>
            <select className="input-field" value={form.item_id} onChange={e => setForm(f => ({...f, item_id: e.target.value}))} required>
              <option value="">Select item</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity</label>
              <input type="number" step="0.001" min="0.001" className="input-field" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} required />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input-field" value={form.waste_date} onChange={e => setForm(f => ({...f, waste_date: e.target.value}))} required />
            </div>
          </div>
          <div>
            <label className="label">Reason</label>
            <input className="input-field" value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))} placeholder="e.g., Expired, spoiled, overproduction" required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-danger">Record Waste</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
