import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Profile from './pages/Profile';      // ✅ Import Profile page
import Orders from './pages/Orders';        // ✅ Import Orders page
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductManager from './pages/admin/ProductManager';
import OrderManager from './pages/admin/OrderManager';
import UserManager from './pages/admin/UserManager';
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Checkout from './pages/Checkout'; // ✅ Import Checkout page
import Payment from './pages/Payment';

const App = () => {
  return (
    <>
      <Router>
        <Routes>
          {/* 🌿 Public Customer Routes */}
          <Route path="/" element={<CustomerLayout><Landing /></CustomerLayout>} />
          <Route path="/login" element={<CustomerLayout><Login /></CustomerLayout>} />
          <Route path="/signup" element={<CustomerLayout><Signup /></CustomerLayout>} />
          <Route path="/products" element={<CustomerLayout><ProductList /></CustomerLayout>} />
          <Route path="/product" element={<CustomerLayout><ProductList /></CustomerLayout>} />
          <Route path="/products/:id" element={<CustomerLayout><ProductDetail /></CustomerLayout>} />
          <Route path="/cart" element={<CustomerLayout><Cart /></CustomerLayout>} />
          <Route path="/profile" element={<CustomerLayout><Profile /></CustomerLayout>} />     {/* 👤 Profile Route */}
          <Route path="/orders" element={<CustomerLayout><Orders /></CustomerLayout>} />        {/* 📦 Orders Route */}
          <Route path="/checkout" element={<CustomerLayout><Checkout /></CustomerLayout>} />
          <Route path="/order/history" element={<CustomerLayout><Orders /></CustomerLayout>} />  
          <Route path="/payment" element={<CustomerLayout><Payment /></CustomerLayout>} /> 
          {/* 🔐 Protected Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout><AdminDashboard /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout><ProductManager /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout><OrderManager /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout><UserManager /></AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* 🚫 Unauthorized Access */}
          <Route
            path="/unauthorized"
            element={
              <CustomerLayout>
                <h2 style={{ textAlign: 'center', marginTop: '2rem' }}>Access Denied</h2>
              </CustomerLayout>
            }
          />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default App;
