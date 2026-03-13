import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { formatCurrency } from '../../utils/helpers';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch } from 'react-icons/hi';
import toast from 'react-hot-toast';

const emptyForm = { name: '', category: '', unit: '', unit_cost: '', min_stock_level: '', supplier_id: '' };

export default function ItemMaster() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const fetchData = async () => {
    try {
      const [itemsRes, catRes, unitRes, supRes] = await Promise.all([
        API.get('/inventory'),
        API.get('/categories'),
        API.get('/units'),
        API.get('/suppliers'),
      ]);
      setItems(itemsRes.data);
      setCategories(catRes.data);
      setUnits(unitRes.data);
      setSuppliers(supRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      unit_cost: item.unit_cost,
      min_stock_level: item.min_stock_level || '',
      supplier_id: item.supplier_id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category || !form.unit) {
      toast.error('Name, category, and unit are required');
      return;
    }
    try {
      const payload = {
        ...form,
        unit_cost: parseFloat(form.unit_cost) || 0,
        min_stock_level: parseFloat(form.min_stock_level) || 0,
        supplier_id: form.supplier_id || null,
      };
      if (editing) {
        await API.put(`/inventory/${editing.id}`, payload);
        toast.success('Item updated');
      } else {
        await API.post('/inventory', payload);
        toast.success('Item created');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete item "${item.name}"? This will also delete related transactions.`)) return;
    try {
      await API.delete(`/inventory/${item.id}`);
      toast.success('Item deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  const filtered = items.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || item.category === filterCat;
    return matchSearch && matchCat;
  });

  const supplierName = (id) => suppliers.find((s) => s.id === id)?.name || '—';

  return (
    <div>
      <PageHeader title="Item Master" subtitle={`${items.length} items`}>
        <button className="btn-primary flex items-center gap-2" onClick={openAdd}>
          <HiOutlinePlus className="w-4 h-4" /> Add Item
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search items..." className="input-field pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input-field sm:w-48" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">#</th>
                <th className="table-header">Item Name</th>
                <th className="table-header">Category</th>
                <th className="table-header">Unit</th>
                <th className="table-header text-right">Unit Cost</th>
                <th className="table-header text-right">Current Stock</th>
                <th className="table-header text-right">Min Level</th>
                <th className="table-header">Supplier</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const lowStock = item.current_stock <= item.min_stock_level && item.min_stock_level > 0;
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${lowStock ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell font-medium">{item.name}</td>
                    <td className="table-cell">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 capitalize">
                        {item.category?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="table-cell">{item.unit}</td>
                    <td className="table-cell text-right">{formatCurrency(item.unit_cost)}</td>
                    <td className={`table-cell text-right ${lowStock ? 'text-red-600 font-semibold' : ''}`}>{parseFloat(item.current_stock).toFixed(2)}</td>
                    <td className="table-cell text-right">{parseFloat(item.min_stock_level || 0).toFixed(2)}</td>
                    <td className="table-cell text-sm text-gray-500 dark:text-gray-400">{supplierName(item.supplier_id)}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Edit">
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Delete">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr><td colSpan="9" className="table-cell text-center text-gray-400 py-8">No items found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Item' : 'Add Item'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Item Name *</label>
            <input type="text" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chicken Breast" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Unit *</label>
              <select className="input-field" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="">Select unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.abbreviation || u.name}>{u.name} ({u.abbreviation})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Unit Cost (₹)</label>
              <input type="number" step="0.01" min="0" className="input-field" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} />
            </div>
            <div>
              <label className="label">Min Stock Level</label>
              <input type="number" step="0.01" min="0" className="input-field" value={form.min_stock_level} onChange={(e) => setForm({ ...form, min_stock_level: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Supplier</label>
            <select className="input-field" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
              <option value="">No supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
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
