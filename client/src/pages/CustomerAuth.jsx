import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LogIn, UserPlus, KeyRound, Mail } from 'lucide-react';

// Login Component
export const Login = () => {
  const { login, showToast } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userObj = await login(email, password);
      if (userObj.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/profile');
      }
    } catch (err) {
      // toast shown in context
    } finally {
      setLoading(false);
    }
  };

  const autofillUser = (type) => {
    if (type === 'admin') {
      setEmail('admin@techcentral.com');
      setPassword('AdminPassword123!');
    } else {
      setEmail('customer@techcentral.com');
      setPassword('CustomerPassword123!');
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '60px auto', padding: '30px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--surface)' }}>
      <h2 style={{ fontWeight: '800', textAlign: 'center', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <LogIn size={22} style={{ color: 'var(--primary)' }} /> Sign In
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <span className="form-label">Email Address</span>
          <input 
            type="email" 
            className="form-input" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="form-label" style={{ margin: 0 }}>Password</span>
            <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Forgot?</Link>
          </div>
          <input 
            type="password" 
            className="form-input" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* Demo Autofill Panels */}
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '10px' }}>Demo Quick Login</h4>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => autofillUser('customer')} className="btn btn-secondary btn-sm" style={{ flexGrow: 1, fontSize: '0.75rem' }}>
            Customer Demo
          </button>
          <button onClick={() => autofillUser('admin')} className="btn btn-secondary btn-sm" style={{ flexGrow: 1, fontSize: '0.75rem' }}>
            Admin Demo
          </button>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Register here</Link>
      </p>
    </div>
  );
};

// Register Component
export const Register = () => {
  const { register, showToast } = useAppContext();
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ first_name, last_name, email, phone, password });
      navigate('/profile');
    } catch (err) {
      // error handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '60px auto', padding: '30px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--surface)' }}>
      <h2 style={{ fontWeight: '800', textAlign: 'center', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <UserPlus size={22} style={{ color: 'var(--success)' }} /> Register Account
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <span className="form-label">First Name</span>
            <input type="text" className="form-input" required value={first_name} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="form-group">
            <span className="form-label">Last Name</span>
            <input type="text" className="form-input" required value={last_name} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <span className="form-label">Email Address</span>
          <input type="email" className="form-input" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <span className="form-label">Phone Number</span>
          <input type="tel" className="form-input" placeholder="+233..." value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="form-group">
          <span className="form-label">Password</span>
          <input type="password" className="form-input" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Already registered? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Sign In here</Link>
      </p>
    </div>
  );
};

// Forgot Password Component
export const ForgotPassword = () => {
  const { apiCall, showToast } = useAppContext();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiCall('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      showToast('Simulated Reset Code (123456) sent to console and notifications log!', 'success');
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '80px auto', padding: '30px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--surface)' }}>
      <h2 style={{ fontWeight: '800', textAlign: 'center', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <KeyRound size={22} /> Forgot Password
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '20px' }}>
        Provide your account email. We will generate a simulated code (<b>123456</b>) to let you reset.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <span className="form-label">Email Address</span>
          <input type="email" className="form-input" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Processing...' : 'Send Reset Code'}
        </button>
      </form>
    </div>
  );
};

// Reset Password Component
export const ResetPassword = () => {
  const { apiCall, showToast } = useAppContext();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiCall('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, new_password: newPassword })
      });
      showToast('Password updated! Sign in with your new credentials.', 'success');
      navigate('/login');
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '80px auto', padding: '30px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--surface)' }}>
      <h2 style={{ fontWeight: '800', textAlign: 'center', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <KeyRound size={22} style={{ color: 'var(--warning)' }} /> Reset Password
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <span className="form-label">Email Address</span>
          <input type="email" className="form-input" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <span className="form-label">Verification Code (Demo: 123456)</span>
          <input type="text" className="form-input" required placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div className="form-group">
          <span className="form-label">New Password</span>
          <input type="password" className="form-input" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Updating Password...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
};
