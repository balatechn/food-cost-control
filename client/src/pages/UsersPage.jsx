import React, { useState, useEffect } from 'react';
import API from '../services/api';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import { formatDate } from '../utils/helpers';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'controller', label: 'F&B Controller' },
  { value: 'store_manager', label: 'Store Manager' },
];

const emptyForm = { username: '', email: '', full_name: '', role: 'controller', password: '' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchUsers = async () => {
    try {
      const { data } = await API.get('/users');
      setUsers(data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (u) => {
    setEditing(u);
    setForm({ username: u.username, email: u.email, full_name: u.full_name, role: u.role, password: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await API.put(`/users/${editing.id}`, payload);
        toast.success('User updated');
      } else {
        if (!form.password || form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        await API.post('/users', form);
        toast.success('User created');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user "${u.full_name || u.username}"?`)) return;
    try {
      await API.delete(`/users/${u.id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  const roleLabel = (r) => ROLES.find(x => x.value === r)?.label || r;
  const roleBadge = (r) => {
    const c = { admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', controller: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', store_manager: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
    return c[r] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <PageHeader title="User Management" subtitle="Manage system users and access roles">
        <button className="btn-primary flex items-center gap-2" onClick={openAdd}>
          <HiOutlinePlus className="w-4 h-4" /> Add User
        </button>
      </PageHeader>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Username</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                <th className="table-header">Created</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="table-cell font-medium">{u.full_name}</td>
                  <td className="table-cell">{u.username}</td>
                  <td className="table-cell">{u.email}</td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleBadge(u.role)}`}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="table-cell">{formatDate(u.created_at)}</td>
                  <td className="table-cell text-right">
                    <button onClick={() => openEdit(u)} className="text-blue-600 hover:text-blue-800 mr-3" title="Edit">
                      <HiOutlinePencil className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => handleDelete(u)} className="text-red-600 hover:text-red-800" title="Delete">
                      <HiOutlineTrash className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="6" className="table-cell text-center text-gray-400 py-8">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input-field" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
          </div>
          <div>
            <label className="label">Username</label>
            <input className="input-field" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required minLength={3} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input-field" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input-field" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Password {editing && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}</label>
            <input className="input-field" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} {...(!editing && { required: true, minLength: 6 })} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
