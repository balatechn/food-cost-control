import React, { useState, useEffect } from 'react';
import API from '../services/api';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' });

  useEffect(() => { loadSuppliers(); }, []);

  const loadSuppliers = async () => {
    try {
      const { data } = await API.get('/suppliers');
      setSuppliers(data);
    } catch (err) { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/suppliers/${editing}`, form);
        toast.success('Supplier updated');
      } else {
        await API.post('/suppliers', form);
        toast.success('Supplier added');
      }
      setShowModal(false); setEditing(null);
      setForm({ name: '', contact_person: '', phone: '', email: '', address: '' });
      loadSuppliers();
    } catch (err) { toast.error('Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    try {
      await API.delete(`/suppliers/${id}`);
      toast.success('Supplier deleted');
      loadSuppliers();
    } catch (err) { toast.error('Delete failed'); }
  };

  const openEdit = (s) => {
    setEditing(s.id);
    setForm({ name: s.name, contact_person: s.contact_person || '', phone: s.phone || '', email: s.email || '', address: s.address || '' });
    setShowModal(true);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pt-8 lg:pt-0">
      <PageHeader title="Suppliers" subtitle={`${suppliers.length} suppliers`}
        action={
          <button onClick={() => { setEditing(null); setForm({ name: '', contact_person: '', phone: '', email: '', address: '' }); setShowModal(true); }} className="btn-primary">
            <HiOutlinePlus className="w-4 h-4 inline mr-1" />Add Supplier
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(s => (
          <div key={s.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{s.name}</h3>
                {s.contact_person && <p className="text-sm text-gray-500 mt-1">{s.contact_person}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><HiOutlinePencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded text-red-600"><HiOutlineTrash className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              {s.phone && <p>📞 {s.phone}</p>}
              {s.email && <p>📧 {s.email}</p>}
              {s.address && <p>📍 {s.address}</p>}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditing(null); }} title={editing ? 'Edit Supplier' : 'Add Supplier'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Company Name</label><input className="input-field" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required /></div>
          <div><label className="label">Contact Person</label><input className="input-field" value={form.contact_person} onChange={e => setForm(f => ({...f, contact_person: e.target.value}))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Phone</label><input className="input-field" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} /></div>
            <div><label className="label">Email</label><input type="email" className="input-field" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
          </div>
          <div><label className="label">Address</label><textarea className="input-field" rows={2} value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} /></div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
