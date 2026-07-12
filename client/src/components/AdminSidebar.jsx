import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
  LayoutDashboard,
  ShoppingBag,
  ListCollapse,
  ShoppingCart,
  Users,
  Warehouse,
  Ticket,
  MessageSquare,
  LogOut,
  Home
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();
  const { logout } = useAppContext();

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'Products', path: '/admin/products', icon: <ShoppingBag size={18} /> },
    { name: 'Categories & Brands', path: '/admin/categories-brands', icon: <ListCollapse size={18} /> },
    { name: 'Orders', path: '/admin/orders', icon: <ShoppingCart size={18} /> },
    { name: 'Customers', path: '/admin/customers', icon: <Users size={18} /> },
    { name: 'Inventory & Stock', path: '/admin/inventory', icon: <Warehouse size={18} /> },
    { name: 'Coupons & Discounts', path: '/admin/coupons', icon: <Ticket size={18} /> },
    { name: 'Chat Support', path: '/admin/chat', icon: <MessageSquare size={18} /> }
  ];

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <Warehouse size={22} />
        <span>Admin Hub</span>
      </div>

      <ul className="admin-menu">
        {menuItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <li key={item.name} className={`admin-menu-item ${isActive ? 'active' : ''}`}>
              <Link to={item.path}>
                {item.icon}
                <span>{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <ul className="admin-menu" style={{ marginTop: 'auto' }}>
        <li className="admin-menu-item">
          <Link to="/">
            <Home size={18} />
            <span>Return to Site</span>
          </Link>
        </li>
        <li className="admin-menu-item">
          <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </a>
        </li>
      </ul>
    </div>
  );
};

export default AdminSidebar;
