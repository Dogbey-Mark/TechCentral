import React, { createContext, useState, useEffect, useContext } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  
  // Cart & Wishlist state
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  
  // Currency state
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'USD'); // USD or GHS
  const conversionRate = 15.0; // 1 USD = 15 GHS

  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  // Base API URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Toast logic
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // API Call Wrapper
  const apiCall = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err.message);
      throw err;
    }
  };

  // Fetch initial profile & synchronizations
  useEffect(() => {
    if (token) {
      // Get profile
      apiCall('/auth/me')
        .then(profile => {
          setUser(profile);
          fetchCart();
          fetchWishlist();
        })
        .catch(err => {
          // Token expired or invalid
          logout();
          showToast('Session expired. Please log in again.', 'warning');
        });
    } else {
      // Guest localstorage cart loading
      const localCart = JSON.parse(localStorage.getItem('guest_cart')) || [];
      setCart(localCart);
    }
  }, [token]);

  // Auth Operations
  const login = async (email, password) => {
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      showToast(`Welcome back, ${data.user.first_name}!`, 'success');
      
      // Sync guest cart to server
      const localCart = JSON.parse(localStorage.getItem('guest_cart')) || [];
      if (localCart.length > 0) {
        for (const item of localCart) {
          try {
            await apiCall('/orders/cart', {
              method: 'POST',
              body: JSON.stringify({ product_id: item.product_id, quantity: item.quantity })
            });
          } catch (e) {
            console.error('Error syncing cart item:', e);
          }
        }
        localStorage.removeItem('guest_cart');
      }
      
      return data.user;
    } catch (err) {
      showToast(err.message, 'danger');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      showToast('Registration successful!', 'success');
      return data.user;
    } catch (err) {
      showToast(err.message, 'danger');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCart([]);
    setWishlist([]);
    showToast('Logged out successfully.', 'info');
  };

  const updateProfile = async (profileData) => {
    try {
      await apiCall('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      setUser(prev => ({ ...prev, ...profileData }));
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'danger');
      throw err;
    }
  };

  // Cart Operations
  const fetchCart = async () => {
    if (!token) return;
    try {
      const data = await apiCall('/orders/cart');
      setCart(data);
    } catch (err) {
      console.error('Failed to load cart', err);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    const qty = parseInt(quantity);
    if (!token) {
      // LocalStorage Cart (Guest Mode)
      setCart(prev => {
        const existingIndex = prev.findIndex(item => item.product_id === product.id);
        let updated = [...prev];
        if (existingIndex > -1) {
          updated[existingIndex].quantity += qty;
        } else {
          updated.push({
            product_id: product.id,
            quantity: qty,
            name: product.name,
            price: product.price,
            discount_price: product.discount_price,
            image_url: product.image_url,
            stock: product.stock,
            sku: product.sku
          });
        }
        localStorage.setItem('guest_cart', JSON.stringify(updated));
        return updated;
      });
      showToast('Added to cart (Guest mode)', 'success');
      return;
    }

    try {
      await apiCall('/orders/cart', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id, quantity: qty })
      });
      await fetchCart();
      showToast('Added to cart!', 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const updateCartQuantity = async (cartItemId, product_id, newQty) => {
    if (newQty < 1) return;
    if (!token) {
      setCart(prev => {
        const updated = prev.map(item => 
          item.product_id === product_id ? { ...item, quantity: newQty } : item
        );
        localStorage.setItem('guest_cart', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    try {
      await apiCall(`/orders/cart/${cartItemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: newQty })
      });
      await fetchCart();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const removeFromCart = async (cartItemId, product_id) => {
    if (!token) {
      setCart(prev => {
        const updated = prev.filter(item => item.product_id !== product_id);
        localStorage.setItem('guest_cart', JSON.stringify(updated));
        return updated;
      });
      showToast('Removed from cart.', 'info');
      return;
    }

    try {
      await apiCall(`/orders/cart/${cartItemId}`, {
        method: 'DELETE'
      });
      await fetchCart();
      showToast('Removed from cart.', 'info');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const clearCartLocal = () => {
    setCart([]);
    localStorage.removeItem('guest_cart');
  };

  // Wishlist Operations
  const fetchWishlist = async () => {
    if (!token) return;
    try {
      const data = await apiCall('/orders/wishlist');
      setWishlist(data);
    } catch (err) {
      console.error('Failed to load wishlist', err);
    }
  };

  const addToWishlist = async (product) => {
    if (!token) {
      showToast('Please log in to use your wishlist.', 'warning');
      return;
    }

    try {
      await apiCall('/orders/wishlist', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id })
      });
      await fetchWishlist();
      showToast('Added to wishlist!', 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const removeFromWishlist = async (wishlistId) => {
    if (!token) return;
    try {
      await apiCall(`/orders/wishlist/${wishlistId}`, {
        method: 'DELETE'
      });
      await fetchWishlist();
      showToast('Removed from wishlist.', 'info');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  // Format price helper
  const formatPrice = (priceVal) => {
    if (priceVal === null || priceVal === undefined) return '';
    const numberVal = parseFloat(priceVal);
    if (currency === 'GHS') {
      return `₵${(numberVal * conversionRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${numberVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const toggleCurrency = () => {
    const newCurr = currency === 'USD' ? 'GHS' : 'USD';
    setCurrency(newCurr);
    localStorage.setItem('currency', newCurr);
  };

  const checkLoyaltyDiscountStatus = async () => {
    if (!token) return { orderCount: 0, hasDiscount: false };
    try {
      return await apiCall('/orders/discount-check');
    } catch (err) {
      console.error('Failed to check discount status', err);
      return { orderCount: 0, hasDiscount: false };
    }
  };

  return (
    <AppContext.Provider value={{
      theme,
      toggleTheme,
      token,
      user,
      login,
      register,
      logout,
      updateProfile,
      cart,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCartLocal,
      fetchCart,
      wishlist,
      addToWishlist,
      removeFromWishlist,
      currency,
      toggleCurrency,
      formatPrice,
      toasts,
      showToast,
      apiCall,
      API_URL,
      checkLoyaltyDiscountStatus
    }}>
      {children}
      {/* Visual Toast Messages */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{marginLeft: '12px', fontSize: '14px', opacity: 0.7}}>✕</button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};
