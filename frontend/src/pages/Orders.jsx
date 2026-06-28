import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`/api/orders/user/${user.id}`);
      setOrders(response.data.orders || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load orders');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': '#f39c12',
      'PROCESSING': '#3498db',
      'SHIPPED': '#9b59b6',
      'DELIVERED': '#27ae60',
      'CANCELLED': '#e74c3c'
    };
    return colors[status] || '#7f8c8d';
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
    order: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '25px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    orderHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px',
      paddingBottom: '15px',
      borderBottom: '2px solid #ecf0f1'
    },
    orderId: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#2c3e50'
    },
    status: {
      padding: '6px 16px',
      borderRadius: '20px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      textTransform: 'lowercase'
    },
    date: {
      color: '#7f8c8d',
      fontSize: '14px',
      marginBottom: '15px'
    },
    items: {
      marginBottom: '15px'
    },
    item: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid #ecf0f1'
    },
    itemName: {
      color: '#2c3e50'
    },
    itemQty: {
      color: '#7f8c8d'
    },
    total: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#2c3e50',
      paddingTop: '15px',
      borderTop: '2px solid #ecf0f1'
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading orders...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>{error}</div>;

  if (orders.length === 0) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>My Orders</h1>
        <div style={styles.empty}>
          <p style={{ fontSize: '48px', marginBottom: '20px' }}>📭</p>
          <p style={{ fontSize: '20px' }}>No orders yet</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>My Orders</h1>
      {orders.map(order => (
        <div key={order.id} style={styles.order}>
          <div style={styles.orderHeader}>
            <span style={styles.orderId}>Order #{order.id.slice(0, 8)}</span>
            <span style={{ ...styles.status, backgroundColor: getStatusColor(order.status) }}>
              {order.status}
            </span>
          </div>
          <div style={styles.date}>
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          <div style={styles.items}>
            {order.items?.map((item, idx) => (
              <div key={idx} style={styles.item}>
                <span style={styles.itemName}>{item.productName}</span>
                <span style={styles.itemQty}>
                  {item.quantity} × ${item.unitPrice}
                </span>
              </div>
            ))}
          </div>
          <div style={styles.total}>
            <span>Total</span>
            <span>${order.totalAmount}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Orders;
