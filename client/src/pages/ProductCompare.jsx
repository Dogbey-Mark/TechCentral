import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ShoppingCart, Star, Trash2 } from 'lucide-react';

const ProductCompare = () => {
  const { apiCall, formatPrice, addToCart } = useAppContext();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const productIds = searchParams.get('ids') ? searchParams.get('ids').split(',') : [];

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Fetch all products details in parallel
    const promises = productIds.map(id => apiCall(`/products/${id}`));
    Promise.all(promises)
      .then(results => {
        setProducts(results);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load comparison products:', err);
        setLoading(false);
      });
  }, [searchParams]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <div className="spinner" style={{ borderTopColor: 'var(--primary)', width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="category-card" style={{ padding: '80px', margin: '40px auto', maxWidth: '600px', textAlign: 'center' }}>
        <h3 style={{ fontWeight: 'bold' }}>No Products Selected</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>
          Select products from the shop page to compare specifications side-by-side.
        </p>
        <Link to="/shop" className="btn btn-primary" style={{ marginTop: '20px' }}>Go to Shop</Link>
      </div>
    );
  }

  // 1. Gather all unique specification keys across all products
  const specKeys = new Set();
  products.forEach(p => {
    try {
      const specs = p.specifications ? JSON.parse(p.specifications) : {};
      Object.keys(specs).forEach(key => specKeys.add(key));
    } catch (e) {
      console.error(e);
    }
  });
  const allSpecKeys = Array.from(specKeys);

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ padding: '20px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <Link to="/">Home</Link> &gt; <Link to="/shop">Shop</Link> &gt; <span style={{ color: 'var(--text-primary)' }}>Compare Gadgets</span>
      </div>

      <h1 className="section-title" style={{ marginBottom: '30px' }}>Compare Products</h1>

      <div className="comparison-container">
        <table className="comparison-table">
          <thead>
            <tr className="comparison-header">
              <th style={{ width: '20%' }}>Specs / Features</th>
              {products.map(prod => (
                <th key={prod.id} style={{ width: `${80 / products.length}%` }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                    <img 
                      src={prod.image_url} 
                      alt={prod.name} 
                      style={{ width: '100px', height: '100px', objectFit: 'contain', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }} 
                    />
                    <Link to={`/products/${prod.id}`} style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {prod.name}
                    </Link>
                    <span className="product-card-brand">{prod.brand_name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Price Row */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>Price</td>
              {products.map(prod => (
                <td key={prod.id} style={{ textAlign: 'center', fontWeight: '800', fontSize: '1.2rem', color: 'var(--primary)' }}>
                  {prod.discount_price !== null ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ color: 'var(--danger)' }}>{formatPrice(prod.discount_price)}</span>
                      <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatPrice(prod.price)}</span>
                    </div>
                  ) : (
                    formatPrice(prod.price)
                  )}
                </td>
              ))}
            </tr>

            {/* Rating Row */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>Rating</td>
              {products.map(prod => (
                <td key={prod.id} style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', color: 'var(--warning)', gap: '4px', alignItems: 'center' }}>
                    <Star size={16} fill="currentColor" />
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {(prod.avg_rating || 5.0).toFixed(1)}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      ({prod.reviews_count || 0})
                    </span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Stock Row */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>Availability</td>
              {products.map(prod => (
                <td key={prod.id} style={{ textAlign: 'center' }}>
                  <span className={`status-tag ${prod.stock > 0 ? 'tag-success' : 'tag-danger'}`}>
                    {prod.stock > 0 ? `In Stock (${prod.stock})` : 'Out of Stock'}
                  </span>
                </td>
              ))}
            </tr>

            {/* Warranty Row */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>Warranty</td>
              {products.map(prod => (
                <td key={prod.id} style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {prod.warranty || 'No Warranty info'}
                </td>
              ))}
            </tr>

            {/* Dynamic Specification Rows */}
            {allSpecKeys.map(key => (
              <tr key={key}>
                <td style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{key}</td>
                {products.map(prod => {
                  let val = '-';
                  try {
                    const specs = prod.specifications ? JSON.parse(prod.specifications) : {};
                    val = specs[key] || '-';
                  } catch (e) {
                    val = '-';
                  }
                  return (
                    <td key={prod.id} style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Actions Row */}
            <tr>
              <td></td>
              {products.map(prod => (
                <td key={prod.id}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                    {prod.stock > 0 ? (
                      <button 
                        onClick={() => addToCart(prod, 1)} 
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', maxWidth: '160px' }}
                      >
                        <ShoppingCart size={14} /> Add to Cart
                      </button>
                    ) : (
                      <button className="btn btn-secondary btn-sm" disabled style={{ width: '100%', maxWidth: '160px' }}>
                        Out of Stock
                      </button>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductCompare;
