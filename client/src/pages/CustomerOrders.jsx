import React, { useState, useEffect } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ShoppingBag, Calendar, CheckCircle, Package, Truck, Printer, Info } from 'lucide-react';

// Order Confirmation
export const OrderConfirmation = () => {
  const location = useLocation();
  const state = location.state || {};

  return (
    <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', padding: '40px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--surface)' }}>
      <div style={{ display: 'inline-flex', color: 'var(--success)', marginBottom: '20px' }}>
        <CheckCircle size={56} />
      </div>
      <h1 style={{ fontWeight: '800', fontSize: '2rem', marginBottom: '8px' }}>Order Confirmed!</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Thank you for shopping with TechCentral. Your payment transaction has been processed successfully.
      </p>

      <div style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'left', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Order Number:</span>
          <span style={{ fontWeight: 'bold' }}>{state.order_number || 'TC-827419'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Transaction ID:</span>
          <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{state.transaction_id || 'TXN-902847120'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Payment Status:</span>
          <span className="status-tag tag-success" style={{ fontSize: '0.65rem' }}>Paid</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <Link to="/order-history" className="btn btn-primary btn-sm">
          View Order History
        </Link>
        <Link to="/shop" className="btn btn-secondary btn-sm">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

// Order History List
export const OrderHistory = () => {
  const { apiCall, formatPrice, showToast } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCall('/orders')
      .then(setOrders)
      .catch(err => showToast(err.message, 'danger'))
      .finally(() => setLoading(false));
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'tag-pending';
      case 'Delivered': return 'tag-success';
      case 'Cancelled': return 'tag-danger';
      default: return 'tag-info';
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px 60px 20px' }}>
      <h1 className="section-title" style={{ marginBottom: '30px' }}>My Orders</h1>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ borderTopColor: 'var(--primary)' }}></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="category-card" style={{ padding: '60px', textAlign: 'center' }}>
          <ShoppingBag size={32} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>You have not placed any orders yet.</p>
          <Link to="/shop" className="btn btn-primary btn-sm" style={{ marginTop: '20px' }}>Start Shopping</Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Date</th>
                <th>Payment Status</th>
                <th>Shipping Status</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 'bold' }}>{order.order_number}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-tag ${order.payment_status === 'Paid' ? 'tag-success' : 'tag-pending'}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td>
                    <span className={`status-tag ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{formatPrice(order.total_amount)}</td>
                  <td>
                    <Link to={`/orders/${order.id}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                      Details
                    </Link>
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

// Order Details View & Timeline & Invoice Generator
export const OrderDetails = () => {
  const { id } = useParams();
  const { apiCall, formatPrice, showToast } = useAppContext();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCall(`/orders/${id}`)
      .then(setOrder)
      .catch(err => showToast(err.message, 'danger'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <div className="spinner" style={{ borderTopColor: 'var(--primary)' }}></div>
      </div>
    );
  }

  if (!order) {
    return <div className="category-card" style={{ padding: '60px', textAlign: 'center' }}>Order not found.</div>;
  }

  // Define steps
  const orderSteps = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered'];
  const currentStepIndex = orderSteps.indexOf(order.status);

  // Simulated Invoice printer function
  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>TechCentral Invoice - ${order.order_number}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #ddd; padding-bottom: 20px; }
            .meta { margin: 20px 0; }
            .table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .table th { background: #f5f5f5; }
            .totals { float: right; margin-top: 30px; width: 300px; }
            .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h2>TECHCENTRAL GADGET STORE</h2>
              <p>Spintex Road, Accra, Ghana</p>
            </div>
            <div>
              <h1>INVOICE</h1>
              <p>Invoice: <b>${order.order_number}</b></p>
              <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div class="meta">
            <h4>Billing / Shipping To:</h4>
            <p>${order.shipping_address}</p>
            <p><b>Contact:</b> ${order.contact_number}</p>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.name} (${item.sku})</td>
                  <td>${formatPrice(item.unit_price)}</td>
                  <td>${item.quantity}</td>
                  <td>${formatPrice(item.unit_price * item.quantity)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div><span>Delivery Fee:</span> <b>${formatPrice(order.shipping_fee)}</b></div>
            <div style="border-top: 2px solid #ddd; padding-top: 10px; font-size: 1.25rem;">
              <span>Total Paid:</span> <b>${formatPrice(order.total_amount)}</b>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px 60px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 className="section-title" style={{ margin: 0 }}>Order Details</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Reference: <b>{order.order_number}</b> | Placed: {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <button onClick={handlePrintInvoice} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Printer size={14} /> Print Invoice
        </button>
      </div>

      {/* Visual Tracking Progress Timeline */}
      {order.status !== 'Cancelled' && (
        <div style={{ 
          backgroundColor: 'var(--surface)', 
          border: '1px solid var(--border)', 
          borderRadius: '16px', 
          padding: '30px', 
          marginBottom: '30px'
        }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '24px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} /> Shipping Timeline Status
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', flexWrap: 'wrap', gap: '20px' }}>
            {orderSteps.map((step, idx) => {
              const isPast = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1, minWidth: '80px', position: 'relative' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isPast ? 'var(--primary)' : 'var(--bg-secondary)',
                    color: isPast ? 'white' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    border: isCurrent ? '3px solid var(--primary-glow)' : 'none',
                    zIndex: 2
                  }}>
                    {idx + 1}
                  </div>
                  <span style={{ 
                    marginTop: '8px', 
                    fontSize: '0.8rem', 
                    fontWeight: isCurrent ? 'bold' : '500',
                    color: isCurrent ? 'var(--primary)' : 'var(--text-secondary)'
                  }}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
        {/* Items Grid */}
        <div className="table-container" style={{ margin: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Gadget</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={item.image_url} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                        <small style={{ color: 'var(--text-muted)' }}>{item.sku}</small>
                      </div>
                    </div>
                  </td>
                  <td>{formatPrice(item.unit_price)}</td>
                  <td>{item.quantity}</td>
                  <td style={{ fontWeight: 'bold' }}>{formatPrice(item.unit_price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Shipping address details & recap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ padding: '24px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--surface)' }}>
            <h4 style={{ fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} /> Delivery Information
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <b>Recipient Address:</b><br />
              {order.shipping_address}<br /><br />
              <b>Contact Dispatch Phone:</b><br />
              {order.contact_number}
            </p>
          </div>

          <div style={{ padding: '24px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--surface)' }}>
            <h4 style={{ fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} /> Payment Recap
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Option:</span>
                <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{order.payment_method}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span className="status-tag tag-success" style={{ fontSize: '0.65rem' }}>{order.payment_status}</span>
              </div>
              {order.payment && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Transaction Reference:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{order.payment.transaction_id}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px', fontWeight: 'bold' }}>
                <span>Total Amount Paid:</span>
                <span style={{ color: 'var(--primary)' }}>{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
