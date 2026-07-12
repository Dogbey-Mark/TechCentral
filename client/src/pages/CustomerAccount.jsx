import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { User, MapPin, Heart, Edit, Trash2, Plus, ArrowRight, ShoppingCart } from 'lucide-react';

// Profile Component
export const Profile = () => {
  const { user, updateProfile, showToast } = useAppContext();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setEmail(user.email);
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        ...(password ? { password } : {})
      });
      setPassword('');
    } catch (err) {
      // error handled in context
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ padding: '60px', textAlign: 'center' }}>Please log in to view this page.</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', paddingBottom: '60px' }}>
      <h1 className="section-title" style={{ marginBottom: '30px' }}>My Account</h1>
      
      {/* Short quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        <Link to="/address-book" className="category-card" style={{ padding: '20px' }}>
          <MapPin size={24} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 'bold' }}>Manage Addresses</span>
        </Link>
        <Link to="/order-history" className="category-card" style={{ padding: '20px' }}>
          <User size={24} style={{ color: 'var(--success)' }} />
          <span style={{ fontWeight: 'bold' }}>Order History</span>
        </Link>
        <Link to="/wishlist" className="category-card" style={{ padding: '20px' }}>
          <Heart size={24} style={{ color: 'var(--danger)' }} />
          <span style={{ fontWeight: 'bold' }}>My Wishlist</span>
        </Link>
      </div>

      <div style={{ padding: '30px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--surface)' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={20} /> Update Profile Info
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <span className="form-label">First Name</span>
              <input type="text" className="form-input" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="form-group">
              <span className="form-label">Last Name</span>
              <input type="text" className="form-input" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <span className="form-label">Email Address</span>
            <input type="email" className="form-input" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <span className="form-label">Phone Number</span>
            <input type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <span className="form-label">Change Password (leave empty to keep current)</span>
            <input type="password" className="form-input" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Address Book Component
export const AddressBook = () => {
  const { apiCall, showToast } = useAppContext();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form toggling
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form fields
  const [title, setTitle] = useState('Home');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const fetchAddresses = () => {
    setLoading(true);
    apiCall('/auth/addresses')
      .then(data => {
        setAddresses(data);
        setLoading(false);
      })
      .catch(err => {
        showToast(err.message, 'danger');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle('Home');
    setRecipientName('');
    setRecipientPhone('');
    setStreetAddress('');
    setCity('');
    setRegion('');
    setIsDefault(false);
    setShowForm(false);
  };

  const handleEditClick = (addr) => {
    setEditingId(addr.id);
    setTitle(addr.title);
    setRecipientName(addr.recipient_name);
    setRecipientPhone(addr.recipient_phone);
    setStreetAddress(addr.street_address);
    setCity(addr.city);
    setRegion(addr.region || '');
    setIsDefault(addr.is_default === 1);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      street_address: streetAddress,
      city,
      region,
      is_default: isDefault ? 1 : 0
    };

    try {
      if (editingId) {
        await apiCall(`/auth/addresses/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Address updated successfully!', 'success');
      } else {
        await apiCall('/auth/addresses', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Address added successfully!', 'success');
      }
      resetForm();
      fetchAddresses();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await apiCall(`/auth/addresses/${id}`, {
        method: 'DELETE'
      });
      showToast('Address deleted.', 'info');
      fetchAddresses();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="section-title" style={{ margin: 0 }}>Address Book</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
            <Plus size={16} /> Add Address
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ padding: '30px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--surface)', marginBottom: '30px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '20px' }}>
            {editingId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <span className="form-label">Address Title (e.g. Home, Office)</span>
                <input type="text" className="form-input" required value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <span className="form-label">Recipient Name</span>
                <input type="text" className="form-input" required value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <span className="form-label">Recipient Phone</span>
                <input type="tel" className="form-input" required placeholder="+233..." value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <span className="form-label">Street Address</span>
                <input type="text" className="form-input" required placeholder="House No, Road name, Block" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <span className="form-label">City / Town</span>
                <input type="text" className="form-input" required value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="form-group">
                <span className="form-label">Region</span>
                <input type="text" className="form-input" value={region} onChange={(e) => setRegion(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" className="checkbox-input" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                Set as Default Delivery Address
              </label>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary">Save Address</button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ borderTopColor: 'var(--primary)' }}></div>
        </div>
      ) : addresses.length === 0 ? (
        <div className="category-card" style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>You have no delivery addresses saved. Save one to speed up checkouts!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {addresses.map(addr => (
            <div key={addr.id} style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '12px', backgroundColor: 'var(--surface)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {addr.is_default === 1 && (
                <span className="status-tag tag-success" style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '0.65rem' }}>Default</span>
              )}
              <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '10px' }}>{addr.title}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flexGrow: 1 }}>
                <b>Name:</b> {addr.recipient_name}<br />
                <b>Phone:</b> {addr.recipient_phone}<br />
                <b>Address:</b> {addr.street_address}, {addr.city}{addr.region ? `, ${addr.region}` : ''}
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <button onClick={() => handleEditClick(addr)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--primary)' }}>
                  <Edit size={14} /> Edit
                </button>
                <button onClick={() => handleDelete(addr.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--danger)' }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Wishlist Component
export const Wishlist = () => {
  const { wishlist, removeFromWishlist, addToCart, formatPrice } = useAppContext();

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', paddingBottom: '60px' }}>
      <h1 className="section-title" style={{ marginBottom: '30px' }}>My Saved Items</h1>

      {wishlist.length === 0 ? (
        <div className="category-card" style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Your wishlist is currently empty.</p>
          <Link to="/shop" className="btn btn-primary btn-sm">Explore Products</Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {wishlist.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <img src={item.image_url} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'contain', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }} />
                      <div>
                        <Link to={`/products/${item.product_id}`} style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{item.name}</Link>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 'bold' }}>
                      {formatPrice(item.discount_price !== null ? item.discount_price : item.price)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-tag ${item.stock > 0 ? 'tag-success' : 'tag-danger'}`}>
                      {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {item.stock > 0 && (
                        <button onClick={() => { addToCart(item, 1); removeFromWishlist(item.id); }} className="btn btn-primary btn-sm">
                          <ShoppingCart size={12} /> Add to Cart
                        </button>
                      )}
                      <button onClick={() => removeFromWishlist(item.id)} className="btn btn-danger btn-sm btn-icon" title="Remove">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
