import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import ProductList from './pages/admin/ProductList';
import CategoryList from './pages/admin/CategoryList';
import POS from './pages/cashier/POS';
import History from './pages/cashier/History';

// Route guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm font-semibold">
        Memverifikasi sesi...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If Admin trying to access cashier or vice versa:
    // Actually, Admin has access to both. Cashier only has access to cashier.
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/cashier" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ProductList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <CategoryList />
              </ProtectedRoute>
            }
          />

          {/* Cashier/Admin Protected Routes */}
          <Route
            path="/cashier"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}>
                <POS />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cashier/history"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}>
                <History />
              </ProtectedRoute>
            }
          />

          {/* Fallbacks */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
