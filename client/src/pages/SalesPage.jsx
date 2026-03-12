import React, { useState, useEffect } from 'react';
import API from '../services/api';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import { formatCurrency, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [dailySummary, setDailySummary] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ recipe_id: '', quantity_sold: '1', sale_date: new Date().toISOString().slice(0, 10) });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [salesRes, summaryRes, recipesRes] = await Promise.all([
        API.get('/sales'),
        API.get('/sales/daily-summary'),
        API.get('/recipes'),
      ]);
      setSales(salesRes.data);
      setDailySummary(summaryRes.data);
      setRecipes(recipesRes.data);
    } catch (err) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await API.post('/sales', form);
      toast.success('Sale recorded');
      setShowModal(false);
      setForm({ recipe_id: '', quantity_sold: '1', sale_date: new Date().toISOString().slice(0, 10) });
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to record sale'); }
  };

  if (loading) return <LoadingSpinner />;

  const chartData = {
    labels: dailySummary.slice(0, 14).reverse().map(d => formatDate(d.sale_date)),
    datasets: [
      {
        label: 'Sales',
        data: dailySummary.slice(0, 14).reverse().map(d => parseFloat(d.total_sales)),
        backgroundColor: 'rgba(59,130,246,0.7)',
        borderRadius: 4,
      },
      {
        label: 'Theoretical Cost',
        data: dailySummary.slice(0, 14).reverse().map(d => parseFloat(d.total_theoretical_cost)),
        backgroundColor: 'rgba(239,68,68,0.7)',
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="space-y-6 pt-8 lg:pt-0">
      <PageHeader title="POS Sales" subtitle="Record and view daily sales"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <HiOutlinePlus className="w-4 h-4 inline mr-1" />Record Sale
          </button>
        }
      />

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Sales vs Theoretical Cost (14 Days)</h3>
        <div className="h-72">
          <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }} />
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left">
          <thead><tr>
            <th className="table-header">Date</th>
            <th className="table-header">Item</th>
            <th className="table-header">Qty</th>
            <th className="table-header">Sale Price</th>
            <th className="table-header">Total</th>
            <th className="table-header">Theo. Cost</th>
          </tr></thead>
          <tbody>
            {sales.slice(0, 50).map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="table-cell">{formatDate(s.sale_date)}</td>
                <td className="table-cell font-medium">{s.item_name}</td>
                <td className="table-cell">{s.quantity_sold}</td>
                <td className="table-cell">{formatCurrency(s.sale_price)}</td>
                <td className="table-cell font-medium">{formatCurrency(s.total_amount)}</td>
                <td className="table-cell text-red-600">{formatCurrency(s.theoretical_cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Sale">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Menu Item</label>
            <select className="input-field" value={form.recipe_id} onChange={e => setForm(f => ({...f, recipe_id: e.target.value}))} required>
              <option value="">Select menu item</option>
              {recipes.map(r => <option key={r.id} value={r.id}>{r.name} - {formatCurrency(r.selling_price)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity Sold</label>
              <input type="number" min="1" className="input-field" value={form.quantity_sold} onChange={e => setForm(f => ({...f, quantity_sold: e.target.value}))} required />
            </div>
            <div>
              <label className="label">Sale Date</label>
              <input type="date" className="input-field" value={form.sale_date} onChange={e => setForm(f => ({...f, sale_date: e.target.value}))} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Record Sale</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
