import React, { useState, useEffect } from 'react';
import API from '../services/api';
import KPICard from '../components/common/KPICard';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatPercent, formatDate } from '../utils/helpers';
import {
  HiOutlineCurrencyDollar,
  HiOutlineCalculator,
  HiOutlineChartBar,
  HiOutlineCube,
  HiOutlineScale,
} from 'react-icons/hi';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: result } = await API.get('/dashboard');
      setData(result);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;
  if (!data) return <p className="text-red-500">Failed to load dashboard data.</p>;

  const { kpis, foodCostTrend, topSellingItems, recentTransactions, lowStockAlerts, inventoryConsumption } = data;

  // Food Cost Trend Chart
  const trendChartData = {
    labels: foodCostTrend.map((d) => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Food Cost',
        data: foodCostTrend.map((d) => parseFloat(d.daily_cost)),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Sales',
        data: foodCostTrend.map((d) => parseFloat(d.daily_sales)),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Top Selling Items Chart
  const topItemsChartData = {
    labels: topSellingItems.map((i) => i.name),
    datasets: [
      {
        label: 'Revenue',
        data: topSellingItems.map((i) => parseFloat(i.total_revenue)),
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
          '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4',
        ],
        borderRadius: 6,
      },
    ],
  };

  // Inventory Consumption Doughnut
  const consumptionChartData = {
    labels: inventoryConsumption.map((c) => c.category),
    datasets: [
      {
        data: inventoryConsumption.map((c) => parseFloat(c.total_issued)),
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
          '#ec4899', '#14b8a6', '#f97316',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } } },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div className="space-y-6 pt-8 lg:pt-0">
      <PageHeader
        title="Food Cost Dashboard"
        subtitle="30-day overview of your food cost performance"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard title="Food Sales" value={formatCurrency(kpis.totalSales)} icon={HiOutlineCurrencyDollar} color="blue" subtitle="Last 30 days" />
        <KPICard title="Food Cost" value={formatCurrency(kpis.totalCost)} icon={HiOutlineCalculator} color="red" subtitle="Issue-based" />
        <KPICard title="Food Cost %" value={formatPercent(kpis.foodCostPct)} icon={HiOutlineChartBar} color={kpis.foodCostPct > 35 ? 'red' : 'green'} subtitle="Target: <30%" />
        <KPICard title="Inventory Value" value={formatCurrency(kpis.inventoryValue)} icon={HiOutlineCube} color="purple" subtitle="Current" />
        <KPICard title="Variance %" value={formatPercent(kpis.variancePct)} icon={HiOutlineScale} color={Math.abs(kpis.variancePct) > 5 ? 'red' : 'green'} subtitle="Actual vs Theoretical" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Food Cost Trend (14 Days)</h3>
          <div className="h-72">
            <Line data={trendChartData} options={{ ...chartOptions, scales: { y: { beginAtZero: true } } }} />
          </div>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Selling Items by Revenue</h3>
          <div className="h-72">
            <Bar data={topItemsChartData} options={{ ...chartOptions, indexAxis: 'y', scales: { x: { beginAtZero: true } } }} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Inventory Consumption by Category</h3>
          <div className="h-64">
            <Doughnut data={consumptionChartData} options={{ ...chartOptions, scales: {} }} />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">⚠️ Low Stock Alerts</h3>
          {lowStockAlerts.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">All stock levels are healthy</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lowStockAlerts.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-red-50 text-sm">
                  <span className="font-medium text-red-700">{item.name}</span>
                  <span className="text-red-600">
                    {parseFloat(item.current_stock).toFixed(1)} / {parseFloat(item.min_stock_level).toFixed(1)} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Transactions</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentTransactions.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                    t.type === 'sale' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {t.type}
                  </span>
                  <span className="text-gray-700">{t.item}</span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(t.amount)}</p>
                  <p className="text-xs text-gray-400">{formatDate(t.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
