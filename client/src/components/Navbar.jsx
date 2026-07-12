import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ChatBot from './ChatBot';
import { 
  ShoppingCart, 
  Heart, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Laptop,
  HelpCircle,
  ChevronDown
} from 'lucide-react';

const Navbar = () => {
  const { 
    theme, 
    toggleTheme, 
    user, 
    logout, 
    cart, 
    wishlist, 
    currency, 
    toggleCurrency 
  } = useAppContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelpDropdown, setShowHelpDropdown] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      {/* Jumia top orange notice banner */}
      <div style={{
        backgroundColor: '#f68b1e',
        color: 'white',
        padding: '6px 20px',
        fontSize: '0.8rem',
        fontWeight: '700',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        letterSpacing: '0.5px',
        zIndex: 1001,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '32px'
      }}>
        <span>🎉 Special Loyalty Reward: Place more than 3 orders with us and receive an automatic 10% discount on all subsequent orders!</span>
      </div>

      <nav className="navbar" style={{ 
        top: '32px', 
        height: '72px', 
        backgroundColor: 'var(--surface)', 
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
      }}>
        <div className="navbar-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
          {/* Brand Logo - Jumia Style */}
          <Link to="/" className="logo-container" style={{ 
            color: '#f68b1e', 
            fontWeight: '900', 
            fontSize: '1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '2px',
            textTransform: 'uppercase'
          }}>
            <Laptop size={24} style={{ color: '#f68b1e' }} />
            <span style={{ color: 'var(--text-primary)' }}>Tech</span>
            <span style={{ color: '#f68b1e' }}>Central</span>
          </Link>

          {/* Jumia Style Wide Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ 
            display: 'flex', 
            flexGrow: 1, 
            maxWidth: '520px', 
            margin: '0 30px', 
            position: 'relative' 
          }}>
            <input
              type="text"
              placeholder="Search products, brands and categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 16px',
                borderRadius: '4px 0 0 4px',
                border: '1px solid var(--border)',
                borderRight: 'none',
                backgroundColor: 'var(--bg-primary)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                borderRadius: '0 4px 4px 0',
                backgroundColor: '#f68b1e',
                color: 'white',
                height: '40px',
                padding: '0 24px',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                boxShadow: 'none',
                flexShrink: 0
              }}
            >
              SEARCH
            </button>
          </form>

          {/* Jumia Actions (Account Dropdown, Help, Cart) */}
          <div className="nav-actions" style={{ gap: '20px' }}>
            {/* Currency Converter */}
            <button 
              onClick={toggleCurrency} 
              className="btn btn-secondary btn-sm"
              title={`Switch currency to ${currency === 'USD' ? 'GHS' : 'USD'}`}
              style={{ fontWeight: 'bold', fontSize: '0.75rem', height: '36px', padding: '0 12px' }}
            >
              {currency}
            </button>

            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="dark-mode-toggle" style={{ padding: '6px' }} title="Toggle Light/Dark Theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Customer Auth / Profile Link */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link 
                  to={user.role === 'admin' ? '/admin' : '/profile'} 
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', fontWeight: '600' }}
                >
                  {user.role === 'admin' ? <LayoutDashboard size={14} /> : <User size={14} />}
                  <span>Hi, {user.first_name}</span>
                </Link>
                <button onClick={logout} title="Logout" style={{ padding: '6px', color: 'var(--text-muted)' }}>
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="btn btn-secondary" 
                style={{ 
                  height: '36px', 
                  fontSize: '0.85rem', 
                  fontWeight: '700', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  borderColor: 'var(--border)'
                }}
              >
                <User size={16} />
                <span>Sign In</span>
              </Link>
            )}

            {/* Help Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowHelpDropdown(!showHelpDropdown)}
                className="nav-link"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  fontWeight: '600', 
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  padding: '6px 0'
                }}
              >
                <HelpCircle size={16} />
                <span>Help</span>
                <ChevronDown size={12} />
              </button>
              {showHelpDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  width: '180px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 1002,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '8px 0'
                }}>
                  <Link to="/faq" className="nav-link" onClick={() => setShowHelpDropdown(false)} style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'block' }}>FAQ Center</Link>
                  <Link to="/about" className="nav-link" onClick={() => setShowHelpDropdown(false)} style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'block' }}>About TechCentral</Link>
                  <Link to="/contact" className="nav-link" onClick={() => setShowHelpDropdown(false)} style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'block' }}>Contact Support</Link>
                </div>
              )}
            </div>

            {/* Wishlist Link */}
            {user && (
              <Link to="/wishlist" className="badge-wrapper" title="Wishlist" style={{ color: 'var(--text-primary)' }}>
                <Heart size={20} />
                {wishlist.length > 0 && <span className="badge" style={{ top: '-4px', right: '-8px' }}>{wishlist.length}</span>}
              </Link>
            )}

            {/* Cart Link - Jumia Style with label */}
            <Link 
              to="/cart" 
              className="badge-wrapper" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                color: 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '0.875rem'
              }}
            >
              <div style={{ position: 'relative' }}>
                <ShoppingCart size={22} style={{ color: '#f68b1e' }} />
                {cartCount > 0 && (
                  <span className="badge" style={{ 
                    top: '-6px', 
                    right: '-8px', 
                    backgroundColor: '#f68b1e',
                    border: '2px solid var(--surface)' 
                  }}>
                    {cartCount}
                  </span>
                )}
              </div>
              <span style={{ display: 'none', display: 'inline' }}>Cart</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Floating chatbot assistant */}
      <ChatBot />
    </>
  );
};

export default Navbar;
