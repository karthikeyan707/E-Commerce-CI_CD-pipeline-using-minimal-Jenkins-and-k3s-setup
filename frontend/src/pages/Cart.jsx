import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [placingOrder, setPlacingOrder] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!user) {
      alert('Please login to place an order');
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setPlacingOrder(true);
    try {
      const orderData = {
        userId: user.id,
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      };

      await axios.post('/api/orders', orderData);
      alert('Order placed successfully!');
      clearCart();
      navigate('/orders');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const styles = {
    container: {
      padding: '20px 0'
    },
    title: {
      fontSize: '32px',
      marginBottom: '30px',
      color: '#2c3e50'
    },
    empty: {
      textAlign: 'center',
      padding: '60px 20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      color: '#7f8c8d'
    },
    item: {
      display: 'flex',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      marginBottom: '15px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    image: {
      width: '80px',
      height: '80px',
      backgroundColor: '#ecf0f1',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '32px',
      marginRight: '20px'
    },
    details: {
      flex: 1
    },
    name: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '5px'
    },
    price: {
      color: '#27ae60',
      fontSize: '16px',
      fontWeight: '500'
    },
    quantity: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginRight: '20px'
    },
    qtyButton: {
      width: '32px',
      height: '32px',
      border: '2px solid #3498db',
      backgroundColor: 'white',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold'
    },
    qtyInput: {
      width: '50px',
      textAlign: 'center',
      padding: '5px',
      border: '2px solid #e0e0e0',
      borderRadius: '6px',
      fontSize: '16px'
    },
    removeButton: {
      padding: '10px 20px',
      backgroundColor: '#e74c3c',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer'
    },
    summary: {
      backgroundColor: 'white',
      padding: '25px',
      borderRadius: '12px',
      marginTop: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    total: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '20px',
      color: '#2c3e50'
    },
    checkoutButton: {
      width: '100%',
      padding: '16px',
      backgroundColor: '#27ae60',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '18px',
      cursor: 'pointer',
      fontWeight: 'bold'
    },
    disabledButton: {
      backgroundColor: '#95a5a6',
      cursor: 'not-allowed'
    }
  };

  if (cartItems.length === 0) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Shopping Cart</h1>
        <div style={styles.empty}>
          <p style={{ fontSize: '48px', marginBottom: '20px' }}>🛒</p>
          <p style={{ fontSize: '20px' }}>Your cart is empty</p>
          <button
            onClick={() => navigate('/')}
            style={{ ...styles.checkoutButton, marginTop: '20px', maxWidth: '200px' }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Shopping Cart ({cartItems.length} items)</h1>
      {cartItems.map(item => (
        <div key={item.id} style={styles.item}>
          <div style={styles.image}>📦</div>
          <div style={styles.details}>
            <div style={styles.name}>{item.name}</div>
            <div style={styles.price}>${item.price} each</div>
          </div>
          <div style={styles.quantity}>
            <button
              style={styles.qtyButton}
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
            >
              -
            </button>
            <span style={{ fontSize: '16px', fontWeight: '500' }}>{item.quantity}</span>
            <button
              style={styles.qtyButton}
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
            >
              +
            </button>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginRight: '20px', minWidth: '80px' }}>
            ${(item.price * item.quantity).toFixed(2)}
          </div>
          <button style={styles.removeButton} onClick={() => removeFromCart(item.id)}>
            Remove
          </button>
        </div>
      ))}
      <div style={styles.summary}>
        <div style={styles.total}>
          <span>Total:</span>
          <span>${getCartTotal().toFixed(2)}</span>
        </div>
        <button
          style={{
            ...styles.checkoutButton,
            ...(placingOrder || !user ? styles.disabledButton : {})
          }}
          onClick={handleCheckout}
          disabled={placingOrder || !user}
        >
          {placingOrder ? 'Placing Order...' : !user ? 'Login to Checkout' : 'Place Order'}
        </button>
      </div>
    </div>
  );
};

export default Cart;
