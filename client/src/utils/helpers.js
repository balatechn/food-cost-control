export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value || 0);
}

export function formatNumber(value, decimals = 2) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatPercent(value) {
  return `${formatNumber(value)}%`;
}

export function getCategoryLabel(category) {
  const labels = {
    meat: 'Meat',
    poultry: 'Poultry',
    seafood: 'Seafood',
    vegetables: 'Vegetables',
    fruits: 'Fruits',
    dairy: 'Dairy',
    beverages: 'Beverages',
    dry_goods: 'Dry Goods',
    spices: 'Spices',
    bakery: 'Bakery',
    other: 'Other',
  };
  return labels[category] || category;
}

export function getClassificationColor(classification) {
  const colors = {
    Star: 'text-yellow-600 bg-yellow-50',
    'Plow Horse': 'text-blue-600 bg-blue-50',
    Puzzle: 'text-purple-600 bg-purple-50',
    Dog: 'text-red-600 bg-red-50',
  };
  return colors[classification] || 'text-gray-600 bg-gray-50';
}

export function downloadCSV(data, filename) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h]?.toString() || '';
        return val.includes(',') ? `"${val}"` : val;
      }).join(',')
    ),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
