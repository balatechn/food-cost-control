import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import PageHeader from '../common/PageHeader';
import LoadingSpinner from '../common/LoadingSpinner';
import KPICard from '../common/KPICard';
import { formatCurrency, formatPercent, formatNumber, downloadCSV } from '../../utils/helpers';
import { HiOutlineScale, HiOutlineDownload } from 'react-icons/hi';

export default function VariancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data: result } = await API.get('/variance');
      setData(result);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-red-500">Failed to load variance data.</p>;

  const { items, totals } = data;

  return (
    <div className="space-y-6 pt-8 lg:pt-0">
      <PageHeader title="Variance Analysis" subtitle="Actual issue cost vs theoretical sales cost" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Theoretical Cost" value={formatCurrency(totals.totalTheoreticalCost)} icon={HiOutlineScale} color="blue" />
        <KPICard title="Actual Cost" value={formatCurrency(totals.totalActualCost)} icon={HiOutlineScale} color="red" />
        <KPICard title="Total Variance" value={formatCurrency(totals.totalVarianceCost)} icon={HiOutlineScale}
          color={totals.totalVarianceCost > 0 ? 'red' : 'green'}
          subtitle={totals.totalTheoreticalCost > 0 ? formatPercent((totals.totalVarianceCost / totals.totalTheoreticalCost) * 100) : '0%'}
        />
      </div>

      <div className="card overflow-x-auto p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-700">Variance Report by Item</h3>
          <button onClick={() => downloadCSV(items, 'variance-report')} className="btn-secondary text-xs">
            <HiOutlineDownload className="w-3 h-3 inline mr-1" />Export CSV
          </button>
        </div>
        <table className="w-full text-left">
          <thead><tr>
            <th className="table-header">Item</th>
            <th className="table-header">Unit</th>
            <th className="table-header">Theoretical Usage</th>
            <th className="table-header">Actual Issue</th>
            <th className="table-header">Variance (Qty)</th>
            <th className="table-header">Variance %</th>
            <th className="table-header">Theo. Cost</th>
            <th className="table-header">Actual Cost</th>
            <th className="table-header">Variance ($)</th>
          </tr></thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{item.item_name}</td>
                <td className="table-cell">{item.unit}</td>
                <td className="table-cell">{formatNumber(item.theoretical_usage, 3)}</td>
                <td className="table-cell">{formatNumber(item.actual_issue, 3)}</td>
                <td className="table-cell">
                  <span className={item.variance > 0 ? 'text-red-600 font-medium' : item.variance < 0 ? 'text-green-600 font-medium' : ''}>
                    {item.variance > 0 ? '+' : ''}{formatNumber(item.variance, 3)}
                  </span>
                </td>
                <td className="table-cell">
                  <span className={`font-medium ${Math.abs(item.variance_pct) > 10 ? 'text-red-600' : Math.abs(item.variance_pct) > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {item.variance_pct > 0 ? '+' : ''}{formatPercent(item.variance_pct)}
                  </span>
                </td>
                <td className="table-cell">{formatCurrency(item.theoretical_cost)}</td>
                <td className="table-cell">{formatCurrency(item.actual_cost)}</td>
                <td className="table-cell">
                  <span className={item.variance_cost > 0 ? 'text-red-600 font-bold' : item.variance_cost < 0 ? 'text-green-600 font-bold' : ''}>
                    {item.variance_cost > 0 ? '+' : ''}{formatCurrency(item.variance_cost)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
