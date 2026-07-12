import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';


export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: 'Do you deliver outside of Accra?',
      a: 'Yes, we offer nationwide express delivery across Ghana (Accra, Kumasi, Takoradi, Tamale, etc.) and selected international destinations. Shipping fees are calculated at checkout.'
    },
    {
      q: 'What payment options do you support?',
      a: 'We support Ghanaian Mobile Money (MTN Mobile Money, Telecel Cash, AirtelTigo Money) via simulated OTP checkout, and international cards (Visa, Mastercard, Stripe) or PayPal.'
    },
    {
      q: 'What is your warranty policy?',
      a: 'All our laptops and phones come with official manufacturer warranties ranging from 1 to 3 years. Check the product specifications tab for details on each product.'
    },
    {
      q: 'Can I return an item?',
      a: 'Yes, items can be returned within 7 days of delivery if they are in original packaging and have verified hardware issues.'
    }
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', paddingBottom: '60px' }}>
      <h1 className="section-title" style={{ textAlign: 'center', marginBottom: '30px' }}>Frequently Asked Questions</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div 
              key={i} 
              style={{ border: '1px solid var(--border)', borderRadius: '12px', backgroundColor: 'var(--surface)', overflow: 'hidden' }}
            >
              <button 
                onClick={() => setOpenIndex(isOpen ? null : i)}
                style={{ 
                  width: '100%', 
                  padding: '20px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  fontWeight: 'bold', 
                  fontSize: '1.05rem', 
                  textAlign: 'left',
                  backgroundColor: isOpen ? 'var(--bg-secondary)' : 'transparent'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <HelpCircle size={18} style={{ color: 'var(--primary)' }} />
                  {faq.q}
                </span>
                <span>{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div style={{ padding: '20px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', lineHeight: '1.6' }}>
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


export const About = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', paddingBottom: '60px', lineHeight: '1.6' }}>
      <h1 className="section-title" style={{ textAlign: 'center', marginBottom: '20px' }}>About TechCentral</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', textAlign: 'center', marginBottom: '40px' }}>
        We are Ghana’s premier digital electronics hub, supplying high-performance gadgets to professionals, developers, students, and businesses since 2020.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', margin: '40px 0' }}>
        <div className="category-card" style={{ padding: '24px', textAlign: 'left' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '10px', color: 'var(--primary)' }}>Our Mission</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            To make authentic tech accessible by providing guaranteed manufacturer warranties, secure local payments, and premium customer service.
          </p>
        </div>
        <div className="category-card" style={{ padding: '24px', textAlign: 'left' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '10px', color: 'var(--success)' }}>Our Quality Guarantee</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            We deal directly with manufacturers and verified distributors of HP, Dell, Apple, Samsung, Canon, and Epson to protect clients from counterfeits.
          </p>
        </div>
      </div>
    </div>
  );
};


export const Contact = () => {
  const { showToast } = useAppContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      showToast('Thank you! Your inquiry was sent successfully. An agent will call you soon.', 'success');
      setName('');
      setEmail('');
      setMsg('');
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', paddingBottom: '60px' }}>
      <h1 className="section-title" style={{ textAlign: 'center', marginBottom: '30px' }}>Contact TechCentral</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '40px', alignItems: 'start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="category-card" style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'row', gap: '16px' }}>
            <div className="category-icon-wrapper"><Phone size={18} /></div>
            <div>
              <h4 style={{ fontWeight: 'bold' }}>Phone Support</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>+233 24 000 0000</p>
            </div>
          </div>

          <div className="category-card" style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'row', gap: '16px' }}>
            <div className="category-icon-wrapper"><Mail size={18} /></div>
            <div>
              <h4 style={{ fontWeight: 'bold' }}>Sales Email</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>sales@techcentral.com</p>
            </div>
          </div>

          <div className="category-card" style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'row', gap: '16px' }}>
            <div className="category-icon-wrapper"><MapPin size={18} /></div>
            <div>
              <h4 style={{ fontWeight: 'bold' }}>HQ Showroom</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Spintex Road, Accra, Ghana</p>
            </div>
          </div>
        </div>

        
        <div style={{ padding: '30px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--surface)' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '20px' }}>Drop Us a Message</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <span className="form-label">Full Name</span>
              <input type="text" className="form-input" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <span className="form-label">Email Address</span>
              <input type="email" className="form-input" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <span className="form-label">Write your message here</span>
              <textarea rows="4" className="form-input" required value={msg} onChange={(e) => setMsg(e.target.value)}></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Sending...' : <><Send size={16} /> Send Message</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


export const Terms = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', paddingBottom: '60px', lineHeight: '1.6' }}>
      <h1 className="section-title" style={{ marginBottom: '20px' }}>Terms of Service</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>Last Updated: July 2, 2026</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--text-secondary)' }}>
        <section>
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '8px' }}>1. Scope of Service</h3>
          <p>TechCentral sells physical gadget hardware including laptops, smartphones, and printers. By placing an order, you agree to these legal conditions.</p>
        </section>
        <section>
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '8px' }}>2. Pricing and Currency</h3>
          <p>Product prices displayed on this website are shown in USD or conversion GHS. We reserve the right to alter pricing catalogs due to market availability changes.</p>
        </section>
      </div>
    </div>
  );
};


export const Privacy = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', paddingBottom: '60px', lineHeight: '1.6' }}>
      <h1 className="section-title" style={{ marginBottom: '20px' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>Last Updated: July 2, 2026</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--text-secondary)' }}>
        <section>
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '8px' }}>Data Collection</h3>
          <p>We process standard profile email records, shipping addresses, and order histories to deliver your orders successfully. Payment information is processed securely through gateway systems.</p>
        </section>
      </div>
    </div>
  );
};
