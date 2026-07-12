import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';

// Layouts and Shared Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminSidebar from './components/AdminSidebar';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import ProductCompare from './pages/ProductCompare';
import { FAQ, About, Contact, Terms, Privacy } from './pages/StaticPages';
import { Login, Register, ForgotPassword, ResetPassword } from './pages/CustomerAuth';
import { Profile, AddressBook, Wishlist } from './pages/CustomerAccount';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentGateway from './pages/PaymentGateway';
import { OrderConfirmation, OrderHistory, OrderDetails } from './pages/CustomerOrders';

// Admin Portal Pages
import { 
  Dashboard as AdminDashboard, 
  AdminProducts, 
  AdminCategoriesBrands, 
  AdminOrders, 
  AdminCustomers, 
  AdminInventory, 
  AdminCoupons,
  AdminChat
} from './pages/admin/AdminPortal';

// Role-Based Router Protection
const AdminRoute = ({ children }) => {
  const { user, token } = useAppContext();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // Wait if user profile is fetching
  if (user === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner" style={{ borderTopColor: 'var(--primary)' }}></div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div style={{ padding: '80px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }} className="category-card">
        <h2 style={{ fontWeight: 'bold', color: 'var(--danger)' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          This administration dashboard is restricted.
        </p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '20px' }}>Return to Home</Link>
      </div>
    );
  }

  return children;
};

// Layout Wrappers
const BaseLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

const AdminLayout = ({ children }) => {
  return (
    <AdminRoute>
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-main">
          {children}
        </main>
      </div>
    </AdminRoute>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public Website Routes */}
          <Route path="/" element={<BaseLayout><Home /></BaseLayout>} />
          <Route path="/shop" element={<BaseLayout><Shop /></BaseLayout>} />
          <Route path="/products/:id" element={<BaseLayout><ProductDetails /></BaseLayout>} />
          <Route path="/compare" element={<BaseLayout><ProductCompare /></BaseLayout>} />
          <Route path="/about" element={<BaseLayout><About /></BaseLayout>} />
          <Route path="/contact" element={<BaseLayout><Contact /></BaseLayout>} />
          <Route path="/faq" element={<BaseLayout><FAQ /></BaseLayout>} />
          <Route path="/terms" element={<BaseLayout><Terms /></BaseLayout>} />
          <Route path="/privacy" element={<BaseLayout><Privacy /></BaseLayout>} />

          {/* Customer Auth & Account Routes */}
          <Route path="/login" element={<BaseLayout><Login /></BaseLayout>} />
          <Route path="/register" element={<BaseLayout><Register /></BaseLayout>} />
          <Route path="/forgot-password" element={<BaseLayout><ForgotPassword /></BaseLayout>} />
          <Route path="/reset-password" element={<BaseLayout><ResetPassword /></BaseLayout>} />
          
          <Route path="/profile" element={<BaseLayout><Profile /></BaseLayout>} />
          <Route path="/address-book" element={<BaseLayout><AddressBook /></BaseLayout>} />
          <Route path="/wishlist" element={<BaseLayout><Wishlist /></BaseLayout>} />
          
          <Route path="/cart" element={<BaseLayout><Cart /></BaseLayout>} />
          <Route path="/checkout" element={<BaseLayout><Checkout /></BaseLayout>} />
          <Route path="/payment-gateway" element={<PaymentGateway />} />
          
          <Route path="/order-confirmation" element={<BaseLayout><OrderConfirmation /></BaseLayout>} />
          <Route path="/order-history" element={<BaseLayout><OrderHistory /></BaseLayout>} />
          <Route path="/orders/:id" element={<BaseLayout><OrderDetails /></BaseLayout>} />

          {/* Secure Admin Portal Routes */}
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
          <Route path="/admin/categories-brands" element={<AdminLayout><AdminCategoriesBrands /></AdminLayout>} />
          <Route path="/admin/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
          <Route path="/admin/customers" element={<AdminLayout><AdminCustomers /></AdminLayout>} />
          <Route path="/admin/inventory" element={<AdminLayout><AdminInventory /></AdminLayout>} />
          <Route path="/admin/coupons" element={<AdminLayout><AdminCoupons /></AdminLayout>} />
          <Route path="/admin/chat" element={<AdminLayout><AdminChat /></AdminLayout>} />

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
