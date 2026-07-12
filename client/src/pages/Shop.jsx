import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Star, ShoppingCart, SlidersHorizontal, RefreshCw, X } from 'lucide-react';

const Shop = () => {
  const { apiCall, formatPrice, addToCart, showToast } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Compare products state (IDs of products to compare, limit to 3)
  const [compareList, setCompareList] = useState([]);

  // Filter States (initialize from URL search parameters)
  const categoryFilter = searchParams.get('category') || '';
  const brandFilter = searchParams.get('brand') || '';
  const sortFilter = searchParams.get('sort') || '';
  const searchFilter = searchParams.get('search') || '';
  
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [rating, setRating] = useState(searchParams.get('rating') || '');
  const [availability, setAvailability] = useState(searchParams.get('availability') || '');
  
  // Specific spec filters
  const [ram, setRam] = useState(searchParams.get('ram') || '');
  const [storage, setStorage] = useState(searchParams.get('storage') || '');
  const [processor, setProcessor] = useState(searchParams.get('processor') || '');

  // Load filters list
  useEffect(() => {
    apiCall('/products/categories').then(setCategories).catch(console.error);
    apiCall('/products/brands').then(setBrands).catch(console.error);
  }, []);

  // Fetch products when params change
  useEffect(() => {
    setLoading(true);
    const queryParams = new URLSearchParams();
    
    if (searchFilter) queryParams.append('search', searchFilter);
    if (categoryFilter) queryParams.append('category', categoryFilter);
    if (brandFilter) queryParams.append('brand', brandFilter);
    if (sortFilter) queryParams.append('sort', sortFilter);
    if (minPrice) queryParams.append('minPrice', minPrice);
    if (maxPrice) queryParams.append('maxPrice', maxPrice);
    if (rating) queryParams.append('rating', rating);
    if (availability) queryParams.append('availability', availability);
    if (ram) queryParams.append('ram', ram);
    if (storage) queryParams.append('storage', storage);
    if (processor) queryParams.append('processor', processor);

    apiCall(`/products?${queryParams.toString()}`)
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [searchParams]);

  const updateSearchParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    setSearchParams(nextParams);
  };

  const handleApplyPriceAndFilters = (e) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    
    if (minPrice) nextParams.set('minPrice', minPrice); else nextParams.delete('minPrice');
    if (maxPrice) nextParams.set('maxPrice', maxPrice); else nextParams.delete('maxPrice');
    if (rating) nextParams.set('rating', rating); else nextParams.delete('rating');
    if (availability) nextParams.set('availability', availability); else nextParams.delete('availability');
    
    if (ram) nextParams.set('ram', ram); else nextParams.delete('ram');
    if (storage) nextParams.set('storage', storage); else nextParams.delete('storage');
    if (processor) nextParams.set('processor', processor); else nextParams.delete('processor');

    setSearchParams(nextParams);
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setRating('');
    setAvailability('');
    setRam('');
    setStorage('');
    setProcessor('');
    setSearchParams(new URLSearchParams());
  };

  const handleToggleCompare = (product) => {
    setCompareList(prev => {
      const isAlreadyIn = prev.some(item => item.id === product.id);
      if (isAlreadyIn) {
        return prev.filter(item => item.id !== product.id);
      }
      
      if (prev.length >= 3) {
        showToast('You can compare a maximum of 3 products at a time.', 'warning');
        return prev;
      }
      
      showToast(`${product.name} added to comparison list.`, 'success');
      return [...prev, product];
    });
  };

  return (
    <div className="shop-layout">
      {/* Sidebar Filter Menu */}
      <aside className="sidebar-filters">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={18} /> Filters
          </h3>
          <button onClick={clearFilters} style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={12} /> Reset
          </button>
        </div>

        <form onSubmit={handleApplyPriceAndFilters}>
          {/* Category Filter */}
          <div className="filter-section">
            <h4 className="filter-title">Category</h4>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="radio" 
                  name="category" 
                  checked={categoryFilter === ''} 
                  onChange={() => updateSearchParam('category', '')}
                  className="checkbox-input"
                />
                All Categories
              </label>
              {categories.map(cat => (
                <label key={cat.id} className="checkbox-label">
                  <input 
                    type="radio" 
                    name="category" 
                    checked={categoryFilter === cat.slug} 
                    onChange={() => updateSearchParam('category', cat.slug)}
                    className="checkbox-input"
                  />
                  {cat.name}
                </label>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="filter-section">
            <h4 className="filter-title">Brand</h4>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="radio" 
                  name="brand" 
                  checked={brandFilter === ''} 
                  onChange={() => updateSearchParam('brand', '')}
                  className="checkbox-input"
                />
                All Brands
              </label>
              {brands.map(b => (
                <label key={b.id} className="checkbox-label">
                  <input 
                    type="radio" 
                    name="brand" 
                    checked={brandFilter === b.slug} 
                    onChange={() => updateSearchParam('brand', b.slug)}
                    className="checkbox-input"
                  />
                  {b.name}
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="filter-section">
            <h4 className="filter-title">Price Range</h4>
            <div className="price-range-inputs">
              <input 
                type="number" 
                placeholder="Min" 
                value={minPrice} 
                onChange={(e) => setMinPrice(e.target.value)} 
                className="price-range-input" 
              />
              <span style={{ color: 'var(--text-muted)' }}>-</span>
              <input 
                type="number" 
                placeholder="Max" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(e.target.value)} 
                className="price-range-input" 
              />
            </div>
          </div>

          {/* Specification Filters */}
          <div className="filter-section">
            <h4 className="filter-title">Hardware Specs</h4>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <span className="form-label">RAM Memory</span>
              <select className="form-input" style={{ padding: '8px' }} value={ram} onChange={(e) => setRam(e.target.value)}>
                <option value="">Any RAM</option>
                <option value="8GB">8GB</option>
                <option value="12GB">12GB</option>
                <option value="16GB">16GB</option>
                <option value="32GB">32GB</option>
                <option value="36GB">36GB</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <span className="form-label">Storage Capacity</span>
              <select className="form-input" style={{ padding: '8px' }} value={storage} onChange={(e) => setStorage(e.target.value)}>
                <option value="">Any Storage</option>
                <option value="128GB">128GB</option>
                <option value="256GB">256GB</option>
                <option value="512GB">512GB</option>
                <option value="1TB">1TB</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <span className="form-label">Processor</span>
              <select className="form-input" style={{ padding: '8px' }} value={processor} onChange={(e) => setProcessor(e.target.value)}>
                <option value="">Any Processor</option>
                <option value="Intel Core i9">Intel Core i9</option>
                <option value="Intel Core i7">Intel Core i7</option>
                <option value="Intel Core Ultra">Intel Core Ultra</option>
                <option value="Apple M3">Apple M3</option>
                <option value="Snapdragon">Snapdragon</option>
              </select>
            </div>
          </div>

          {/* Stock Availability */}
          <div className="filter-section">
            <h4 className="filter-title">Availability</h4>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="radio" 
                  name="availability" 
                  checked={availability === ''} 
                  onChange={() => setAvailability('')}
                  className="checkbox-input"
                />
                All Items
              </label>
              <label className="checkbox-label">
                <input 
                  type="radio" 
                  name="availability" 
                  checked={availability === 'in_stock'} 
                  onChange={() => setAvailability('in_stock')}
                  className="checkbox-input"
                />
                In Stock Only
              </label>
            </div>
          </div>

          {/* Rating filter */}
          <div className="filter-section">
            <h4 className="filter-title">Rating</h4>
            <div className="checkbox-group">
              {[5, 4, 3].map(stars => (
                <label key={stars} className="checkbox-label">
                  <input 
                    type="radio" 
                    name="rating" 
                    checked={rating === stars.toString()} 
                    onChange={() => setRating(stars.toString())}
                    className="checkbox-input"
                  />
                  {stars} Stars & above
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
            Apply Filters
          </button>
        </form>
      </aside>

      {/* Main Shop Contents */}
      <main>
        {/* Controls and Search Summary */}
        <div className="shop-controls">
          <div>
            <h2 style={{ fontWeight: '800' }}>
              {searchFilter ? `Results for "${searchFilter}"` : 'Browse Catalog'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              We found {products.length} products matches
            </p>
          </div>

          <div>
            <select 
              className="form-input" 
              style={{ width: '200px', padding: '10px' }}
              value={sortFilter}
              onChange={(e) => updateSearchParam('sort', e.target.value)}
            >
              <option value="">Sort: Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest Arrival</option>
              <option value="best_selling">Best Sellers</option>
              <option value="rating_desc">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <div className="spinner" style={{ borderTopColor: 'var(--primary)', width: '40px', height: '40px' }}></div>
          </div>
        ) : products.length === 0 ? (
          <div className="category-card" style={{ padding: '80px', textAlign: 'center' }}>
            <SlidersHorizontal size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3 style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>No Products Found</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
              Try loosening your filter boundaries or query search phrase.
            </p>
            <button onClick={clearFilters} className="btn btn-secondary" style={{ marginTop: '20px' }}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {products.map(prod => {
              const isCompareChecked = compareList.some(item => item.id === prod.id);
              return (
                <div key={prod.id} className="product-card">
                  {prod.featured === 1 && <span className="badge-featured">Featured</span>}
                  
                  {/* Image container */}
                  <div className="product-card-img-wrapper">
                    <img src={prod.image_url} alt={prod.name} className="product-card-img" />
                  </div>

                  {/* Body content */}
                  <div className="product-card-body">
                    <span className="product-card-brand">{prod.brand_name}</span>
                    <Link to={`/products/${prod.id}`} className="product-card-title">
                      {prod.name}
                    </Link>
                    <div className="product-card-rating">
                      <Star size={14} fill="currentColor" />
                      <span>{(prod.avg_rating || 5.0).toFixed(1)} ({prod.reviews_count || 1})</span>
                    </div>

                    {/* Compare Checkbox Trigger */}
                    <div style={{ marginBottom: '16px' }}>
                      <label className="checkbox-label" style={{ fontSize: '0.8rem' }}>
                        <input 
                          type="checkbox" 
                          checked={isCompareChecked} 
                          onChange={() => handleToggleCompare(prod)}
                          className="checkbox-input"
                        />
                        Add to Compare
                      </label>
                    </div>

                    <div className="product-card-price-row">
                      <div className="price-container">
                        {prod.discount_price !== null && (
                          <span className="original-price">{formatPrice(prod.price)}</span>
                        )}
                        <span className="price">
                          {formatPrice(prod.discount_price !== null ? prod.discount_price : prod.price)}
                        </span>
                      </div>
                      <button 
                        onClick={() => addToCart(prod, 1)} 
                        className="btn btn-primary btn-icon"
                        title="Add to Cart"
                      >
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Compare Drawer */}
      {compareList.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--surface)',
          border: '2px solid var(--primary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '16px 24px',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          width: '90%',
          maxWidth: '650px',
          justifyContent: 'space-between',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Compare ({compareList.length}/3):</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {compareList.map(item => (
                <div key={item.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  backgroundColor: 'var(--bg-secondary)', 
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem'
                }}>
                  <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </span>
                  <button onClick={() => setCompareList(prev => prev.filter(x => x.id !== item.id))} style={{ opacity: 0.7 }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setCompareList([])} className="btn btn-secondary btn-sm">Clear</button>
            <Link 
              to={`/compare?ids=${compareList.map(x => x.id).join(',')}`} 
              className="btn btn-primary btn-sm"
            >
              Compare Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
