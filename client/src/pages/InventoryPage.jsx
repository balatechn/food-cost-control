import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import { formatCurrency, getCategoryLabel } from '../utils/helpers';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineExclamation, HiOutlineDownload, HiOutlineUpload } from 'react-icons/hi';

const CATEGORIES = ['meat','poultry','seafood','vegetables','fruits','dairy','beverages','dry_goods','spices','bakery','other'];

const emptyItem = { name: '', category: 'vegetables', unit: 'kg', unit_cost: '', current_stock: '0', min_stock_level: '0', supplier_id: '' };

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const [purchaseForm, setPurchaseForm] = useState({ item_id: '', quantity: '', unit_cost: '', supplier_id: '', invoice_no: '' });
  const [issueForm, setIssueForm] = useState({ item_id: '', quantity: '', department: 'kitchen' });
  const [filter, setFilter] = useState({ category: '', search: '', low_stock: false });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadItems(); loadSuppliers(); }, []);

  const loadItems = async () => {
    try {
      const params = {};
      if (filter.category) params.category = filter.category;
      if (filter.search) params.search = filter.search;
      if (filter.low_stock) params.low_stock = 'true';
      const { data } = await API.get('/inventory', { params });
      setItems(data);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally { setLoading(false); }
  };

  const loadSuppliers = async () => {
    try {
      const { data } = await API.get('/suppliers');
      setSuppliers(data);
    } catch (err) { /* optional */ }
  };

  useEffect(() => { loadItems(); }, [filter]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/inventory/${editing}`, form);
        toast.success('Item updated');
      } else {
        await API.post('/inventory', form);
        toast.success('Item created');
      }
      setShowModal(false);
      setEditing(null);
      setForm(emptyItem);
      loadItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await API.delete(`/inventory/${id}`);
      toast.success('Item deleted');
      loadItems();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    try {
      await API.post('/inventory/purchase', purchaseForm);
      toast.success('Purchase recorded');
      setShowPurchaseModal(false);
      setPurchaseForm({ item_id: '', quantity: '', unit_cost: '', supplier_id: '', invoice_no: '' });
      loadItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Purchase failed');
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    try {
      await API.post('/inventory/issue', issueForm);
      toast.success('Stock issued');
      setShowIssueModal(false);
      setIssueForm({ item_id: '', quantity: '', department: 'kitchen' });
      loadItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Issue failed');
    }
  };

  const openEdit = (item) => {
    setEditing(item.id);
    setForm({
      name: item.name, category: item.category, unit: item.unit,
      unit_cost: item.unit_cost, current_stock: item.current_stock,
      min_stock_level: item.min_stock_level, supplier_id: item.supplier_id || '',
    });
    setShowModal(true);
  };

  const downloadSample = async () => {
    try {
      const response = await API.get('/inventory/sample-excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory_sample_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download sample file'); }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.xlsx?$/i)) {
      toast.error('Please upload an Excel file (.xlsx)');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await API.post('/inventory/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message);
      if (data.errors?.length) {
        setShowUploadModal(true);
        setUploadErrors(data.errors);
      }
      loadItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [uploadErrors, setUploadErrors] = useState([]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pt-8 lg:pt-0">
      <PageHeader
        title="Inventory Management"
        subtitle={`${items.length} items in stock`}
        action={
          <div className="flex gap-2 flex-wrap">
            <button onClick={downloadSample} className="btn-secondary flex items-center gap-1 text-sm" title="Download sample Excel template">
              <HiOutlineDownload className="w-4 h-4" />Sample Excel
            </button>
            <label className={`btn-secondary flex items-center gap-1 text-sm cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`} title="Bulk upload items from Excel">
              <HiOutlineUpload className="w-4 h-4" />{uploading ? 'Uploading...' : 'Bulk Upload'}
              <input type="file" accept=".xlsx,.xls" className="hidden" ref={fileInputRef} onChange={handleBulkUpload} disabled={uploading} />
            </label>
            <button onClick={() => setShowPurchaseModal(true)} className="btn-success">+ Purchase</button>
            <button onClick={() => setShowIssueModal(true)} className="btn-secondary">Issue to Kitchen</button>
            <button onClick={() => { setEditing(null); setForm(emptyItem); setShowModal(true); }} className="btn-primary">
              <HiOutlinePlus className="w-4 h-4 inline mr-1" />Add Item
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="card flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Search items..."
          className="input-field max-w-xs"
          value={filter.search}
          onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
        />
        <select
          className="input-field max-w-xs"
          value={filter.category}
          onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={filter.low_stock}
            onChange={(e) => setFilter((f) => ({ ...f, low_stock: e.target.checked }))}
            className="rounded"
          />
          Low Stock Only
        </label>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="table-header">Item</th>
              <th className="table-header">Category</th>
              <th className="table-header">Unit</th>
              <th className="table-header">Unit Cost</th>
              <th className="table-header">Stock</th>
              <th className="table-header">Value</th>
              <th className="table-header">Supplier</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium text-gray-900">
                  {parseFloat(item.current_stock) <= parseFloat(item.min_stock_level) && (
                    <HiOutlineExclamation className="inline w-4 h-4 text-red-500 mr-1" />
                  )}
                  {item.name}
                </td>
                <td className="table-cell">{getCategoryLabel(item.category)}</td>
                <td className="table-cell">{item.unit}</td>
                <td className="table-cell">{formatCurrency(item.unit_cost)}</td>
                <td className="table-cell">
                  <span className={parseFloat(item.current_stock) <= parseFloat(item.min_stock_level) ? 'text-red-600 font-semibold' : ''}>
                    {parseFloat(item.current_stock).toFixed(1)}
                  </span>
                </td>
                <td className="table-cell">{formatCurrency(item.current_stock * item.unit_cost)}</td>
                <td className="table-cell">{item.supplier_name || '-'}</td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><HiOutlinePencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded text-red-600"><HiOutlineTrash className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-center py-8 text-gray-400">No inventory items found</p>}
      </div>

      {/* Add/Edit Item Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditing(null); }} title={editing ? 'Edit Item' : 'Add Item'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Item Name</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm(f => ({...f, name: e.target.value}))} required />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input-field" value={form.category} onChange={(e) => setForm(f => ({...f, category: e.target.value}))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input-field" value={form.unit} onChange={(e) => setForm(f => ({...f, unit: e.target.value}))} required />
            </div>
            <div>
              <label className="label">Unit Cost ($)</label>
              <input type="number" step="0.01" min="0" className="input-field" value={form.unit_cost} onChange={(e) => setForm(f => ({...f, unit_cost: e.target.value}))} required />
            </div>
            <div>
              <label className="label">Current Stock</label>
              <input type="number" step="0.001" min="0" className="input-field" value={form.current_stock} onChange={(e) => setForm(f => ({...f, current_stock: e.target.value}))} />
            </div>
            <div>
              <label className="label">Min Stock Level</label>
              <input type="number" step="0.001" min="0" className="input-field" value={form.min_stock_level} onChange={(e) => setForm(f => ({...f, min_stock_level: e.target.value}))} />
            </div>
            <div>
              <label className="label">Supplier</label>
              <select className="input-field" value={form.supplier_id} onChange={(e) => setForm(f => ({...f, supplier_id: e.target.value}))}>
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Purchase Modal */}
      <Modal isOpen={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} title="Record Purchase">
        <form onSubmit={handlePurchase} className="space-y-4">
          <div>
            <label className="label">Item</label>
            <select className="input-field" value={purchaseForm.item_id} onChange={(e) => setPurchaseForm(f => ({...f, item_id: e.target.value}))} required>
              <option value="">Select item</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity</label>
              <input type="number" step="0.001" min="0.001" className="input-field" value={purchaseForm.quantity} onChange={(e) => setPurchaseForm(f => ({...f, quantity: e.target.value}))} required />
            </div>
            <div>
              <label className="label">Unit Cost ($)</label>
              <input type="number" step="0.01" min="0" className="input-field" value={purchaseForm.unit_cost} onChange={(e) => setPurchaseForm(f => ({...f, unit_cost: e.target.value}))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Supplier</label>
              <select className="input-field" value={purchaseForm.supplier_id} onChange={(e) => setPurchaseForm(f => ({...f, supplier_id: e.target.value}))}>
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Invoice #</label>
              <input className="input-field" value={purchaseForm.invoice_no} onChange={(e) => setPurchaseForm(f => ({...f, invoice_no: e.target.value}))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setShowPurchaseModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-success">Record Purchase</button>
          </div>
        </form>
      </Modal>

      {/* Issue Modal */}
      <Modal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} title="Issue Stock to Kitchen">
        <form onSubmit={handleIssue} className="space-y-4">
          <div>
            <label className="label">Item</label>
            <select className="input-field" value={issueForm.item_id} onChange={(e) => setIssueForm(f => ({...f, item_id: e.target.value}))} required>
              <option value="">Select item</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {parseFloat(i.current_stock).toFixed(1)} {i.unit})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity</label>
              <input type="number" step="0.001" min="0.001" className="input-field" value={issueForm.quantity} onChange={(e) => setIssueForm(f => ({...f, quantity: e.target.value}))} required />
            </div>
            <div>
              <label className="label">Department</label>
              <select className="input-field" value={issueForm.department} onChange={(e) => setIssueForm(f => ({...f, department: e.target.value}))}>
                <option value="kitchen">Kitchen</option>
                <option value="bar">Bar</option>
                <option value="pastry">Pastry</option>
                <option value="banquet">Banquet</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setShowIssueModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Issue Stock</button>
          </div>
        </form>
      </Modal>

      {/* Bulk Upload Errors Modal */}
      <Modal isOpen={showUploadModal} onClose={() => { setShowUploadModal(false); setUploadErrors([]); }} title="Bulk Upload Warnings">
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {uploadErrors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
              <HiOutlineExclamation className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {err}
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-4">
          <button className="btn-primary" onClick={() => { setShowUploadModal(false); setUploadErrors([]); }}>OK</button>
        </div>
      </Modal>
    </div>
  );
}
