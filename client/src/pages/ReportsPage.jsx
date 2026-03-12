import React, { useState, useEffect } from 'react';
import API from '../services/api';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatPercent, formatDate, downloadCSV, getCategoryLabel } from '../utils/helpers';
import { HiOutlineDownload } from 'react-icons/hi';
import {
  Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const TABS = [
  { key: 'daily', label: 'Daily Food Cost' },
  { key: 'inventory', label: 'Inventory Report' },
  { key: 'purchases', label: 'Purchase Report' },
  { key: 'waste', label: 'Waste Report' },
  { key: 'profitability', label: 'Menu Profitability' },
];

export default function ReportsPage() {
  const [tab, setTab] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadReport(tab); }, [tab]);

  const loadReport = async (type) => {
    setLoading(true);
    try {
      const endpoints = {
        daily: '/reports/daily-food-cost',
        inventory: '/reports/inventory',
        purchases: '/reports/purchases',
        waste: '/reports/waste',
        profitability: '/reports/menu-profitability',
      };
      const { data: res } = await API.get(endpoints[type]);
      setData(res);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const exportData = () => {
    if (!data) return;
    const rows = Array.isArray(data) ? data : (data.items || []);
    downloadCSV(rows, `${tab}-report`);
  };

  return (
    <div className="space-y-6 pt-8 lg:pt-0">
      <PageHeader title="Reports" subtitle="Generate and export food cost reports"
        action={
          <button onClick={exportData} className="btn-secondary">
            <HiOutlineDownload className="w-4 h-4 inline mr-1" />Export CSV
          </button>
        }
      />

      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={tab === t.key ? 'btn-primary' : 'btn-secondary'}>{t.label}</button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {tab === 'daily' && data && <DailyReport data={data} />}
          {tab === 'inventory' && data && <InventoryReport data={data} />}
          {tab === 'purchases' && data && <PurchaseReport data={data} />}
          {tab === 'waste' && data && <WasteReport data={data} />}
          {tab === 'profitability' && data && <ProfitabilityReport data={data} />}
        </>
      )}
    </div>
  );
}

