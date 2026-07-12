import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { 
  DollarSign, 
  ShoppingBag, 
  ShoppingCart, 
  Users, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Save, 
  PlusCircle, 
  X,
  MessageSquare
} from 'lucide-react';

// ADMIN DASHBOARD
export const Dashboard = () => {
  const { apiCall, formatPrice, showToast } = useAppContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = () => {
    apiCall('/chats/admin/notifications')
      .then(setSessions => setNotifications(setSessions))
      .catch(console.error);
  };

  useEffect(() => {
    apiCall('/reports/dashboard')
      .then(setData)
      .catch(err => showToast(err.message, 'danger'))
      .finally(() => setLoading(false));

    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="spinner" style={{ borderTopColor: 'var(--primary)', margin: '40px auto' }}></div>;
  if (!data) return <div>Failed to load dashboard data.</div>;

  const { metrics, topProducts, recentCustomers, recentOrders } = data;

  return (
    <div>
      <h1 className="section-title" style={{ marginBottom: '30px' }}>Dashboard Overview</h1>

      {/* Unread Alerts Log Panel */}
      {notifications.filter(n => n.read === 0).length > 0 && (
        <div className="table-container" style={{ marginBottom: '30px', padding: '20px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.05rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--danger)', display: 'inline-block' }}></span>
              Unread System Alerts ({notifications.filter(n => n.read === 0).length})
            </h3>
            <button 
              onClick={() => {
                apiCall('/chats/admin/notifications/read-all', { method: 'POST' })
                  .then(() => {
                    showToast('All notifications marked as read.', 'success');
                    loadNotifications();
                  })
                  .catch(err => showToast(err.message, 'danger'));
              }}
              className="btn btn-secondary btn-sm"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              Mark All as Read
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            {notifications.filter(n => n.read === 0).map(n => (
              <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--bg-primary)', borderLeft: '4px solid var(--primary)', borderRadius: '4px', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{n.message}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleTimeString()}</span>
                  <button 
                    onClick={() => {
                      apiCall(`/chats/admin/notifications/${n.id}/read`, { method: 'PUT' })
                        .then(() => loadNotifications())
                        .catch(err => showToast(err.message, 'danger'));
                    }}
                    style={{ color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}
                    title="Mark as Read"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Total Revenue</span>
            <span className="metric-value">{formatPrice(metrics.totalRevenue)}</span>
          </div>
          <div className="metric-icon-box metric-blue"><DollarSign size={20} /></div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Total Orders</span>
            <span className="metric-value">{metrics.totalOrders}</span>
          </div>
          <div className="metric-icon-box metric-green"><ShoppingCart size={20} /></div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Pending Orders</span>
            <span className="metric-value">{metrics.pendingOrders}</span>
          </div>
          <div className="metric-icon-box metric-orange"><ShoppingBag size={20} /></div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Total Customers</span>
            <span className="metric-value">{metrics.totalCustomers}</span>
          </div>
          <div className="metric-icon-box metric-blue"><Users size={20} /></div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Low Stock Alerts</span>
            <span className="metric-value" style={{ color: metrics.lowStockItems > 0 ? 'var(--danger)' : 'inherit' }}>
              {metrics.lowStockItems}
            </span>
          </div>
          <div className="metric-icon-box metric-red"><AlertTriangle size={20} /></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', marginTop: '40px' }}>
        {/* Recent Orders Table */}
        <div className="table-container" style={{ margin: 0 }}>
          <div style={{ padding: '20px', fontWeight: 'bold', fontSize: '1.1rem', borderBottom: '1px solid var(--border)' }}>
            Recent Customer Orders
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 'bold' }}>{o.order_number}</td>
                  <td>{o.first_name} {o.last_name}</td>
                  <td>{formatPrice(o.total_amount)}</td>
                  <td>
                    <span className={`status-tag ${o.status === 'Pending' ? 'tag-pending' : 'tag-success'}`}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Selling Products */}
        <div className="table-container" style={{ margin: 0 }}>
          <div style={{ padding: '20px', fontWeight: 'bold', fontSize: '1.1rem', borderBottom: '1px solid var(--border)' }}>
            Top Selling Gadgets
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Sales Count</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={p.image_url} alt="" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                      <span style={{ fontWeight: '600' }}>{p.name}</span>
                    </div>
                  </td>
                  <td>{formatPrice(p.price)}</td>
                  <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{p.total_sold} units</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ADMIN PRODUCTS (CRUD)
export const AdminProducts = () => {
  const { apiCall, formatPrice, showToast, API_URL } = useAppContext();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal toggler
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [warranty, setWarranty] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState('active');
  
  // Custom Dynamic Specifications Form List
  const [specsList, setSpecsList] = useState([{ key: '', val: '' }]);

  // Additional Media States
  const [additionalImages, setAdditionalImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [tempVideoUrl, setTempVideoUrl] = useState('');

  const fetchFiltersAndProducts = async () => {
    setLoading(true);
    try {
      const cats = await apiCall('/products/categories');
      setCategories(cats);
      const brs = await apiCall('/products/brands');
      setBrands(brs);
      const prds = await apiCall('/products/admin-all');
      setProducts(prds);
    } catch (e) {
      showToast(e.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersAndProducts();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setDiscountPrice('');
    setCategoryId('');
    setBrandId('');
    setStock('');
    setSku('LAP-' + Math.floor(1000 + Math.random() * 9000));
    setWarranty('1 Year Local Warranty');
    setImageUrl('');
    setFeatured(false);
    setStatus('active');
    setSpecsList([{ key: 'RAM', val: '8GB' }, { key: 'Storage', val: '256GB' }]);
    setAdditionalImages([]);
    setVideos([]);
    setTempImageUrl('');
    setTempVideoUrl('');
    setShowModal(true);
  };

  const handleOpenEdit = async (prod) => {
    showToast('Loading product details...', 'info');
    try {
      const fullProd = await apiCall(`/products/${prod.id}`);
      setEditingProduct(fullProd);
      setName(fullProd.name);
      setDescription(fullProd.description);
      setPrice(fullProd.price);
      setDiscountPrice(fullProd.discount_price || '');
      setCategoryId(fullProd.category_id || '');
      setBrandId(fullProd.brand_id || '');
      setStock(fullProd.stock);
      setSku(fullProd.sku);
      setWarranty(fullProd.warranty || '');
      setImageUrl(fullProd.image_url || '');
      setFeatured(fullProd.featured === 1);
      setStatus(fullProd.status);

      setAdditionalImages(fullProd.images || []);
      setVideos(fullProd.videos || []);
      setTempImageUrl('');
      setTempVideoUrl('');

      // Load specs list
      try {
        const parsed = fullProd.specifications ? JSON.parse(fullProd.specifications) : {};
        const list = Object.entries(parsed).map(([k, v]) => ({ key: k, val: v }));
        setSpecsList(list.length > 0 ? list : [{ key: '', val: '' }]);
      } catch (e) {
        setSpecsList([{ key: '', val: '' }]);
      }

      setShowModal(true);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleSpecChange = (idx, field, value) => {
    setSpecsList(prev => {
      const updated = [...prev];
      updated[idx][field] = value;
      return updated;
    });
  };

  const handleAddSpecRow = () => {
    setSpecsList(prev => [...prev, { key: '', val: '' }]);
  };

  const handleRemoveSpecRow = (idx) => {
    setSpecsList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    showToast('Uploading image to server...', 'info');
    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setImageUrl(data.url);
      showToast('Image uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleAdditionalImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    showToast('Uploading image...', 'info');
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setAdditionalImages(prev => [...prev, data.url]);
      }
      showToast('Image(s) uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleVideoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    showToast('Uploading video...', 'info');
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setVideos(prev => [...prev, data.url]);
      }
      showToast('Video(s) uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const addAdditionalImageUrl = () => {
    if (!tempImageUrl.trim()) return;
    setAdditionalImages(prev => [...prev, tempImageUrl.trim()]);
    setTempImageUrl('');
  };

  const addVideoUrl = () => {
    if (!tempVideoUrl.trim()) return;
    setVideos(prev => [...prev, tempVideoUrl.trim()]);
    setTempVideoUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Build specs JSON
    const specsMap = {};
    specsList.forEach(item => {
      if (item.key.trim() && item.val.trim()) {
        specsMap[item.key.trim()] = item.val.trim();
      }
    });

    const payload = {
      name,
      description,
      price,
      discount_price: discountPrice || null,
      category_id: categoryId || null,
      brand_id: brandId || null,
      stock,
      sku,
      warranty,
      specifications: JSON.stringify(specsMap),
      image_url: imageUrl,
      featured: featured ? 1 : 0,
      status,
      images: additionalImages,
      videos: videos
    };

    try {
      if (editingProduct) {
        await apiCall(`/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Product updated!', 'success');
      } else {
        await apiCall('/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Product created!', 'success');
      }
      setShowModal(false);
      fetchFiltersAndProducts();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await apiCall(`/products/${id}`, {
        method: 'DELETE'
      });
      showToast('Product deleted.', 'info');
      fetchFiltersAndProducts();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="section-title" style={{ margin: 0 }}>Manage Products</h1>
        <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="spinner" style={{ borderTopColor: 'var(--primary)', margin: '40px auto' }}></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(prod => (
                <tr key={prod.id}>
                  <td>
                    <img src={prod.image_url} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{prod.name}</td>
                  <td>{prod.sku}</td>
                  <td>{prod.category_name}</td>
                  <td>{formatPrice(prod.price)}</td>
                  <td>
                    <span style={{ color: prod.stock <= 3 ? 'var(--danger)' : 'inherit', fontWeight: prod.stock <= 3 ? 'bold' : 'normal' }}>
                      {prod.stock}
                    </span>
                  </td>
                  <td>
                    <span className={`status-tag ${prod.status === 'active' ? 'tag-success' : 'tag-pending'}`}>{prod.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleOpenEdit(prod)} className="btn btn-secondary btn-sm btn-icon" title="Edit">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(prod.id)} className="btn btn-danger btn-sm btn-icon" title="Delete">
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

      {/* POPUP MODAL TO ADD/EDIT */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <button onClick={() => setShowModal(false)} className="modal-close"><X size={20} /></button>
            <h3 style={{ fontWeight: 'bold', marginBottom: '24px' }}>
              {editingProduct ? 'Edit Product Details' : 'Add New Gadget Product'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <span className="form-label">Product Title Name</span>
                  <input type="text" className="form-input" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <span className="form-label">SKU Code Reference</span>
                  <input type="text" className="form-input" required value={sku} onChange={(e) => setSku(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <span className="form-label">Description Details</span>
                <textarea rows="3" className="form-input" required value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <span className="form-label">Base Retail Price ($)</span>
                  <input type="number" step="0.01" className="form-input" required value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <span className="form-label">Promo Discount Price ($)</span>
                  <input type="number" step="0.01" className="form-input" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} placeholder="Leave blank if none" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <span className="form-label">Category Group</span>
                  <select className="form-input" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <span className="form-label">Manufacturer Brand</span>
                  <select className="form-input" required value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                    <option value="">Select Brand</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <span className="form-label">Initial Stock Count</span>
                  <input type="number" className="form-input" required value={stock} onChange={(e) => setStock(e.target.value)} />
                </div>
                <div className="form-group">
                  <span className="form-label">Warranty Support Period</span>
                  <input type="text" className="form-input" value={warranty} onChange={(e) => setWarranty(e.target.value)} placeholder="e.g. 1 Year HP Warranty" />
                </div>
              </div>

              {/* Upload image visual helper */}
              <div className="form-row">
                <div className="form-group">
                  <span className="form-label">Product Image URL</span>
                  <input type="text" className="form-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Paste URL or upload image" />
                </div>
                <div className="form-group">
                  <span className="form-label">Upload Local Image</span>
                  <input type="file" accept="image/*" className="form-input" style={{ padding: '8px' }} onChange={handleImageUpload} />
                </div>
              </div>

              {/* Additional Product Media Assets (Multiple Images & Videos) */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', backgroundColor: 'var(--bg-secondary)', marginBottom: '20px' }}>
                <span className="form-label" style={{ fontWeight: 'bold', marginBottom: '12px' }}>Additional Product Media Gallery</span>
                
                {/* Additional Images Subsection */}
                <div style={{ marginBottom: '20px' }}>
                  <span className="form-label" style={{ fontSize: '0.85rem' }}>Additional Image Gallery ({additionalImages.length})</span>
                  
                  {/* Grid of existing additional images */}
                  {additionalImages.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {additionalImages.map((img, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '70px', height: '70px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--surface)' }}>
                          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          <button type="button" onClick={() => setAdditionalImages(prev => prev.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239, 68, 68, 0.8)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', padding: 0 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add additional image input controls */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="text" className="form-input" style={{ flexGrow: 1, margin: 0, padding: '8px', fontSize: '0.85rem' }} placeholder="Paste sub-image URL" value={tempImageUrl} onChange={(e) => setTempImageUrl(e.target.value)} />
                    <button type="button" onClick={addAdditionalImageUrl} className="btn btn-secondary btn-sm" style={{ padding: '8px 12px' }}>Add URL</button>
                    <div style={{ position: 'relative' }}>
                      <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '8px 12px' }}>Upload Image</button>
                      <input type="file" multiple accept="image/*" onChange={handleAdditionalImageUpload} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
                    </div>
                  </div>
                </div>

                {/* Additional Videos Subsection */}
                <div>
                  <span className="form-label" style={{ fontSize: '0.85rem' }}>Product Videos ({videos.length})</span>

                  {/* List of existing videos */}
                  {videos.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {videos.map((vid, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '90px', height: '70px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--surface)' }}>
                          <video src={vid} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                          <button type="button" onClick={() => setVideos(prev => prev.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239, 68, 68, 0.8)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', padding: 0 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add video input controls */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="text" className="form-input" style={{ flexGrow: 1, margin: 0, padding: '8px', fontSize: '0.85rem' }} placeholder="Paste video URL" value={tempVideoUrl} onChange={(e) => setTempVideoUrl(e.target.value)} />
                    <button type="button" onClick={addVideoUrl} className="btn btn-secondary btn-sm" style={{ padding: '8px 12px' }}>Add URL</button>
                    <div style={{ position: 'relative' }}>
                      <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '8px 12px' }}>Upload Video</button>
                      <input type="file" multiple accept="video/*" onChange={handleVideoUpload} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic specs subform */}
              <div className="form-group" style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', backgroundColor: 'var(--bg-secondary)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="form-label" style={{ margin: 0, fontWeight: 'bold' }}>Hardware Technical Specifications</span>
                  <button type="button" onClick={handleAddSpecRow} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <PlusCircle size={12} /> Add Attribute
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {specsList.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="text" className="form-input" style={{ padding: '8px', fontSize: '0.85rem' }} placeholder="Spec Key (e.g. RAM)" value={item.key} onChange={(e) => handleSpecChange(idx, 'key', e.target.value)} />
                      <input type="text" className="form-input" style={{ padding: '8px', fontSize: '0.85rem' }} placeholder="Value (e.g. 16GB)" value={item.val} onChange={(e) => handleSpecChange(idx, 'val', e.target.value)} />
                      <button type="button" onClick={() => handleRemoveSpecRow(idx)} style={{ color: 'var(--danger)', padding: '6px' }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="checkbox-label" style={{ marginTop: '8px' }}>
                    <input type="checkbox" className="checkbox-input" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                    Display in Featured Highlights
                  </label>
                </div>
                <div className="form-group">
                  <span className="form-label">Product Status</span>
                  <select className="form-input" style={{ padding: '8px' }} value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="active">Active Catalog</option>
                    <option value="draft">Draft / Hidden</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Save Product Changes' : 'Create Product'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ADMIN CATEGORIES & BRANDS MANAGERS
export const AdminCategoriesBrands = () => {
  const { apiCall, showToast } = useAppContext();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  
  const [catName, setCatName] = useState('');
  const [brandName, setBrandName] = useState('');

  const fetchItems = () => {
    apiCall('/products/categories').then(setCategories).catch(console.error);
    apiCall('/products/brands').then(setBrands).catch(console.error);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await apiCall('/products/categories', {
        method: 'POST',
        body: JSON.stringify({ name: catName })
      });
      showToast('Category created!', 'success');
      setCatName('');
      fetchItems();
    } catch (e) {
      showToast(e.message, 'danger');
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!brandName.trim()) return;
    try {
      await apiCall('/products/brands', {
        method: 'POST',
        body: JSON.stringify({ name: brandName })
      });
      showToast('Brand created!', 'success');
      setBrandName('');
      fetchItems();
    } catch (e) {
      showToast(e.message, 'danger');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete category?')) return;
    try {
      await apiCall(`/products/categories/${id}`, { method: 'DELETE' });
      fetchItems();
    } catch (e) {
      showToast(e.message, 'danger');
    }
  };

  const handleDeleteBrand = async (id) => {
    if (!window.confirm('Delete brand?')) return;
    try {
      await apiCall(`/products/brands/${id}`, { method: 'DELETE' });
      fetchItems();
    } catch (e) {
      showToast(e.message, 'danger');
    }
  };

  return (
    <div>
      <h1 className="section-title" style={{ marginBottom: '30px' }}>Categories & Brands</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Categories Panel */}
        <div style={{ padding: '24px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--surface)' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '16px' }}>Manage Categories</h3>
          <form onSubmit={handleAddCategory} className="coupon-box" style={{ marginBottom: '20px' }}>
            <input type="text" className="form-input" placeholder="Category name..." value={catName} onChange={(e) => setCatName(e.target.value)} required />
            <button type="submit" className="btn btn-primary btn-sm">Add</button>
          </form>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 'bold' }}>{c.name}</td>
                    <td>
                      <button onClick={() => handleDeleteCategory(c.id)} className="btn btn-danger btn-sm btn-icon">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Brands Panel */}
        <div style={{ padding: '24px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--surface)' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '16px' }}>Manage Brands</h3>
          <form onSubmit={handleAddBrand} className="coupon-box" style={{ marginBottom: '20px' }}>
            <input type="text" className="form-input" placeholder="Brand name..." value={brandName} onChange={(e) => setBrandName(e.target.value)} required />
            <button type="submit" className="btn btn-primary btn-sm">Add</button>
          </form>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Brand Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {brands.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 'bold' }}>{b.name}</td>
                    <td>
                      <button onClick={() => handleDeleteBrand(b.id)} className="btn btn-danger btn-sm btn-icon">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ADMIN ORDERS TRACKER
export const AdminOrders = () => {
  const { apiCall, formatPrice, showToast } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    apiCall('/orders/admin/all')
      .then(setOrders)
      .catch(err => showToast(err.message, 'danger'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await apiCall(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      showToast('Order status updated.', 'success');
      fetchOrders();
    } catch (e) {
      showToast(e.message, 'danger');
    }
  };

  const handlePaymentStatusChange = async (orderId, newPayStatus) => {
    try {
      await apiCall(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ payment_status: newPayStatus })
      });
      showToast('Payment status updated.', 'success');
      fetchOrders();
    } catch (e) {
      showToast(e.message, 'danger');
    }
  };

  return (
    <div>
      <h1 className="section-title" style={{ marginBottom: '30px' }}>Manage Orders</h1>
      {loading ? (
        <div className="spinner" style={{ borderTopColor: 'var(--primary)', margin: '40px auto' }}></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Code</th>
                <th>Customer</th>
                <th>Delivery Address</th>
                <th>Total Paid</th>
                <th>Payment Status</th>
                <th>Shipping Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 'bold' }}>{o.order_number}</td>
                  <td>
                    {o.first_name} {o.last_name}<br />
                    <small style={{ color: 'var(--text-muted)' }}>{o.email}</small>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{o.shipping_address}</td>
                  <td style={{ fontWeight: 'bold' }}>{formatPrice(o.total_amount)}</td>
                  <td>
                    <select 
                      value={o.payment_status}
                      onChange={(e) => handlePaymentStatusChange(o.id, e.target.value)}
                      className="form-input"
                      style={{ padding: '6px 10px', fontSize: '0.8rem', width: '110px' }}
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className="form-input"
                      style={{ padding: '6px 10px', fontSize: '0.8rem', width: '130px' }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Packed">Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
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

// ADMIN CUSTOMERS MANAGERS
export const AdminCustomers = () => {
  const { apiCall, showToast } = useAppContext();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = () => {
    setLoading(true);
    apiCall('/reports/customers')
      .then(setCustomers)
      .catch(err => showToast(err.message, 'danger'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleStatus = async (cust) => {
    const nextStatus = cust.status === 'active' ? 'suspended' : 'active';
    try {
      await apiCall(`/reports/customers/${cust.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      showToast(`Customer status updated to ${nextStatus}`, 'success');
      fetchCustomers();
    } catch (e) {
      showToast(e.message, 'danger');
    }
  };

  return (
    <div>
      <h1 className="section-title" style={{ marginBottom: '30px' }}>Manage Customers</h1>
      {loading ? (
        <div className="spinner" style={{ borderTopColor: 'var(--primary)', margin: '40px auto' }}></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 'bold' }}>{c.first_name} {c.last_name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone || '-'}</td>
                  <td>
                    <span className={`status-tag ${c.status === 'active' ? 'tag-success' : 'tag-danger'}`}>{c.status}</span>
                  </td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={() => handleToggleStatus(c)} 
                      className={`btn ${c.status === 'active' ? 'btn-danger' : 'btn-primary'} btn-sm`}
                      style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                    >
                      {c.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
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

// ADMIN INVENTORY TRACKER
export const AdminInventory = () => {
  const { apiCall, formatPrice, showToast } = useAppContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // inline stock adjustment inputs
  const [stockInputs, setStockInputs] = useState({});

  const fetchInventory = () => {
    setLoading(true);
    apiCall('/reports/inventory')
      .then(data => {
        setItems(data);
        // initialize inputs mapping
        const inputs = {};
        data.forEach(x => { inputs[x.id] = x.stock; });
        setStockInputs(inputs);
        setLoading(false);
      })
      .catch(err => {
        showToast(err.message, 'danger');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleStockInputChange = (id, val) => {
    setStockInputs(prev => ({ ...prev, [id]: val }));
  };

  const handleRestock = async (productId) => {
    const value = stockInputs[productId];
    if (value === undefined || value === '') return;
    try {
      await apiCall(`/reports/inventory/${productId}/restock`, {
        method: 'PUT',
        body: JSON.stringify({ stock: parseInt(value) })
      });
      showToast('Stock quantity updated.', 'success');
      fetchInventory();
    } catch (e) {
      showToast(e.message, 'danger');
    }
  };

  return (
    <div>
      <h1 className="section-title" style={{ marginBottom: '30px' }}>Manage Inventory</h1>
      {loading ? (
        <div className="spinner" style={{ borderTopColor: 'var(--primary)', margin: '40px auto' }}></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Gadget Name</th>
                <th>SKU</th>
                <th>Brand / Category</th>
                <th>Price</th>
                <th>Current Stock</th>
                <th>Alert Status</th>
                <th>Adjust Stock</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const isLow = item.stock <= 3;
                const isOut = item.stock === 0;
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                    <td>{item.sku}</td>
                    <td style={{ fontSize: '0.85rem' }}>{item.brand_name} &gt; {item.category_name}</td>
                    <td>{formatPrice(item.price)}</td>
                    <td style={{ fontWeight: 'bold', color: isLow ? 'var(--danger)' : 'inherit' }}>
                      {item.stock}
                    </td>
                    <td>
                      {isOut ? (
                        <span className="status-tag tag-danger">Out of Stock</span>
                      ) : isLow ? (
                        <span className="status-tag tag-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={10} /> Low Stock
                        </span>
                      ) : (
                        <span className="status-tag tag-success">OK</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input 
                          type="number" 
                          className="form-input" 
                          style={{ width: '80px', padding: '6px 8px', fontSize: '0.85rem' }} 
                          value={stockInputs[item.id] || 0}
                          onChange={(e) => handleStockInputChange(item.id, e.target.value)}
                        />
                        <button onClick={() => handleRestock(item.id)} className="btn btn-secondary btn-sm" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Save size={12} /> Set
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ADMIN COUPONS AND DISCOUNTS
export const AdminCoupons = () => {
  const { apiCall, showToast } = useAppContext();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  // New coupon fields
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  const fetchCoupons = () => {
    setLoading(true);
    apiCall('/orders/coupons')
      .then(setCoupons)
      .catch(err => showToast(err.message, 'danger'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || !discountPercent) return;
    try {
      await apiCall('/orders/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code,
          discount_percent: discountPercent,
          expiry_date: expiryDate || null,
          usage_limit: usageLimit || null
        })
      });
      showToast('Promo coupon code registered.', 'success');
      setCode('');
      setDiscountPercent('');
      setExpiryDate('');
      setUsageLimit('');
      fetchCoupons();
    } catch (e) {
      showToast(e.message, 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete coupon?')) return;
    try {
      await apiCall(`/orders/coupons/${id}`, { method: 'DELETE' });
      fetchCoupons();
    } catch (e) {
      showToast(e.message, 'danger');
    }
  };

  return (
    <div>
      <h1 className="section-title" style={{ marginBottom: '30px' }}>Coupons & Discounts</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', alignItems: 'start' }}>
        {/* Create form */}
        <div style={{ padding: '24px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--surface)' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '20px' }}>Create Promo Code</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <span className="form-label">Coupon Code (Uppercase e.g. OFF25)</span>
              <input type="text" className="form-input" required placeholder="OFF25" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="form-group">
              <span className="form-label">Discount Percentage (%)</span>
              <input type="number" min="1" max="100" className="form-input" required placeholder="25" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
            </div>
            <div className="form-group">
              <span className="form-label">Expiry Date (optional)</span>
              <input type="date" className="form-input" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
            <div className="form-group">
              <span className="form-label">Usage limit count (optional)</span>
              <input type="number" className="form-input" placeholder="100" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Coupon</button>
          </form>
        </div>

        {/* List table */}
        {loading ? (
          <div className="spinner" style={{ borderTopColor: 'var(--primary)' }}></div>
        ) : (
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Promo Code</th>
                  <th>Discount</th>
                  <th>Limit Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 'bold' }}>{c.code}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>{c.discount_percent}% OFF</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      Used: {c.used_count} / {c.usage_limit || '∞'}<br />
                      <small style={{ color: 'var(--text-muted)' }}>Expiry: {c.expiry_date || 'Never'}</small>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(c.id)} className="btn btn-danger btn-sm btn-icon">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminChat = () => {
  const { apiCall, showToast } = useAppContext();
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyInput, setReplyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  
  const loadSessions = () => {
    apiCall('/chats/admin/sessions')
      .then(setSessions)
      .catch(err => console.error('Failed to load chat sessions:', err));
  };

  const loadMessages = (sessionId) => {
    setLoadingMessages(true);
    apiCall(`/chats/admin/messages/${sessionId}`)
      .then(setMessages)
      .catch(err => showToast(err.message, 'danger'))
      .finally(() => setLoadingMessages(false));
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval;
    if (selectedSessionId) {
      loadMessages(selectedSessionId);
      interval = setInterval(() => {
        apiCall(`/chats/admin/messages/${selectedSessionId}`)
          .then(setMessages)
          .catch(console.error);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedSessionId]);

  const handleSelectSession = (session) => {
    setSelectedSessionId(session.session_id);
    setSelectedSession(session);
    setReplyInput('');
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyInput.trim() || loading || !selectedSessionId) return;

    const message = replyInput.trim();
    setReplyInput('');
    setLoading(true);

    try {
      await apiCall('/chats/admin/reply', {
        method: 'POST',
        body: JSON.stringify({
          session_id: selectedSessionId,
          message
        })
      });
      // reload
      const msgs = await apiCall(`/chats/admin/messages/${selectedSessionId}`);
      setMessages(msgs);
      loadSessions();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (sessionId, status) => {
    try {
      await apiCall(`/chats/admin/sessions/${sessionId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      showToast(`Chat status updated to ${status}.`, 'success');
      loadSessions();
      if (selectedSessionId === sessionId) {
        setSelectedSession(prev => ({ ...prev, status }));
      }
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <h1 className="section-title" style={{ marginBottom: '20px' }}>Customer Support Hub</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', flexGrow: 1, overflow: 'hidden' }}>
        {/* Left column: Sessions List */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '16px', fontWeight: 'bold', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Active Conversations</span>
            <button onClick={loadSessions} style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>Refresh</button>
          </div>
          {sessions.length === 0 ? (
            <div style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>No active chat sessions.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {sessions.map(s => {
                const isSelected = selectedSessionId === s.session_id;
                const customerName = s.first_name ? `${s.first_name} ${s.last_name}` : `Guest (${s.session_id.substring(0, 6)})`;
                const needsAttention = s.status === 'admin';
                
                return (
                  <button
                    key={s.session_id}
                    onClick={() => handleSelectSession(s)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--primary-glow)' : 'transparent',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                        {customerName}
                      </span>
                      {needsAttention && (
                        <span className="status-tag tag-danger" style={{ fontSize: '0.75rem', padding: '2px 6px' }}>Needs Toby</span>
                      )}
                    </div>
                    {s.last_message && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', display: 'block' }}>
                        {s.last_message}
                      </span>
                    )}
                    {s.last_message_time && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(s.last_message_time).toLocaleTimeString()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Selected Chat conversation details */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedSessionId ? (
            <>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 'bold' }}>
                    {selectedSession.first_name ? `${selectedSession.first_name} ${selectedSession.last_name}` : `Guest Customer`}
                  </h4>
                  <small style={{ color: 'var(--text-muted)' }}>{selectedSession.email || 'Anonymous Guest Session'}</small>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedSession.status === 'admin' ? (
                    <button 
                      onClick={() => handleUpdateStatus(selectedSessionId, 'bot')}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--success)', borderColor: 'var(--success)' }}
                    >
                      Resolve & Return to Bot
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUpdateStatus(selectedSessionId, 'admin')}
                      className="btn btn-primary btn-sm"
                    >
                      Take Over Session
                    </button>
                  )}
                  <button 
                    onClick={() => handleUpdateStatus(selectedSessionId, 'closed')}
                    className="btn btn-danger btn-sm"
                  >
                    Close Session
                  </button>
                </div>
              </div>

              {/* Message list log */}
              <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--bg-primary)' }}>
                {loadingMessages ? (
                  <div className="spinner" style={{ borderTopColor: 'var(--primary)', margin: '40px auto' }}></div>
                ) : (
                  messages.map((msg, index) => {
                    const isUser = msg.sender === 'user';
                    const isBot = msg.sender === 'bot';
                    let bubbleBg = 'var(--surface)';
                    let alignSelf = 'flex-start';
                    let label = 'Customer';
                    let border = '1px solid var(--border)';

                    if (isUser) {
                      bubbleBg = 'var(--surface)';
                      alignSelf = 'flex-start';
                      label = 'Customer';
                    } else if (isBot) {
                      bubbleBg = 'var(--bg-secondary)';
                      alignSelf = 'flex-start';
                      label = 'Bot Assistant';
                    } else {
                      // admin
                      bubbleBg = 'var(--primary)';
                      alignSelf = 'flex-end';
                      label = 'Toby (You)';
                      border = 'none';
                    }

                    return (
                      <div key={index} style={{
                        alignSelf,
                        maxWidth: '75%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: alignSelf === 'flex-end' ? 'flex-end' : 'flex-start' }}>{label}</span>
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          backgroundColor: bubbleBg,
                          color: alignSelf === 'flex-end' ? 'white' : 'var(--text-primary)',
                          border,
                          fontSize: '0.85rem',
                          lineHeight: '1.4'
                        }}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendReply} style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Type a response to this customer..."
                  className="form-input"
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  style={{ flexGrow: 1, marginBottom: 0 }}
                  disabled={loading}
                />
                <button type="submit" className="btn btn-primary" disabled={loading || !replyInput.trim()} style={{ flexShrink: 0 }}>
                  Send Message
                </button>
              </form>
            </>
          ) : (
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <h3>Select a customer from the left sidebar to start chatting.</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
