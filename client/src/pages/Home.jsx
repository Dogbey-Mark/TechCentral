import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  Laptop, 
  Smartphone, 
  Printer, 
  Tablet, 
  Keyboard, 
  Star, 
  TrendingUp, 
  Clock, 
  Truck, 
  ShieldCheck, 
  ArrowRight,
  ShoppingCart,
  Sparkles,
  Award,
  RotateCcw,
  Play,
  HelpCircle,
  Percent,
  CheckCircle
} from 'lucide-react';

const Home = () => {
  const { apiCall, formatPrice, addToCart, checkLoyaltyDiscountStatus, user } = useAppContext();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Loyalty Tracker States
  const [loyaltyStatus, setLoyaltyStatus] = useState({ orderCount: 0, hasDiscount: false });
  const [checkingLoyalty, setCheckingLoyalty] = useState(false);

  // Gadget Finder Quiz States
  const [quizStep, setQuizStep] = useState(0); // 0: intro, 1: category, 2: useCase, 3: budget, 4: results
  const [quizAnswers, setQuizAnswers] = useState({ category: '', useCase: '', budget: '' });
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  // Countdown timer for Flash Sale
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 5 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          clearInterval(timer);
          return { hours: 0, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch products and load details
  useEffect(() => {
    apiCall('/products')
      .then(data => {
        setAllProducts(data);
        // Featured highlights
        setFeaturedProducts(data.slice(0, 8));
        // Flash sale products (those with discount price)
        const withDiscounts = data.filter(p => p.discount_price !== null);
        setFlashSaleProducts(withDiscounts.length > 0 ? withDiscounts : data.slice(0, 6));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load products', err);
        setLoading(false);
      });
  }, []);

  // Fetch customer loyalty status
  useEffect(() => {
    if (user) {
      setCheckingLoyalty(true);
      checkLoyaltyDiscountStatus()
        .then(setLoyaltyStatus)
        .catch(console.error)
        .finally(() => setCheckingLoyalty(false));
    } else {
      setLoyaltyStatus({ orderCount: 0, hasDiscount: false });
    }
  }, [user]);

  // Quiz recommender filtering logic
  const handleQuizAnswer = (key, value) => {
    setQuizAnswers(prev => ({ ...prev, [key]: value }));
    setQuizStep(prev => prev + 1);
  };

  const handleQuizSubmit = (category, useCase, budget) => {
    const filtered = allProducts.filter(prod => {
      // 1. Filter by category
      if (category === 'laptops' && prod.category_name !== 'Laptops') return false;
      if (category === 'phones' && prod.category_name !== 'Phones') return false;
      if (category === 'printers' && prod.category_name !== 'Printers') return false;
      if (category === 'desktop-computers' && prod.category_name !== 'Desktop Computers') return false;

      // 2. Filter by use case
      const specString = prod.specifications ? prod.specifications.toLowerCase() : '';
      const nameDesc = (prod.name + ' ' + prod.description).toLowerCase();
      
      if (useCase === 'gaming') {
        const isGaming = specString.includes('rtx') || specString.includes('gpu') || nameDesc.includes('gaming') || nameDesc.includes('rog') || nameDesc.includes('alienware') || nameDesc.includes('pro max');
        if (!isGaming) return false;
      } else if (useCase === 'work') {
        const isWork = specString.includes('ram') || nameDesc.includes('pro') || nameDesc.includes('laserjet') || nameDesc.includes('ecotank') || nameDesc.includes('office') || nameDesc.includes('professional');
        if (!isWork) return false;
      }

      // 3. Filter by budget
      const price = prod.discount_price !== null ? prod.discount_price : prod.price;
      if (budget === 'under500' && price >= 500) return false;
      if (budget === 'midrange' && (price < 500 || price > 1500)) return false;
      if (budget === 'premium' && price <= 1500) return false;

      return true;
    });

    setRecommendedProducts(filtered.slice(0, 3));
    setQuizStep(4);
  };

  // Helper to calculate percentage discount
  const getPercentCut = (price, discPrice) => {
    if (!discPrice) return null;
    const diff = price - discPrice;
    return Math.round((diff / price) * 100);
  };

  const sideCategories = [
    { name: 'Supermarket Deals', slug: 'accessories', icon: <Percent size={14} /> },
    { name: 'Laptops & Computing', slug: 'laptops', icon: <Laptop size={14} /> },
    { name: 'Phones & Tablets', slug: 'phones', icon: <Smartphone size={14} /> },
    { name: 'Smart Printers', slug: 'printers', icon: <Printer size={14} /> },
    { name: 'Accessories & Inputs', slug: 'accessories', icon: <Keyboard size={14} /> }
  ];

  return (
    <div style={{ paddingBottom: '40px' }}>
      
      {/* JUMIA THREE-COLUMN HERO SECTOR */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: '240px 1fr 220px', 
        gap: '16px', 
        marginTop: '16px',
        maxHeight: '380px'
      }}>
        {/* Left Column: Category Index Menu */}
        <div style={{ 
          backgroundColor: 'var(--surface)', 
          borderRadius: '4px', 
          border: '1px solid var(--border)',
          padding: '12px 0',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {sideCategories.map(cat => (
            <Link 
              key={cat.name} 
              to={`/shop?category=${cat.slug}`} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                fontSize: '0.825rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                transition: 'all var(--transition-fast)'
              }}
              className="side-menu-link"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#f68b1e';
                e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ color: '#f68b1e', display: 'flex', alignItems: 'center' }}>{cat.icon}</span>
              <span>{cat.name}</span>
            </Link>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 'auto', padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ⚡ 24h Express Shipping
          </div>
        </div>

        {/* Center Column: Sliding Graphic Banner */}
        <div style={{ 
          position: 'relative', 
          borderRadius: '4px', 
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)',
            zIndex: 1,
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            color: 'white'
          }}>
            <span style={{ color: '#f68b1e', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
              OFFICIAL TECH CENTRAL STORE
            </span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', lineHeight: '1.2', marginBottom: '12px' }}>
              UP TO 30% OFF<br />ON SMART GADGETS
            </h1>
            <p style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '24px', maxWidth: '380px' }}>
              Compile compiles compilation Compiling. Get genuine laptops, titanium iPhones, and LaserJet printers with full warranty protection.
            </p>
            <Link to="/shop" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 24px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: '700', fontSize: '0.85rem' }}>
              Shop Now <ArrowRight size={16} />
            </Link>
          </div>
          <img 
            src="https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80" 
            alt="Dell XPS Laptop Creative Showcase" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Right Column: Support / Selling Info Boxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ 
            flexGrow: 1, 
            backgroundColor: 'var(--surface)', 
            borderRadius: '4px', 
            border: '1px solid var(--border)',
            padding: '16px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f68b1e', fontWeight: '700', fontSize: '0.85rem' }}>
              <HelpCircle size={18} />
              <span>HELP CENTER</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Need assistance? Chat with <strong>Toby the admin</strong> live using the Support Assistant bubble!
            </p>
            <button 
              onClick={() => {
                const bubble = document.querySelector('button[title="Chat Support Assistant"]');
                if (bubble) bubble.click();
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', marginTop: 'auto', padding: '6px', fontWeight: '700', width: '100%' }}
            >
              GET LIVE SUPPORT
            </button>
          </div>

          <div style={{ 
            flexGrow: 1, 
            backgroundColor: 'var(--surface)', 
            borderRadius: '4px', 
            border: '1px solid var(--border)',
            padding: '16px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38a25c', fontWeight: '700', fontSize: '0.85rem' }}>
              <Truck size={18} />
              <span>EASY RETURNS</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Shop with confidence! Enjoy a hassle-free 7-day return policy for any factory defects.
            </p>
            <Link 
              to="/terms" 
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', marginTop: 'auto', padding: '6px', fontWeight: '700', textAlign: 'center' }}
            >
              READ POLICY
            </Link>
          </div>
        </div>
      </section>

      {/* JUMIA QUICK LINKS CIRCLES ROW */}
      <section style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: 'var(--surface)', 
        padding: '20px 30px', 
        borderRadius: '4px', 
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        margin: '24px 0',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <Link to="/shop" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '90px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(246,139,30,0.12)', color: '#f68b1e', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <Percent size={20} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>Super Deals</span>
        </Link>
        <Link to="/shop?category=laptops" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '90px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(56,162,92,0.12)', color: '#38a25c', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <Laptop size={20} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>Computers</span>
        </Link>
        <Link to="/shop?category=phones" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '90px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(42,133,232,0.12)', color: '#2a85e8', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <Smartphone size={20} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>Phones</span>
        </Link>
        <Link to="/about" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '90px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(224,58,58,0.12)', color: '#e03a3a', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>Warranty</span>
        </Link>
        <a href="#loyalty-bar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '90px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(246,139,30,0.12)', color: '#f68b1e', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <Award size={20} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>Loyalty progress</span>
        </a>
      </section>

      {/* JUMIA RED FLASH SALES SLIDER */}
      <section style={{ 
        backgroundColor: '#e03a3a', 
        borderRadius: '4px', 
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px'
      }}>
        {/* Red header with timer */}
        <div style={{ 
          padding: '12px 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          color: 'white',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>FLASH SALES</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold' }}>
            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>TIME LEFT:</span>
            <div style={{ backgroundColor: 'white', color: '#e03a3a', borderRadius: '3px', padding: '3px 6px', fontSize: '0.85rem' }}>{timeLeft.hours.toString().padStart(2, '0')}h</div>
            <span>:</span>
            <div style={{ backgroundColor: 'white', color: '#e03a3a', borderRadius: '3px', padding: '3px 6px', fontSize: '0.85rem' }}>{timeLeft.minutes.toString().padStart(2, '0')}m</div>
            <span>:</span>
            <div style={{ backgroundColor: 'white', color: '#e03a3a', borderRadius: '3px', padding: '3px 6px', fontSize: '0.85rem' }}>{timeLeft.seconds.toString().padStart(2, '0')}s</div>
          </div>
        </div>

        {/* Horizontal Slider Content */}
        <div style={{ 
          backgroundColor: 'var(--surface)', 
          padding: '16px', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
          gap: '12px' 
        }}>
          {flashSaleProducts.slice(0, 6).map(prod => {
            const pct = getPercentCut(prod.price, prod.discount_price);
            return (
              <div key={prod.id} className="product-card" style={{ 
                border: '1px solid var(--border)', 
                borderRadius: '4px',
                padding: '10px',
                backgroundColor: 'var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}>
                {pct && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(224,58,58,0.12)',
                    color: '#e03a3a',
                    padding: '2px 6px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    borderRadius: '2px',
                    zIndex: 2
                  }}>
                    -{pct}%
                  </span>
                )}
                <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <img src={prod.image_url} alt={prod.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
                <Link to={`/products/${prod.id}`} style={{ 
                  fontSize: '0.8rem', 
                  color: 'var(--text-primary)', 
                  fontWeight: '600',
                  height: '32px',
                  overflow: 'hidden',
                  lineHeight: '1.2',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  {prod.name}
                </Link>
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {formatPrice(prod.discount_price !== null ? prod.discount_price : prod.price)}
                  </span>
                  {prod.discount_price !== null && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      {formatPrice(prod.price)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* LOYALTY STATUS BAR */}
      <div id="loyalty-bar">
        <section style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '24px 30px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(246,139,30,0.12)',
              color: '#f68b1e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Award size={20} />
            </div>
            <div>
              <h3 style={{ fontWeight: '800', fontSize: '1.05rem', margin: 0, textTransform: 'uppercase', color: 'var(--text-primary)' }}>Loyalty Discount Status</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Unlock a permanent 10% discount on all purchases.</p>
            </div>
          </div>

          {checkingLoyalty ? (
            <div className="spinner" style={{ borderTopColor: 'var(--primary)', width: '24px', height: '24px' }}></div>
          ) : !user ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Sign in to track your completed orders and unlock your lifetime 10% discount!
              </span>
              <Link to="/login" className="btn btn-secondary btn-sm" style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 'bold' }}>Sign In / Register</Link>
            </div>
          ) : loyaltyStatus.hasDiscount ? (
            <div style={{ 
              backgroundColor: 'rgba(56,162,92,0.1)', 
              border: '1px solid #38a25c', 
              borderRadius: '4px', 
              padding: '14px', 
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🎉 Awesome! You have placed {loyaltyStatus.orderCount} orders. Your Lifetime 10% Loyalty Discount is UNLOCKED and will automatically apply at checkout!
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600' }}>
                <span>Progress: {loyaltyStatus.orderCount} / 4 Orders placed</span>
                <span style={{ color: '#f68b1e' }}>{Math.min(100, Math.round((loyaltyStatus.orderCount / 4) * 100))}% Completed</span>
              </div>
              
              {/* Progress Bar */}
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '4px', 
                overflow: 'hidden',
                marginBottom: '12px'
              }}>
                <div style={{ 
                  width: `${Math.min(100, (loyaltyStatus.orderCount / 4) * 100)}%`, 
                  height: '100%', 
                  backgroundColor: '#f68b1e',
                  transition: 'width 0.5s ease-out'
                }} />
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Place <strong>{4 - loyaltyStatus.orderCount} more {4 - loyaltyStatus.orderCount === 1 ? 'order' : 'orders'}</strong> to unlock the lifetime 10% loyalty discount!
              </p>
            </div>
          )}
        </section>
      </div>

      {/* DYNAMIC RECOMMENDER QUIZ WIZARD */}
      <section style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '30px 40px',
        margin: '24px 0',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(246,139,30,0.06)', filter: 'blur(65px)', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f68b1e', fontWeight: '800', fontSize: '0.75rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Sparkles size={16} /> SHOPPING ASSISTANT
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Find Your Ideal Gadget</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '600px', fontSize: '0.85rem' }}>
            Answer three quick questions to narrow down our inventory and receive instant, personalized recommendations tailored to your exact needs and budget.
          </p>

          {/* STEP 0: INTRO */}
          {quizStep === 0 && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <button 
                onClick={() => {
                  setQuizAnswers({ category: '', useCase: '', budget: '' });
                  setQuizStep(1);
                }} 
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '0.85rem', fontWeight: 'bold', borderRadius: '4px' }}
              >
                Start Gadget Finder <Play size={16} />
              </button>
            </div>
          )}

          {/* STEP 1: CATEGORY */}
          {quizStep === 1 && (
            <div>
              <h4 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '0.95rem' }}>1. What type of device are you looking for?</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                <button onClick={() => handleQuizAnswer('category', 'laptops')} className="category-card" style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: '4px' }}>
                  <Laptop size={24} style={{ color: '#f68b1e', marginBottom: '8px' }} />
                  <span style={{ fontSize: '0.85rem' }}>Laptop</span>
                </button>
                <button onClick={() => handleQuizAnswer('category', 'phones')} className="category-card" style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: '4px' }}>
                  <Smartphone size={24} style={{ color: '#f68b1e', marginBottom: '8px' }} />
                  <span style={{ fontSize: '0.85rem' }}>Smartphone</span>
                </button>
                <button onClick={() => handleQuizAnswer('category', 'printers')} className="category-card" style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: '4px' }}>
                  <Printer size={24} style={{ color: '#f68b1e', marginBottom: '8px' }} />
                  <span style={{ fontSize: '0.85rem' }}>Smart Printer</span>
                </button>
                <button onClick={() => handleQuizAnswer('category', 'desktop-computers')} className="category-card" style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: '4px' }}>
                  <Laptop size={24} style={{ color: '#f68b1e', marginBottom: '8px' }} />
                  <span style={{ fontSize: '0.85rem' }}>Desktop Computer</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: USE CASE */}
          {quizStep === 2 && (
            <div>
              <h4 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '0.95rem' }}>2. What is your primary use case?</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <button onClick={() => handleQuizAnswer('useCase', 'work')} className="category-card" style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border)', textAlign: 'center', borderRadius: '4px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '0.85rem' }}>Office & Work</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Focus on productivity, multi-tasking, & document printing</span>
                </button>
                <button onClick={() => handleQuizAnswer('useCase', 'gaming')} className="category-card" style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border)', textAlign: 'center', borderRadius: '4px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '0.85rem' }}>Gaming & Graphics</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Focus on high frame rates, GPU speeds, and rendering power</span>
                </button>
                <button onClick={() => handleQuizAnswer('useCase', 'general')} className="category-card" style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border)', textAlign: 'center', borderRadius: '4px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '0.85rem' }}>General Everyday Use</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Focus on web browsing, streaming, and great value</span>
                </button>
              </div>
              <button onClick={() => setQuizStep(1)} className="btn btn-secondary btn-sm" style={{ marginTop: '20px' }}><RotateCcw size={14} /> Back</button>
            </div>
          )}

          {/* STEP 3: BUDGET */}
          {quizStep === 3 && (
            <div>
              <h4 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '0.95rem' }}>3. What is your budget range?</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <button onClick={() => {
                  const ans = { ...quizAnswers, budget: 'under500' };
                  setQuizAnswers(ans);
                  handleQuizSubmit(ans.category, ans.useCase, 'under500');
                }} className="category-card" style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: '4px' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--success)' }}>Under $500</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Budget-friendly accessories and essential devices</span>
                </button>
                <button onClick={() => {
                  const ans = { ...quizAnswers, budget: 'midrange' };
                  setQuizAnswers(ans);
                  handleQuizSubmit(ans.category, ans.useCase, 'midrange');
                }} className="category-card" style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: '4px' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f68b1e' }}>$500 - $1,500</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mid-range professional laptops, phones, and printers</span>
                </button>
                <button onClick={() => {
                  const ans = { ...quizAnswers, budget: 'premium' };
                  setQuizAnswers(ans);
                  handleQuizSubmit(ans.category, ans.useCase, 'premium');
                }} className="category-card" style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: '4px' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--danger)' }}>Over $1,500</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>High-performance flagship workstations and gaming rigs</span>
                </button>
              </div>
              <button onClick={() => setQuizStep(2)} className="btn btn-secondary btn-sm" style={{ marginTop: '20px' }}><RotateCcw size={14} /> Back</button>
            </div>
          )}

          {/* STEP 4: RESULTS */}
          {quizStep === 4 && (
            <div>
              <h4 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '0.95rem' }}>Recommended for You:</h4>
              
              {recommendedProducts.length === 0 ? (
                <div style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No exact matches found in our current stock matching these exact filters. Try choosing a different budget or use case.
                </div>
              ) : (
                <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  {recommendedProducts.map(prod => (
                    <div key={prod.id} className="product-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <div className="product-card-img-wrapper" style={{ height: '140px' }}>
                        <img src={prod.image_url} alt={prod.name} className="product-card-img" style={{ maxHeight: '120px' }} />
                      </div>
                      <div className="product-card-body" style={{ padding: '15px' }}>
                        <span className="product-card-brand">{prod.brand_name}</span>
                        <Link to={`/products/${prod.id}`} className="product-card-title" style={{ fontSize: '0.85rem', height: '40px', overflow: 'hidden' }}>
                          {prod.name}
                        </Link>
                        <div className="product-card-price-row" style={{ marginTop: '10px' }}>
                          <span className="price" style={{ fontSize: '1rem', fontWeight: '800' }}>
                            {formatPrice(prod.discount_price !== null ? prod.discount_price : prod.price)}
                          </span>
                          <button onClick={() => addToCart(prod, 1)} className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>Buy Now</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                <button 
                  onClick={() => {
                    setQuizAnswers({ category: '', useCase: '', budget: '' });
                    setQuizStep(1);
                  }} 
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.8rem' }}
                >
                  <RotateCcw size={14} /> Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* JUMIA STYLE FEATURED HIGHLIGHTS GRID */}
      <section style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '4px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '24px'
      }}>
        <div className="section-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, color: 'var(--text-primary)' }}>Featured Highlights</h2>
          <Link to="/shop" style={{ color: '#f68b1e', fontWeight: '700', fontSize: '0.85rem' }}>
            SEE ALL PRODUCTS
          </Link>
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" style={{ borderTopColor: 'var(--primary)', width: '36px', height: '36px' }}></div>
          </div>
        ) : (
          <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {featuredProducts.map(prod => {
              const pct = getPercentCut(prod.price, prod.discount_price);
              return (
                <div key={prod.id} className="product-card" style={{ 
                  borderRadius: '4px', 
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  position: 'relative',
                  transition: 'all var(--transition-fast)'
                }}>
                  {prod.featured === 1 && (
                    <span className="badge-featured" style={{ 
                      borderRadius: '2px', 
                      top: '8px', 
                      left: '8px', 
                      fontSize: '0.65rem', 
                      fontWeight: '700',
                      padding: '2px 6px',
                      backgroundColor: '#f68b1e'
                    }}>
                      FEATURED
                    </span>
                  )}
                  {pct && (
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: 'rgba(224,58,58,0.12)',
                      color: '#e03a3a',
                      padding: '2px 6px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      borderRadius: '2px',
                      zIndex: 2
                    }}>
                      -{pct}%
                    </span>
                  )}
                  <div className="product-card-img-wrapper" style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
                    <img src={prod.image_url} alt={prod.name} className="product-card-img" style={{ maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <div className="product-card-body" style={{ padding: '12px' }}>
                    <span className="product-card-brand" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prod.brand_name}</span>
                    <Link to={`/products/${prod.id}`} className="product-card-title" style={{ fontSize: '0.85rem', fontWeight: '600', height: '36px', overflow: 'hidden', display: 'block', margin: '4px 0 8px 0' }}>
                      {prod.name}
                    </Link>
                    <div className="product-card-rating" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', marginBottom: '8px' }}>
                      <Star size={12} fill="currentColor" style={{ color: '#f68b1e' }} />
                      <span style={{ fontWeight: '600' }}>{(prod.avg_rating || 5.0).toFixed(1)} ({prod.reviews_count || 1})</span>
                    </div>
                    <div className="product-card-price-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="price-container" style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="price" style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                          {formatPrice(prod.discount_price !== null ? prod.discount_price : prod.price)}
                        </span>
                        {prod.discount_price !== null && (
                          <span className="original-price" style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                            {formatPrice(prod.price)}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => addToCart(prod, 1)} 
                        className="btn btn-primary btn-icon"
                        title="Add to Cart"
                        style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: '#f68b1e', color: 'white' }}
                      >
                        <ShoppingCart size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Jumia Style Client Testimonials */}
      <section style={{ marginTop: '50px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '1.2rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Customer Success Stories</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '4px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', color: '#f68b1e', gap: '2px', marginBottom: '12px' }}>
              <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
            </div>
            <p style={{ fontStyle: 'italic', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              "The MacBook Pro I purchased from TechCentral has been an absolute compiler workhorse. Fast shipping to Kumasi, and customer checkout was very straightforward."
            </p>
            <span style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--text-primary)' }}>Emmanuel A.</span>
          </div>
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '4px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', color: '#f68b1e', gap: '2px', marginBottom: '12px' }}>
              <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
            </div>
            <p style={{ fontStyle: 'italic', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              "I bought an Epson EcoTank printer for our office showroom. Incredible ink capacity, and the loyalty check system immediately gave us a discount on our subsequent orders!"
            </p>
            <span style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--text-primary)' }}>Faustina B.</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