function DailyReport({ data }) {
  const chartData = {
    labels: data.map(d => formatDate(d.date)),
    datasets: [
      { label: 'Actual Cost', data: data.map(d => parseFloat(d.actual_cost)), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4 },
      { label: 'Sales', data: data.map(d => parseFloat(d.total_sales)), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4 },
    ],
  };
  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Food Cost vs Sales (30 Days)</h3>
        <div className="h-72"><Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }} /></div>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left"><thead><tr>
          <th className="table-header">Date</th><th className="table-header">Sales</th><th className="table-header">Actual Cost</th><th className="table-header">Theo. Cost</th><th className="table-header">Cost %</th>
        </tr></thead><tbody>
          {data.map((d, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="table-cell">{formatDate(d.date)}</td>
              <td className="table-cell">{formatCurrency(d.total_sales)}</td>
              <td className="table-cell text-red-600">{formatCurrency(d.actual_cost)}</td>
              <td className="table-cell">{formatCurrency(d.theoretical_cost)}</td>
              <td className="table-cell"><span className={`font-medium ${parseFloat(d.food_cost_pct) > 35 ? 'text-red-600' : 'text-green-600'}`}>{formatPercent(d.food_cost_pct)}</span></td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </div>
  );
}

function InventoryReport({ data }) {
  const totalValue = data.reduce((s, i) => s + parseFloat(i.stock_value || 0), 0);
  return (
    <div className="space-y-4">
      <div className="card"><p className="text-sm text-gray-500">Total Inventory Value</p><p className="text-2xl font-bold">{formatCurrency(totalValue)}</p></div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left"><thead><tr>
          <th className="table-header">Item</th><th className="table-header">Category</th><th className="table-header">Stock</th><th className="table-header">Unit Cost</th><th className="table-header">Value</th><th className="table-header">Status</th>
        </tr></thead><tbody>
          {data.map((item, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="table-cell font-medium">{item.name}</td>
              <td className="table-cell">{getCategoryLabel(item.category)}</td>
              <td className="table-cell">{parseFloat(item.current_stock).toFixed(1)} {item.unit}</td>
              <td className="table-cell">{formatCurrency(item.unit_cost)}</td>
              <td className="table-cell">{formatCurrency(item.stock_value)}</td>
              <td className="table-cell">{item.low_stock ? <span className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded">LOW</span> : <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">OK</span>}</td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </div>
  );
}

function PurchaseReport({ data }) {
  const total = data.reduce((s, p) => s + parseFloat(p.total_cost), 0);
  return (
    <div className="space-y-4">
      <div className="card"><p className="text-sm text-gray-500">Total Purchases (30 days)</p><p className="text-2xl font-bold">{formatCurrency(total)}</p></div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left"><thead><tr>
          <th className="table-header">Date</th><th className="table-header">Invoice</th><th className="table-header">Supplier</th><th className="table-header">Item</th><th className="table-header">Qty</th><th className="table-header">Cost</th><th className="table-header">Total</th>
        </tr></thead><tbody>
          {data.map((p, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="table-cell">{formatDate(p.purchase_date)}</td>
              <td className="table-cell">{p.invoice_no || '-'}</td>
              <td className="table-cell">{p.supplier_name || '-'}</td>
              <td className="table-cell font-medium">{p.item_name}</td>
              <td className="table-cell">{p.quantity}</td>
              <td className="table-cell">{formatCurrency(p.unit_cost)}</td>
              <td className="table-cell font-medium">{formatCurrency(p.total_cost)}</td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </div>
  );
}

function WasteReport({ data }) {
  return (
    <div className="space-y-4">
      <div className="card"><p className="text-sm text-gray-500">Total Waste Cost (30 days)</p><p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalWasteCost)}</p></div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left"><thead><tr>
          <th className="table-header">Date</th><th className="table-header">Item</th><th className="table-header">Category</th><th className="table-header">Qty</th><th className="table-header">Cost</th><th className="table-header">Reason</th>
        </tr></thead><tbody>
          {data.items.map((w, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="table-cell">{formatDate(w.waste_date)}</td>
              <td className="table-cell font-medium">{w.item_name}</td>
              <td className="table-cell">{getCategoryLabel(w.category)}</td>
              <td className="table-cell">{w.quantity} </td>
              <td className="table-cell text-red-600">{formatCurrency(w.total_cost)}</td>
              <td className="table-cell">{w.reason}</td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </div>
  );
}

function ProfitabilityReport({ data }) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-left"><thead><tr>
        <th className="table-header">Menu Item</th><th className="table-header">Category</th><th className="table-header">Price</th><th className="table-header">Cost</th><th className="table-header">Profit</th><th className="table-header">Cost %</th><th className="table-header">Sold</th><th className="table-header">Revenue</th><th className="table-header">Total Profit</th>
      </tr></thead><tbody>
        {data.map((item, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="table-cell font-medium">{item.menu_item}</td>
            <td className="table-cell">{item.category}</td>
            <td className="table-cell">{formatCurrency(item.selling_price)}</td>
            <td className="table-cell">{formatCurrency(item.recipe_cost)}</td>
            <td className="table-cell text-green-600 font-medium">{formatCurrency(item.gross_profit)}</td>
            <td className="table-cell"><span className={`font-medium ${parseFloat(item.food_cost_pct) > 35 ? 'text-red-600' : 'text-green-600'}`}>{formatPercent(item.food_cost_pct)}</span></td>
            <td className="table-cell">{item.total_sold}</td>
            <td className="table-cell">{formatCurrency(item.total_revenue)}</td>
            <td className="table-cell text-green-700 font-bold">{formatCurrency(item.total_profit)}</td>
          </tr>
        ))}
      </tbody></table>
    </div>
  );
}
