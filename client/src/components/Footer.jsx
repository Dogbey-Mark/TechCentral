import React from 'react';
import { Link } from 'react-router-dom';
import { Laptop } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Link to="/" className="logo-container" style={{ display: 'inline-flex', marginBottom: '12px' }}>
            <Laptop size={22} />
            <span>TechCentral</span>
          </Link>
          <p>
            Premium online gadget shop supplying the latest laptops, smartphones, high-yield printers, and accessories across Ghana and internationally.
          </p>
          <p style={{ fontSize: '0.8rem', marginTop: '16px', color: 'var(--text-muted)' }}>
            Support: support@techcentral.com<br />
            Phone: +233 509095092
          </p>
        </div>

        <div>
          <h4 className="footer-heading">Categories</h4>
          <ul className="footer-links">
            <li><Link to="/shop?category=laptops">Laptops</Link></li>
            <li><Link to="/shop?category=phones">Phones</Link></li>
            <li><Link to="/shop?category=printers">Printers</Link></li>
            <li><Link to="/shop?category=tablets">Tablets & IPads</Link></li>
            <li><Link to="/shop?category=accessories">Accessories</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="footer-heading">Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/shop">Browse Shop</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact Support</Link></li>
            <li><Link to="/faq">Frequently Asked Questions</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="footer-heading">Legal</h4>
          <ul className="footer-links">
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/faq">Warranty Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} TechCentral. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', opacity: 0.8 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>PAYMENT CHANNELS:</span>
          <span style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>MTN Mobile Money</span>
          <span style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Telecel Cash</span>
          <span style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Stripe Card</span>
          <span style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>PayPal</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
