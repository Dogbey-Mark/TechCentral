import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ShieldCheck, Loader, AlertCircle } from 'lucide-react';

const PaymentGateway = () => {
  const { apiCall, formatPrice, clearCartLocal, showToast } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  const checkoutState = location.state || null;
  const reference = new URLSearchParams(window.location.search).get('reference');

  // Steps: 'initializing' -> 'verifying' -> 'error'
  const [step, setStep] = useState('initializing');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const initializationStarted = useRef(false);
  const verificationStarted = useRef(false);

  const initializePaystackPayment = async () => {
    setLoading(true);
    setStep('initializing');
    setError('');

    try {
      console.log('[Paystack] Initializing payment for total: ', checkoutState.total);
      const data = await apiCall('/orders/paystack/initialize', {
        method: 'POST',
        body: JSON.stringify({
          shipping_address: checkoutState.shipping_address,
          contact_number: checkoutState.contact_number,
          delivery_option: checkoutState.delivery_option,
          payment_method: checkoutState.payment_method,
          coupon_code: checkoutState.coupon_code
        })
      });

      if (data.authorization_url) {
        // Redirect directly to Paystack's hosted page!
        window.location.href = data.authorization_url;
      } else {
        throw new Error('Failed to retrieve Paystack authorization URL.');
      }
    } catch (err) {
      console.error('[Paystack Init Error]', err);
      setError(err.message || 'Failed to connect to Paystack.');
      showToast(err.message || 'Paystack initialization failed.', 'danger');
      setStep('error');
      setLoading(false);
    }
  };

  const verifyPaystackPayment = async (ref) => {
    setLoading(true);
    setStep('verifying');
    setError('');

    try {
      console.log('[Paystack] Verifying transaction reference:', ref);
      const data = await apiCall('/orders/paystack/verify', {
        method: 'POST',
        body: JSON.stringify({ reference: ref })
      });

      clearCartLocal();
      showToast('Payment successful! Order processed.', 'success');

      // Redirect to Confirmation page
      navigate(`/order-confirmation`, {
        state: {
          order_number: data.order_number,
          total_amount: data.total_amount,
          transaction_id: ref
        }
      });
    } catch (err) {
      console.error('[Paystack Verify Error]', err);
      setError(err.message || 'Payment verification failed.');
      showToast(err.message || 'Payment verification failed.', 'danger');
      setStep('error');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (verificationStarted.current) return;

    if (reference) {
      verificationStarted.current = true;
      verifyPaystackPayment(reference);
    } else {
      if (!checkoutState) {
        navigate('/cart');
        return;
      }
      if (initializationStarted.current) return;
      initializationStarted.current = true;
      initializePaystackPayment();
    }
  }, [reference, checkoutState]);

  return (
    <div style={{ padding: '80px 0', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="payment-sim-box" style={{ 
        maxWidth: '480px', 
        width: '100%', 
        padding: '40px', 
        backgroundColor: 'var(--surface)', 
        border: '1px solid var(--border)', 
        borderRadius: 'var(--radius-lg)', 
        boxShadow: 'var(--shadow-lg)', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div>
          <h2 style={{ fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>Paystack Payment Gateway</h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '0.85rem', fontWeight: '600' }}>
            <ShieldCheck size={16} /> 256-bit Secure Transaction
          </div>
        </div>

        {step === 'initializing' && (
          <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Loader className="spinner" size={40} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
            <h4 style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Redirecting to Paystack...</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              We are connecting you securely to Paystack to complete your payment of {checkoutState ? <strong style={{ color: 'var(--primary)' }}>{formatPrice(checkoutState.total)}</strong> : ''}.
            </p>
          </div>
        )}

        {step === 'verifying' && (
          <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Loader className="spinner" size={40} style={{ color: 'var(--success)', animation: 'spin 1s linear infinite' }} />
            <h4 style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Verifying Payment Status...</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Confirming transaction reference <strong>{reference}</strong>. Please do not close or refresh this page.
            </p>
          </div>
        )}

        {step === 'error' && (
          <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <AlertCircle size={48} style={{ color: 'var(--danger)' }} />
            <h4 style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Payment Action Failed</h4>
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'var(--danger-glow)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              width: '100%'
            }}>
              {error}
            </div>
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button onClick={() => navigate('/checkout')} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }}>
                Back to Checkout
              </button>
              {checkoutState && (
                <button onClick={initializePaystackPayment} className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
                  Retry Payment
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentGateway;
