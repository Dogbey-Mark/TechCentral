import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Star, ShoppingCart, Heart, Shield, Award, Sparkles, MessageSquare } from 'lucide-react';

const isVideo = (url) => {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|avi)($|\?)/i.test(url);
};

const ProductDetails = () => {
  const { id } = useParams();
  const { apiCall, formatPrice, addToCart, addToWishlist, token, user, showToast } = useAppContext();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMediaUrl, setActiveMediaUrl] = useState('');
  const [qty, setQty] = useState(1);

  // Review submission state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchProductDetails = () => {
    setLoading(true);
    apiCall(`/products/${id}`)
      .then(data => {
        setProduct(data);
        setActiveMediaUrl(data.image_url);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load product details:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProductDetails();
    setQty(1);
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      showToast('Please log in to leave a review.', 'warning');
      return;
    }

    setSubmittingReview(true);
    try {
      await apiCall(`/products/${id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment })
      });
      showToast('Review submitted successfully!', 'success');
      setComment('');
      fetchProductDetails(); // reload review list
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <div className="spinner" style={{ borderTopColor: 'var(--primary)', width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="category-card" style={{ padding: '80px', margin: '40px auto', maxWidth: '600px', textAlign: 'center' }}>
        <h3 style={{ fontWeight: 'bold' }}>Product Not Found</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>This item may have been removed or is temporarily unavailable.</p>
        <Link to="/shop" className="btn btn-primary" style={{ marginTop: '20px' }}>Return to Shop</Link>
      </div>
    );
  }

  // Parse product specs
  let specsObj = {};
  try {
    specsObj = product.specifications ? JSON.parse(product.specifications) : {};
  } catch (e) {
    specsObj = {};
  }

  // Compile full media list for the details gallery
  const mediaList = [
    ...(product.image_url && (!product.images || !product.images.includes(product.image_url)) 
      ? [{ url: product.image_url, type: 'image' }] 
      : []),
    ...(product.images ? product.images.map(img => ({ url: img, type: 'image' })) : []),
    ...(product.videos ? product.videos.map(vid => ({ url: vid, type: 'video' })) : [])
  ];

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Breadcrumbs */}
      <div style={{ padding: '20px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <Link to="/">Home</Link> &gt; <Link to="/shop">Shop</Link> &gt; <Link to={`/shop?category=${product.category_id}`}>{product.category_name}</Link> &gt; <span style={{ color: 'var(--text-primary)' }}>{product.name}</span>
      </div>

      <div className="details-grid">
        {/* Left Side Gallery */}
        <div className="gallery-container">
          <div className="main-image-wrapper">
            {isVideo(activeMediaUrl) ? (
              <video 
                src={activeMediaUrl} 
                controls 
                autoPlay 
                muted 
                className="main-image"
                style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '450px', borderRadius: 'var(--radius-md)' }} 
              />
            ) : (
              <img src={activeMediaUrl} alt={product.name} className="main-image" />
            )}
          </div>
          <div className="thumbnail-row">
            {mediaList.map((item, i) => (
              <div 
                key={i} 
                onClick={() => setActiveMediaUrl(item.url)}
                className={`thumbnail-card ${activeMediaUrl === item.url ? 'active' : ''}`}
                style={{ position: 'relative' }}
              >
                {item.type === 'video' ? (
                  <>
                    <video src={item.url} className="thumbnail-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.4)',
                      color: 'white',
                      borderRadius: '4px'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </>
                ) : (
                  <img src={item.url} alt="Thumbnail preview" className="thumbnail-img" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side Info */}
        <div className="details-info">
          <span className="details-brand">{product.brand_name}</span>
          <h1 className="details-title">{product.name}</h1>

          {/* Rating */}
          <div className="details-rating-row">
            <div style={{ display: 'flex', color: 'var(--warning)', gap: '4px', alignItems: 'center' }}>
              <Star size={16} fill="currentColor" />
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginLeft: '4px' }}>
                {(product.avg_rating || 5.0).toFixed(1)}
              </span>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              ({product.reviews_count || 0} customer reviews)
            </span>
            <span className={`status-tag ${product.stock > 0 ? 'tag-success' : 'tag-danger'}`}>
              {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
            </span>
          </div>

          {/* Pricing */}
          <div className="details-price-row">
            {product.discount_price !== null ? (
              <>
                <span className="details-price" style={{ color: 'var(--danger)' }}>
                  {formatPrice(product.discount_price)}
                </span>
                <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="details-price">{formatPrice(product.price)}</span>
            )}
          </div>

          <p className="details-description">{product.description}</p>

          {/* Action Row */}
          {product.stock > 0 ? (
            <div className="details-actions-row">
              <div className="quantity-picker">
                <button 
                  onClick={() => setQty(prev => Math.max(1, prev - 1))}
                  className="quantity-btn"
                >
                  -
                </button>
                <div className="quantity-val">{qty}</div>
                <button 
                  onClick={() => setQty(prev => Math.min(product.stock, prev + 1))}
                  className="quantity-btn"
                >
                  +
                </button>
              </div>

              <button 
                onClick={() => addToCart(product, qty)} 
                className="btn btn-primary"
                style={{ flexGrow: 1 }}
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>

              <button 
                onClick={() => addToWishlist(product)} 
                className="btn btn-secondary btn-icon"
                title="Add to Wishlist"
              >
                <Heart size={18} />
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: '30px', padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--danger)', fontWeight: 'bold' }}>
              Currently Out of Stock. Let support know to request restock!
            </div>
          )}

          {/* Extra Specs Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Shield size={20} style={{ color: 'var(--primary)' }} />
              <div>
                <h5 style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Warranty Covered</h5>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{product.warranty || 'Official Warranty'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Award size={20} style={{ color: 'var(--success)' }} />
              <div>
                <h5 style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Genuine Quality</h5>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>100% Original Products</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <b>SKU:</b> {product.sku}<br />
            <b>Category:</b> {product.category_name}
          </div>
        </div>
      </div>

      {/* Specifications Block */}
      {Object.keys(specsObj).length > 0 && (
        <section style={{ marginTop: '40px' }}>
          <h3 className="section-title" style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
            Technical Specifications
          </h3>
          <div className="table-container">
            <table className="spec-table">
              <tbody>
                {Object.entries(specsObj).map(([key, value]) => (
                  <tr key={key}>
                    <td className="spec-label">{key}</td>
                    <td className="spec-value">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Review Section */}
      <section style={{ marginTop: '50px' }}>
        <h3 className="section-title" style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '30px' }}>
          Reviews & Feedback ({product.reviews ? product.reviews.length : 0})
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px', alignItems: 'start' }}>
          {/* Reviews list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!product.reviews || product.reviews.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                There are no reviews for this product yet. Be the first to share your experience!
              </p>
            ) : (
              product.reviews.map(rev => (
                <div key={rev.id} style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>{rev.first_name} {rev.last_name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', color: 'var(--warning)', gap: '2px', marginBottom: '10px' }}>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star 
                        key={idx} 
                        size={14} 
                        fill={idx < rev.rating ? 'currentColor' : 'none'} 
                        stroke="currentColor" 
                      />
                    ))}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>{rev.comment}</p>
                </div>
              ))
            )}
          </div>

          {/* Review write box */}
          <div style={{ padding: '24px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface)' }}>
            <h4 style={{ fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} /> Write a Review
            </h4>

            {token ? (
              <form onSubmit={handleReviewSubmit}>
                <div className="form-group">
                  <span className="form-label">Product Rating</span>
                  <div style={{ display: 'flex', gap: '8px', color: 'var(--warning)', cursor: 'pointer' }}>
                    {[1, 2, 3, 4, 5].map(val => (
                      <Star 
                        key={val} 
                        size={24} 
                        fill={val <= rating ? 'currentColor' : 'none'} 
                        onClick={() => setRating(val)}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <span className="form-label">Review Comment</span>
                  <textarea 
                    rows="4" 
                    className="form-input" 
                    placeholder="Describe your experience with this gadget..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                  You must be registered and logged in to review products.
                </p>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Sign In to Review
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products Slider */}
      {product.related && product.related.length > 0 && (
        <section style={{ marginTop: '60px' }}>
          <h3 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '24px' }}>
            Customers Also Viewed
          </h3>
          <div className="product-grid">
            {product.related.map(prod => (
              <div key={prod.id} className="product-card">
                <div className="product-card-img-wrapper">
                  <img src={prod.image_url} alt={prod.name} className="product-card-img" />
                </div>
                <div className="product-card-body">
                  <Link to={`/products/${prod.id}`} className="product-card-title">
                    {prod.name}
                  </Link>
                  <div className="product-card-rating">
                    <Star size={14} fill="currentColor" />
                    <span>{(prod.avg_rating || 5.0).toFixed(1)}</span>
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
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetails;
