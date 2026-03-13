import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import RecipesPage from './pages/RecipesPage';
import SalesPage from './pages/SalesPage';
import FoodCostPage from './pages/FoodCostPage';
import VariancePage from './pages/VariancePage';
import ReportsPage from './pages/ReportsPage';
import WastePage from './pages/WastePage';
import MenuEngineeringPage from './pages/MenuEngineeringPage';
import SuppliersPage from './pages/SuppliersPage';
import UsersPage from './pages/UsersPage';
import HelpPage from './pages/HelpPage';
import CategoryMaster from './pages/admin/CategoryMaster';
import ItemMaster from './pages/admin/ItemMaster';
import UnitMaster from './pages/admin/UnitMaster';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="food-cost" element={<FoodCostPage />} />
        <Route path="variance" element={<VariancePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="waste" element={<WastePage />} />
        <Route path="menu-engineering" element={<MenuEngineeringPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="admin/categories" element={<AdminRoute><CategoryMaster /></AdminRoute>} />
        <Route path="admin/items" element={<AdminRoute><ItemMaster /></AdminRoute>} />
        <Route path="admin/units" element={<AdminRoute><UnitMaster /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
