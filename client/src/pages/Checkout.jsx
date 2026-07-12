import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { MapPin, Phone, Truck, CreditCard, ShoppingBag, Plus } from 'lucide-react';

const Checkout = () => {
  const { cart, formatPrice, apiCall, showToast, checkLoyaltyDiscountStatus } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  
  const couponCode = location.state?.coupon || null;

  // Checkout Fields
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('standard'); // standard, express
  const [paymentOption, setPaymentOption] = useState('mtn_momo'); // mtn_momo, telecel_cash, card, paypal
  const [loading, setLoading] = useState(true);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState({ orderCount: 0, hasDiscount: false });

  // Verification states
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [sendingSms, setSendingSms] = useState(false);
  const [verifyingSms, setVerifyingSms] = useState(false);
  const [smsError, setSmsError] = useState('');

  // Address creation toggle
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [title, setTitle] = useState('Home');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');

  const loadAddresses = () => {
    setLoading(true);
    apiCall('/auth/addresses')
      .then(data => {
        setAddresses(data);
        if (data.length > 0) {
          const def = data.find(x => x.is_default === 1);
          setSelectedAddressId(def ? def.id : data[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        showToast(err.message, 'danger');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAddresses();
    checkLoyaltyDiscountStatus()
      .then(setLoyaltyDiscount)
      .catch(console.error);
  }, []);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/auth/addresses', {
        method: 'POST',
        body: JSON.stringify({
          title,
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          street_address: streetAddress,
          city,
          region,
          is_default: 0
        })
      });
      showToast('Address added!', 'success');
      setShowAddressForm(false);
      loadAddresses();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => {
    const price = item.discount_price !== null ? item.discount_price : item.price;
    return acc + price * item.quantity;
  }, 0);

  const tax = subtotal * 0.05;
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(0);

  useEffect(() => {
    if (couponCode) {
      apiCall('/orders/coupon/apply', {
        method: 'POST',
        body: JSON.stringify({ code: couponCode })
      })
        .then(data => setCouponDiscountPercent(data.discount_percent))
        .catch(console.error);
    }
  }, [couponCode]);

  const discount = (subtotal * couponDiscountPercent) / 100;
  const loyaltyDiscountAmount = loyaltyDiscount.hasDiscount ? (subtotal - discount) * 0.10 : 0;
  const shippingFee = deliveryOption === 'express' ? 30.00 : 15.00;
  const total = subtotal + tax - discount - loyaltyDiscountAmount + shippingFee;

  const handleSendSmsToken = async () => {
    setSendingSms(true);
    setSmsError('');
    try {
      await apiCall('/auth/send-sms-token', {
        method: 'POST',
        body: JSON.stringify({ phone: contactNumber })
      });
      setSmsSent(true);
      setShowVerificationModal(true);
      showToast('SMS verification code sent!', 'success');
    } catch (err) {
      setSmsError(err.message || 'Failed to send verification SMS.');
      setShowVerificationModal(true);
      showToast(err.message || 'Failed to send SMS token.', 'danger');
    } finally {
      setSendingSms(false);
    }
  };

  const handleVerifySmsToken = async (e) => {
    e.preventDefault();
    if (!smsCode.trim() || smsCode.length < 6) {
      setSmsError('Please enter the full 6-digit code.');
      return;
    }

    setVerifyingSms(true);
    setSmsError('');
    try {
      await apiCall('/auth/verify-sms-token', {
        method: 'POST',
        body: JSON.stringify({ phone: contactNumber, token: smsCode })
      });

      showToast('Phone number verified successfully!', 'success');
      setShowVerificationModal(false);

      const address = addresses.find(x => x.id === parseInt(selectedAddressId));
      const fullAddress = `${address.recipient_name}, ${address.street_address}, ${address.city}, ${address.region || ''} (Phone: ${address.recipient_phone})`;

      // Navigate to visual simulation portal
      navigate('/payment-gateway', {
        state: {
          shipping_address: fullAddress,
          contact_number: contactNumber,
          delivery_option: deliveryOption,
          payment_method: paymentOption,
          coupon_code: couponCode,
          total: total
        }
      });
    } catch (err) {
      setSmsError(err.message || 'Invalid or expired code.');
      showToast(err.message || 'Verification failed.', 'danger');
    } finally {
      setVerifyingSms(false);
    }
  };

  const handlePlaceOrder = () => {
    const address = addresses.find(x => x.id === parseInt(selectedAddressId));
    if (!address) {
      showToast('Please select or add a delivery address.', 'warning');
      return;
    }
    if (!contactNumber.trim()) {
      showToast('Please provide a contact phone number.', 'warning');
      return;
    }

    // Trigger SMS verification code sending
    handleSendSmsToken();
  };

  if (cart.length === 0) {
    return <div style={{ padding: '60px', textAlign: 'center' }}>No items in cart.</div>;
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 className="section-title" style={{ margin: '30px 0' }}>Secure Checkout</h1>

      <div className="cart-layout">
        {/* Left Side: Delivery details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Address select */}
          <div style={{ padding: '30px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--surface)' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={20} style={{ color: 'var(--primary)' }} /> Select Delivery Address
            </h3>

            {loading ? (
              <div className="spinner" style={{ borderTopColor: 'var(--primary)' }}></div>
            ) : addresses.length === 0 ? (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>You have no saved addresses. Add one below to proceed.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {addresses.map(addr => (
                  <label key={addr.id} className="checkbox-label" style={{ 
                    border: '1px solid var(--border)', 
                    padding: '16px', 
                    borderRadius: '12px', 
                    backgroundColor: selectedAddressId === addr.id ? 'var(--primary-glow)' : 'transparent',
                    borderColor: selectedAddressId === addr.id ? 'var(--primary)' : 'var(--border)',
                    alignItems: 'flex-start'
                  }}>
                    <input 
                      type="radio" 
                      name="selected_address" 
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="checkbox-input"
                      style={{ marginTop: '4px' }}
                    />
                    <div>
                      <span style={{ fontWeight: 'bold' }}>{addr.title}</span> - {addr.recipient_name}<br />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {addr.street_address}, {addr.city}{addr.region ? `, ${addr.region}` : ''} | Phone: {addr.recipient_phone}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Quick Address form */}
            {!showAddressForm ? (
              <button onClick={() => setShowAddressForm(true)} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={14} /> Add New Address
              </button>
            ) : (
              <form onSubmit={handleCreateAddress} style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '20px' }}>
                <h4 style={{ fontWeight: 'bold', marginBottom: '16px' }}>Quick Add Address</h4>
                <div className="form-row">
                  <div className="form-group">
                    <span className="form-label">Title</span>
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
                    <input type="text" className="form-input" required value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <span className="form-label">City</span>
                    <input type="text" className="form-input" required value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <span className="form-label">Region</span>
                    <input type="text" className="form-input" value={region} onChange={(e) => setRegion(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary btn-sm">Add Address</button>
                  <button type="button" onClick={() => setShowAddressForm(false)} className="btn btn-secondary btn-sm">Cancel</button>
                </div>
              </form>
            )}
          </div>

          {/* Contact and Shipping */}
          <div style={{ padding: '30px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--surface)' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={20} style={{ color: 'var(--success)' }} /> Delivery Details
            </h3>
            
            <div className="form-group">
              <span className="form-label">Recipient Contact Phone Number (for dispatch call)</span>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="e.g. +233 24 123 4567" 
                value={contactNumber} 
                onChange={(e) => setContactNumber(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <span className="form-label">Delivery Options</span>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label className="checkbox-label" style={{ 
                  flexGrow: 1, 
                  border: '1px solid var(--border)', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  borderColor: deliveryOption === 'standard' ? 'var(--primary)' : 'var(--border)',
                  backgroundColor: deliveryOption === 'standard' ? 'var(--primary-glow)' : 'transparent',
                }}>
                  <input type="radio" name="delivery_opt" value="standard" checked={deliveryOption === 'standard'} onChange={() => setDeliveryOption('standard')} className="checkbox-input" />
                  <div>
                    <span style={{ fontWeight: 'bold' }}>Standard Delivery</span><br />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Takes 2-5 days | ₵15.00 / $15.00</span>
                  </div>
                </label>
                <label className="checkbox-label" style={{ 
                  flexGrow: 1, 
                  border: '1px solid var(--border)', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  borderColor: deliveryOption === 'express' ? 'var(--primary)' : 'var(--border)',
                  backgroundColor: deliveryOption === 'express' ? 'var(--primary-glow)' : 'transparent',
                }}>
                  <input type="radio" name="delivery_opt" value="express" checked={deliveryOption === 'express'} onChange={() => setDeliveryOption('express')} className="checkbox-input" />
                  <div>
                    <span style={{ fontWeight: 'bold' }}>Express Delivery</span><br />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Takes 24 hours | ₵30.00 / $30.00</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Payment method selector */}
          <div style={{ padding: '30px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--surface)' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={20} style={{ color: 'var(--warning)' }} /> Payment Options
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <label className="checkbox-label" style={{ 
                border: '1px solid var(--border)', 
                padding: '16px', 
                borderRadius: '12px',
                borderColor: paymentOption === 'mtn_momo' ? 'var(--primary)' : 'var(--border)',
                backgroundColor: paymentOption === 'mtn_momo' ? 'var(--primary-glow)' : 'transparent'
              }}>
                <input type="radio" name="payment_opt" value="mtn_momo" checked={paymentOption === 'mtn_momo'} onChange={() => setPaymentOption('mtn_momo')} className="checkbox-input" />
                <div>
                  <span style={{ fontWeight: 'bold' }}>MTN Mobile Money</span><br />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ghana local MoMo</span>
                </div>
              </label>

              <label className="checkbox-label" style={{ 
                border: '1px solid var(--border)', 
                padding: '16px', 
                borderRadius: '12px',
                borderColor: paymentOption === 'telecel_cash' ? 'var(--primary)' : 'var(--border)',
                backgroundColor: paymentOption === 'telecel_cash' ? 'var(--primary-glow)' : 'transparent'
              }}>
                <input type="radio" name="payment_opt" value="telecel_cash" checked={paymentOption === 'telecel_cash'} onChange={() => setPaymentOption('telecel_cash')} className="checkbox-input" />
                <div>
                  <span style={{ fontWeight: 'bold' }}>Telecel Cash</span><br />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ghana local MoMo</span>
                </div>
              </label>

              <label className="checkbox-label" style={{ 
                border: '1px solid var(--border)', 
                padding: '16px', 
                borderRadius: '12px',
                borderColor: paymentOption === 'card' ? 'var(--primary)' : 'var(--border)',
                backgroundColor: paymentOption === 'card' ? 'var(--primary-glow)' : 'transparent'
              }}>
                <input type="radio" name="payment_opt" value="card" checked={paymentOption === 'card'} onChange={() => setPaymentOption('card')} className="checkbox-input" />
                <div>
                  <span style={{ fontWeight: 'bold' }}>Credit Card (Stripe)</span><br />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>International Visa/Mastercard</span>
                </div>
              </label>

              <label className="checkbox-label" style={{ 
                border: '1px solid var(--border)', 
                padding: '16px', 
                borderRadius: '12px',
                borderColor: paymentOption === 'paypal' ? 'var(--primary)' : 'var(--border)',
                backgroundColor: paymentOption === 'paypal' ? 'var(--primary-glow)' : 'transparent'
              }}>
                <input type="radio" name="payment_opt" value="paypal" checked={paymentOption === 'paypal'} onChange={() => setPaymentOption('paypal')} className="checkbox-input" />
                <div>
                  <span style={{ fontWeight: 'bold' }}>PayPal Express</span><br />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>International transfer</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Side: Order summary review */}
        <aside className="cart-summary-card">
          <h3 style={{ fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={18} /> Order Recap
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
            {cart.map(item => {
              const price = item.discount_price !== null ? item.discount_price : item.price;
              return (
                <div key={item.id || item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.quantity}x {item.name}
                  </span>
                  <span style={{ fontWeight: 'bold' }}>{formatPrice(price * item.quantity)}</span>
                </div>
              );
            })}
          </div>

          <div className="summary-row">
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <div className="summary-row">
            <span style={{ color: 'var(--text-secondary)' }}>VAT (5%)</span>
            <span>{formatPrice(tax)}</span>
          </div>

          <div className="summary-row">
            <span style={{ color: 'var(--text-secondary)' }}>Delivery Fee</span>
            <span>{formatPrice(shippingFee)}</span>
          </div>

          {couponCode && (
            <div className="summary-row" style={{ color: 'var(--success)' }}>
              <span>Coupon Discount ({couponDiscountPercent}%)</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}

          {loyaltyDiscount.hasDiscount && (
            <div className="summary-row" style={{ color: 'var(--success)', fontWeight: 'bold' }}>
              <span>Automatic 10% Loyalty Discount</span>
              <span>-{formatPrice(loyaltyDiscountAmount)}</span>
            </div>
          )}

          <div className="summary-row summary-total" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', margin: '16px 0 0 0' }}>
            <span>Grand Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          <button 
            onClick={handlePlaceOrder}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '20px' }}
          >
            Pay & Place Order
          </button>
        </aside>
      </div>

      {showVerificationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            position: 'relative'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-glow)',
                color: 'var(--primary)',
                marginBottom: '16px'
              }}>
                <Phone size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
                Verify Phone Number
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                We've sent a 6-digit verification code to <strong style={{ color: 'var(--text-primary)' }}>{contactNumber}</strong>. Please enter it below to confirm your identity.
              </p>
            </div>

            {smsError && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: 'var(--danger-glow)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--danger)',
                fontSize: '0.85rem',
                textAlign: 'center'
              }}>
                {smsError}
              </div>
            )}

            <form onSubmit={handleVerifySmsToken} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: '8px' }}>
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="------"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    letterSpacing: '12px',
                    fontSize: '1.8rem',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-secondary)',
                    outline: 'none',
                    width: '200px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowVerificationModal(false);
                    setSmsCode('');
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingSms || smsCode.length < 6}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {verifyingSms ? (
                    'Verifying...'
                  ) : (
                    'Verify & Proceed'
                  )}
                </button>
              </div>
            </form>

            <div style={{ textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Didn't receive the code?{' '}
              </span>
              <button
                type="button"
                disabled={sendingSms}
                onClick={handleSendSmsToken}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                {sendingSms ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
