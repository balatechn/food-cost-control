import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import PageHeader from '../common/PageHeader';
import LoadingSpinner from '../common/LoadingSpinner';
import KPICard from '../common/KPICard';
import { formatCurrency, formatPercent, downloadCSV } from '../../utils/helpers';
import { HiOutlineCalculator, HiOutlineCurrencyDollar, HiOutlineChartBar, HiOutlineDownload } from 'react-icons/hi';

export default function FoodCostPage() {
  const [issueBased, setIssueBased] = useState(null);
  const [salesBased, setSalesBased] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('issue');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [issueRes, salesRes] = await Promise.all([
        API.get('/foodcost/issue-based'),
        API.get('/foodcost/sales-based'),
      ]);
      setIssueBased(issueRes.data);
      setSalesBased(salesRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pt-8 lg:pt-0">
      <PageHeader title="Food Cost Analysis" subtitle="Issue-based and sales-based costing methods" />

      <div className="flex gap-2">
        <button onClick={() => setTab('issue')} className={tab === 'issue' ? 'btn-primary' : 'btn-secondary'}>Issue-Based</button>
        <button onClick={() => setTab('sales')} className={tab === 'sales' ? 'btn-primary' : 'btn-secondary'}>Sales-Based (Theoretical)</button>
      </div>

      {tab === 'issue' && issueBased && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Opening Stock" value={formatCurrency(issueBased.openingStock)} icon={HiOutlineCurrencyDollar} color="blue" />
            <KPICard title="Purchases" value={formatCurrency(issueBased.purchases)} icon={HiOutlineCurrencyDollar} color="green" />
            <KPICard title="Closing Stock" value={formatCurrency(issueBased.closingStock)} icon={HiOutlineCurrencyDollar} color="purple" />
            <KPICard title="Food Cost" value={formatCurrency(issueBased.foodCost)} icon={HiOutlineCalculator} color="red" />
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Issue-Based Food Cost Calculation</h3>
            <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm space-y-2">
              <p>Opening Stock Value: <span className="font-bold">{formatCurrency(issueBased.openingStock)}</span></p>
              <p className="text-green-600">+ Purchases: <span className="font-bold">{formatCurrency(issueBased.purchases)}</span></p>
              <p className="text-red-600">- Closing Stock: <span className="font-bold">{formatCurrency(issueBased.closingStock)}</span></p>
              <hr className="border-gray-300" />
              <p className="text-lg font-bold">= Food Cost: {formatCurrency(issueBased.foodCost)}</p>
              <p className="text-lg font-bold mt-2">Food Cost %: <span className={issueBased.foodCostPct > 35 ? 'text-red-600' : 'text-green-600'}>{formatPercent(issueBased.foodCostPct)}</span></p>
              <p className="text-gray-500 mt-2">Total Sales: {formatCurrency(issueBased.totalSales)}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'sales' && salesBased && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPICard title="Theoretical Cost" value={formatCurrency(salesBased.totalTheoreticalCost)} icon={HiOutlineCalculator} color="red" />
            <KPICard title="Total Sales" value={formatCurrency(salesBased.totalSales)} icon={HiOutlineCurrencyDollar} color="blue" />
            <KPICard title="Food Cost %" value={formatPercent(salesBased.overallFoodCostPct)} icon={HiOutlineChartBar} color={salesBased.overallFoodCostPct > 35 ? 'red' : 'green'} />
          </div>

          <div className="card overflow-x-auto p-0">
            <div className="flex items-center justify-between px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-700">Sales-Based Theoretical Cost by Menu Item</h3>
              <button onClick={() => downloadCSV(salesBased.items, 'sales-based-food-cost')} className="btn-secondary text-xs">
                <HiOutlineDownload className="w-3 h-3 inline mr-1" />Export CSV
              </button>
            </div>
            <table className="w-full text-left">
              <thead><tr>
                <th className="table-header">Menu Item</th>
                <th className="table-header">Qty Sold</th>
                <th className="table-header">Recipe Cost</th>
                <th className="table-header">Theoretical Cost</th>
                <th className="table-header">Total Sales</th>
                <th className="table-header">Food Cost %</th>
              </tr></thead>
              <tbody>
                {salesBased.items.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{item.menu_item}</td>
                    <td className="table-cell">{item.total_qty}</td>
                    <td className="table-cell">{formatCurrency(item.recipe_cost)}</td>
                    <td className="table-cell text-red-600">{formatCurrency(item.theoretical_cost)}</td>
                    <td className="table-cell">{formatCurrency(item.total_sales)}</td>
                    <td className="table-cell">
                      <span className={`font-medium ${parseFloat(item.food_cost_pct) > 35 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatPercent(item.food_cost_pct)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
