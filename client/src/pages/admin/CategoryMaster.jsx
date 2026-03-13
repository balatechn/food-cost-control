import React, { useState, useEffect, useRef } from 'react';
import API from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineDownload, HiOutlineUpload, HiOutlineExclamation } from 'react-icons/hi';
import toast from 'react-hot-toast';

const emptyForm = { name: '', description: '' };

export default function CategoryMaster() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);
  const fileInputRef = useRef(null);

  const fetchCategories = async () => {
    try {
      const { data } = await API.get('/categories');
      setCategories(data);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Category name is required'); return; }
    try {
      if (editing) {
        await API.put(`/categories/${editing.id}`, form);
        toast.success('Category updated');
      } else {
        await API.post('/categories', form);
        toast.success('Category created');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try {
      await API.delete(`/categories/${c.id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const downloadSample = async () => {
    try {
      const response = await API.get('/categories/sample-excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'categories_sample_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download sample file'); }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.xlsx?$/i)) { toast.error('Please upload an Excel file (.xlsx)'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await API.post('/categories/bulk-upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(data.message);
      if (data.errors?.length) { setShowUploadModal(true); setUploadErrors(data.errors); }
      fetchCategories();
    } catch (err) { toast.error(err.response?.data?.error || 'Upload failed'); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Category Master" subtitle={`${categories.length} categories`}>
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadSample} className="btn-secondary flex items-center gap-1 text-sm"><HiOutlineDownload className="w-4 h-4" />Sample Excel</button>
          <label className={`btn-secondary flex items-center gap-1 text-sm cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <HiOutlineUpload className="w-4 h-4" />{uploading ? 'Uploading...' : 'Bulk Upload'}
            <input type="file" accept=".xlsx,.xls" className="hidden" ref={fileInputRef} onChange={handleBulkUpload} disabled={uploading} />
          </label>
          <button className="btn-primary flex items-center gap-2" onClick={openAdd}>
            <HiOutlinePlus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </PageHeader>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">#</th>
                <th className="table-header">Category Name</th>
                <th className="table-header">Description</th>
                <th className="table-header text-center">Items</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="table-cell text-gray-400">{i + 1}</td>
                  <td className="table-cell font-medium capitalize">{c.name.replace(/_/g, ' ')}</td>
                  <td className="table-cell text-gray-500 dark:text-gray-400">{c.description || '—'}</td>
                  <td className="table-cell text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {c.item_count}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Edit">
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(c)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Delete">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!categories.length && (
                <tr><td colSpan="5" className="table-cell text-center text-gray-400 py-8">No categories found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Category Name *</label>
            <input type="text" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. frozen_goods" />
          </div>
          <div>
            <label className="label">Description</label>
            <input type="text" className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full"><HiOutlineExclamation className="w-6 h-6 text-yellow-600" /></div>
              <h3 className="text-lg font-semibold">Upload Warnings</h3>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {uploadErrors.map((err, i) => (
                <div key={i} className="text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 p-2 rounded">{err}</div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button className="btn-primary" onClick={() => setShowUploadModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
