import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import PageHeader from '../common/PageHeader';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatCurrency, formatNumber, getClassificationColor, downloadCSV } from '../../utils/helpers';
import { HiOutlineDownload, HiOutlineStar } from 'react-icons/hi';
import {
  Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

export default function MenuEngineeringPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data: result } = await API.get('/menu-engineering');
      setData(result);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-red-500">Failed to load data.</p>;

  const { items, averages, summary } = data;

  const scatterData = {
    datasets: [
      { label: 'Star', data: items.filter(i => i.classification === 'Star').map(i => ({ x: parseInt(i.total_sold), y: parseFloat(i.contribution_margin) })), backgroundColor: '#f59e0b', pointRadius: 8 },
      { label: 'Plow Horse', data: items.filter(i => i.classification === 'Plow Horse').map(i => ({ x: parseInt(i.total_sold), y: parseFloat(i.contribution_margin) })), backgroundColor: '#3b82f6', pointRadius: 8 },
      { label: 'Puzzle', data: items.filter(i => i.classification === 'Puzzle').map(i => ({ x: parseInt(i.total_sold), y: parseFloat(i.contribution_margin) })), backgroundColor: '#8b5cf6', pointRadius: 8 },
      { label: 'Dog', data: items.filter(i => i.classification === 'Dog').map(i => ({ x: parseInt(i.total_sold), y: parseFloat(i.contribution_margin) })), backgroundColor: '#ef4444', pointRadius: 8 },
    ],
  };

  return (
    <div className="space-y-6 pt-8 lg:pt-0">
      <PageHeader title="Menu Engineering" subtitle="Classify menu items by profitability and popularity"
        action={
          <button onClick={() => downloadCSV(items, 'menu-engineering')} className="btn-secondary">
            <HiOutlineDownload className="w-4 h-4 inline mr-1" />Export CSV
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2"><HiOutlineStar className="w-5 h-5 text-yellow-600" /><span className="font-semibold text-yellow-700">Stars</span></div>
          <p className="text-3xl font-bold text-yellow-700 mt-2">{summary.stars}</p>
          <p className="text-xs text-yellow-600 mt-1">High popularity, High profit</p>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2"><span className="text-lg">🐴</span><span className="font-semibold text-blue-700">Plow Horses</span></div>
          <p className="text-3xl font-bold text-blue-700 mt-2">{summary.plowHorses}</p>
          <p className="text-xs text-blue-600 mt-1">High popularity, Low profit</p>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center gap-2"><span className="text-lg">🧩</span><span className="font-semibold text-purple-700">Puzzles</span></div>
          <p className="text-3xl font-bold text-purple-700 mt-2">{summary.puzzles}</p>
          <p className="text-xs text-purple-600 mt-1">Low popularity, High profit</p>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-2"><span className="text-lg">🐕</span><span className="font-semibold text-red-700">Dogs</span></div>
          <p className="text-3xl font-bold text-red-700 mt-2">{summary.dogs}</p>
          <p className="text-xs text-red-600 mt-1">Low popularity, Low profit</p>
        </div>
      </div>

      {/* Scatter Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Menu Matrix (Popularity vs Contribution Margin)</h3>
        <div className="h-80">
          <Scatter data={scatterData} options={{
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: {
              x: { title: { display: true, text: 'Units Sold (Popularity)' }, beginAtZero: true },
              y: { title: { display: true, text: 'Contribution Margin ($)' }, beginAtZero: true },
            },
          }} />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left">
          <thead><tr>
            <th className="table-header">Menu Item</th>
            <th className="table-header">Class</th>
            <th className="table-header">Price</th>
            <th className="table-header">Cost</th>
            <th className="table-header">CM</th>
            <th className="table-header">Sold</th>
            <th className="table-header">Revenue</th>
            <th className="table-header">Total CM</th>
          </tr></thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{item.menu_item}</td>
                <td className="table-cell">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getClassificationColor(item.classification)}`}>
                    {item.classification}
                  </span>
                </td>
                <td className="table-cell">{formatCurrency(item.selling_price)}</td>
                <td className="table-cell">{formatCurrency(item.recipe_cost)}</td>
                <td className="table-cell text-green-600 font-medium">{formatCurrency(item.contribution_margin)}</td>
                <td className="table-cell">{item.total_sold}</td>
                <td className="table-cell">{formatCurrency(item.total_revenue)}</td>
                <td className="table-cell text-green-700 font-bold">{formatCurrency(item.total_contribution)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card bg-blue-50">
        <p className="text-sm text-blue-700">
          <strong>Averages:</strong> Popularity threshold: {averages.avgPopularity} units | Contribution margin threshold: {formatCurrency(averages.avgContributionMargin)}
        </p>
      </div>
    </div>
  );
}
