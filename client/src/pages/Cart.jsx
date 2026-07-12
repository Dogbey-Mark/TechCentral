import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Trash2, ArrowRight, ShoppingBag, Percent } from 'lucide-react';

const Cart = () => {
  const { 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    formatPrice, 
    apiCall, 
    showToast,
    token,
    checkLoyaltyDiscountStatus
  } = useAppContext();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState({ orderCount: 0, hasDiscount: false });
  const navigate = useNavigate();

  React.useEffect(() => {
    if (token) {
      checkLoyaltyDiscountStatus()
        .then(setLoyaltyDiscount)
        .catch(console.error);
    }
  }, [token]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!token) {
      showToast('Please sign in to apply coupon discounts.', 'warning');
      return;
    }

    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    try {
      const data = await apiCall('/orders/coupon/apply', {
        method: 'POST',
        body: JSON.stringify({ code: couponCode.trim() })
      });
      setAppliedCoupon(data);
      showToast(`Coupon "${data.code}" applied! ${data.discount_percent}% off subtotal.`, 'success');
    } catch (err) {
      showToast(err.message, 'danger');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };


  const subtotal = cart.reduce((acc, item) => {
    const price = item.discount_price !== null ? item.discount_price : item.price;
    return acc + price * item.quantity;
  }, 0);

  const tax = subtotal * 0.05;  
  const discount = appliedCoupon ? (subtotal * appliedCoupon.discount_percent) / 100 : 0;
  const loyaltyDiscountAmount = loyaltyDiscount.hasDiscount ? (subtotal - discount) * 0.10 : 0;
  const delivery = subtotal > 1000 ? 0 : 15; 
  const total = subtotal + tax - discount - loyaltyDiscountAmount + delivery;

  const handleCheckoutClick = () => {
    if (!token) {
      showToast('Please register or sign in to complete your checkout.', 'warning');
      navigate('/login');
    } else {
      navigate('/checkout', { state: { coupon: appliedCoupon ? appliedCoupon.code : null } });
    }
  };

  if (cart.length === 0) {
    return (
      <div className="category-card" style={{ padding: '80px', margin: '40px auto', maxWidth: '600px', textAlign: 'center' }}>
        <ShoppingBag size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
        <h3 style={{ fontWeight: 'bold' }}>Your Cart is Empty</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          Explore our massive range of laptops, phones, and accessories.
        </p>
        <Link to="/shop" className="btn btn-primary" style={{ marginTop: '20px' }}>Start Shopping</Link>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 className="section-title" style={{ margin: '30px 0' }}>Shopping Cart</h1>

      {loyaltyDiscount.hasDiscount ? (
        <div style={{ backgroundColor: 'var(--success-glow)', border: '1px solid var(--success)', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          🎉 <strong>Loyalty Discount Active!</strong> Since you have placed {loyaltyDiscount.orderCount} orders, an automatic 10% discount has been applied to this cart!
        </div>
      ) : token && loyaltyDiscount.orderCount > 0 ? (
        <div style={{ backgroundColor: 'var(--primary-glow)', border: '1px solid var(--primary)', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          ℹ️ You have placed {loyaltyDiscount.orderCount} orders. Place {4 - loyaltyDiscount.orderCount} more to unlock a lifetime 10% loyalty discount!
        </div>
      ) : null}

      <div className="cart-layout">
        
        <div className="cart-items-list">
          {cart.map(item => {
            const price = item.discount_price !== null ? item.discount_price : item.price;
            return (
              <div key={item.id || item.product_id} className="cart-item-card">
                <img src={item.image_url} alt={item.name} className="cart-item-img" />
                
                <div className="cart-item-info">
                  <Link to={`/products/${item.product_id}`} style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {item.name}
                  </Link>
                  <div className="cart-item-sku">SKU: {item.sku}</div>
                  <div style={{ marginTop: '6px', fontWeight: '800', color: 'var(--primary)' }}>
                    {formatPrice(price)}
                  </div>
                </div>

                
                <div className="quantity-picker" style={{ scale: '0.85' }}>
                  <button 
                    onClick={() => updateCartQuantity(item.id, item.product_id, item.quantity - 1)}
                    className="quantity-btn"
                  >
                    -
                  </button>
                  <div className="quantity-val">{item.quantity}</div>
                  <button 
                    onClick={() => updateCartQuantity(item.id, item.product_id, item.quantity + 1)}
                    className="quantity-btn"
                  >
                    +
                  </button>
                </div>

                
                <div style={{ fontWeight: '800', fontSize: '1.1rem', minWidth: '100px', textAlign: 'right' }}>
                  {formatPrice(price * item.quantity)}
                </div>

                
                <button 
                  onClick={() => removeFromCart(item.id, item.product_id)} 
                  className="btn btn-danger btn-icon btn-sm"
                  title="Remove from Cart"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>

        
        <aside className="cart-summary-card">
          <h3 style={{ fontWeight: 'bold', marginBottom: '20px' }}>Order Summary</h3>
          
          <div className="summary-row">
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
            <span style={{ fontWeight: 'bold' }}>{formatPrice(subtotal)}</span>
          </div>

          <div className="summary-row">
            <span style={{ color: 'var(--text-secondary)' }}>Sales Tax (5% VAT)</span>
            <span style={{ fontWeight: 'bold' }}>{formatPrice(tax)}</span>
          </div>

          <div className="summary-row">
            <span style={{ color: 'var(--text-secondary)' }}>Delivery Fee</span>
            <span style={{ fontWeight: 'bold' }}>
              {delivery === 0 ? 'FREE' : formatPrice(delivery)}
            </span>
          </div>

          {appliedCoupon && (
            <div className="summary-row" style={{ color: 'var(--success)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Percent size={14} /> Discount ({appliedCoupon.discount_percent}%)
              </span>
              <span style={{ fontWeight: 'bold' }}>-{formatPrice(discount)}</span>
            </div>
          )}

          {loyaltyDiscount.hasDiscount && (
            <div className="summary-row" style={{ color: 'var(--success)', fontWeight: 'bold' }}>
              <span>Automatic 10% Loyalty Discount</span>
              <span>-{formatPrice(loyaltyDiscountAmount)}</span>
            </div>
          )}

          
          <form onSubmit={handleApplyCoupon} className="coupon-box">
            <input 
              type="text" 
              className="form-input" 
              placeholder="Promo code (e.g. TECH20)" 
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            />
            <button 
              type="submit" 
              className="btn btn-secondary btn-sm" 
              style={{ padding: '8px 16px' }}
              disabled={validatingCoupon}
            >
              Apply
            </button>
          </form>

          
          <div className="summary-row summary-total">
            <span>Grand Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          <button 
            onClick={handleCheckoutClick} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', marginTop: '20px' }}
          >
            Proceed to Checkout <ArrowRight size={18} />
          </button>

          <Link to="/shop" style={{ display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '0.875rem', color: 'var(--primary)' }}>
            Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
