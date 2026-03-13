import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';

const emptyForm = { name: '', abbreviation: '' };

export default function UnitMaster() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchUnits = async () => {
    try {
      const { data } = await API.get('/units');
      setUnits(data);
    } catch { toast.error('Failed to load units'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUnits(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, abbreviation: u.abbreviation || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Unit name is required'); return; }
    try {
      if (editing) {
        await API.put(`/units/${editing.id}`, form);
        toast.success('Unit updated');
      } else {
        await API.post('/units', form);
        toast.success('Unit created');
      }
      setShowModal(false);
      fetchUnits();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete unit "${u.name}"?`)) return;
    try {
      await API.delete(`/units/${u.id}`);
      toast.success('Unit deleted');
      fetchUnits();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Unit Master" subtitle={`${units.length} units of measurement`}>
        <button className="btn-primary flex items-center gap-2" onClick={openAdd}>
          <HiOutlinePlus className="w-4 h-4" /> Add Unit
        </button>
      </PageHeader>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">#</th>
                <th className="table-header">Unit Name</th>
                <th className="table-header">Abbreviation</th>
                <th className="table-header text-center">Items Using</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u, i) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="table-cell text-gray-400">{i + 1}</td>
                  <td className="table-cell font-medium capitalize">{u.name}</td>
                  <td className="table-cell">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {u.abbreviation || '—'}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {u.item_count}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Edit">
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(u)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Delete">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!units.length && (
                <tr><td colSpan="5" className="table-cell text-center text-gray-400 py-8">No units found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Unit' : 'Add Unit'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Unit Name *</label>
            <input type="text" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. kilogram" />
          </div>
          <div>
            <label className="label">Abbreviation</label>
            <input type="text" className="input-field" value={form.abbreviation} onChange={(e) => setForm({ ...form, abbreviation: e.target.value })} placeholder="e.g. kg" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
